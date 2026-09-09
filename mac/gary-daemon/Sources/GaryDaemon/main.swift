// GaryDaemon — exposes Apple's on-device Foundation Model to the browser build
// of Blackwood Manor, so Gary can actually think while you play on a Mac.
//
// Listens on 127.0.0.1:8138 only. Nothing is sent off the machine; the model
// runs entirely on-device and needs no API key or network.
//
//   GET  /health  -> {"ok":true,"model":"available"}
//   POST /gary    -> {"instructions":"...","prompt":"..."} => {"text":"..."}
//
// The web page reaches this via js/gary-brain.js. Note that a page served over
// HTTPS cannot call a plain-http local server (mixed content), so this is for
// local play over http://localhost — the native iOS/macOS app uses the
// in-process bridge instead and does not need this daemon.

import Foundation
import FoundationModels
import Network

let port: NWEndpoint.Port = 8138

// MARK: - Model

actor Gary {
    /// Deliberately STATELESS: a fresh session per request.
    ///
    /// Reusing a session keeps the KV cache warm and is ~1s faster, but a session
    /// accumulates its whole transcript and this model drifts as that grows. Two
    /// distinct drifts were measured: first Gary stopped being broke ("my job pays
    /// well", "a certain satisfaction in solving puzzles"), and after ~15 turns he
    /// slid into mystical free verse ("I am a prisoner of this mansion") — which
    /// also breaks the rule that he has never been inside it. Capping turns per
    /// session reduced but did not remove it.
    ///
    /// Everything the model needs is already in `instructions` + `prompt`, rebuilt
    /// from deterministic game state every turn, so there is nothing to gain by
    /// carrying history. Statelessness makes drift structurally impossible and
    /// costs ~1s, which on a phone call reads as Gary pausing anyway.
    func reply(instructions: String, prompt: String) async throws -> String {
        let session = LanguageModelSession(instructions: instructions)
        // Slightly hot sampling: at default temperature the small model parrots
        // its own few-shot examples almost verbatim.
        let options = GenerationOptions(sampling: .random(top: 40, seed: nil), temperature: 1.0)
        return try await session.respond(to: prompt, options: options).content
    }
}

let gary = Gary()

// MARK: - Tiny HTTP

struct Request {
    var method = ""
    var path = ""
    var body = Data()
}

func parseRequest(_ data: Data) -> Request? {
    guard let headerEnd = data.range(of: Data("\r\n\r\n".utf8)) else { return nil }
    let head = String(decoding: data[..<headerEnd.lowerBound], as: UTF8.self)
    var lines = head.components(separatedBy: "\r\n")
    guard !lines.isEmpty else { return nil }
    let parts = lines.removeFirst().split(separator: " ")
    guard parts.count >= 2 else { return nil }

    var req = Request()
    req.method = String(parts[0])
    req.path = String(parts[1])

    var contentLength = 0
    for line in lines where line.lowercased().hasPrefix("content-length:") {
        contentLength = Int(line.dropFirst("content-length:".count).trimmingCharacters(in: .whitespaces)) ?? 0
    }
    let bodyStart = headerEnd.upperBound
    let available = data[bodyStart...]
    // Body not fully arrived yet — wait for more.
    if available.count < contentLength { return nil }
    req.body = Data(available.prefix(contentLength))
    return req
}

func httpResponse(_ status: String, json: Any) -> Data {
    let body = (try? JSONSerialization.data(withJSONObject: json)) ?? Data("{}".utf8)
    var head = "HTTP/1.1 \(status)\r\n"
    head += "Content-Type: application/json\r\n"
    head += "Content-Length: \(body.count)\r\n"
    // The game page is served from a different local port, so it is cross-origin.
    head += "Access-Control-Allow-Origin: *\r\n"
    head += "Access-Control-Allow-Headers: Content-Type\r\n"
    head += "Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n"
    head += "Connection: close\r\n\r\n"
    return Data(head.utf8) + body
}

func send(_ conn: NWConnection, _ data: Data) {
    conn.send(content: data, completion: .contentProcessed { _ in conn.cancel() })
}

func handle(_ conn: NWConnection, _ req: Request) {
    if req.method == "OPTIONS" {
        send(conn, httpResponse("204 No Content", json: [:]))
        return
    }
    if req.method == "GET", req.path.hasPrefix("/health") {
        let ok: Bool
        if case .available = SystemLanguageModel.default.availability { ok = true } else { ok = false }
        send(conn, httpResponse("200 OK", json: ["ok": ok, "model": ok ? "available" : "unavailable"]))
        return
    }
    if req.method == "POST", req.path.hasPrefix("/gary") {
        guard
            let obj = try? JSONSerialization.jsonObject(with: req.body) as? [String: Any],
            let instructions = obj["instructions"] as? String,
            let prompt = obj["prompt"] as? String
        else {
            send(conn, httpResponse("400 Bad Request", json: ["error": "expected {instructions, prompt}"]))
            return
        }
        Task {
            do {
                let text = try await gary.reply(instructions: instructions, prompt: prompt)
                send(conn, httpResponse("200 OK", json: ["text": text]))
            } catch {
                send(conn, httpResponse("500 Internal Server Error", json: ["error": "\(error)"]))
            }
        }
        return
    }
    send(conn, httpResponse("404 Not Found", json: ["error": "no such endpoint"]))
}

func receive(_ conn: NWConnection, buffer: Data = Data()) {
    conn.receive(minimumIncompleteLength: 1, maximumLength: 1 << 16) { chunk, _, isComplete, error in
        var buf = buffer
        if let chunk { buf.append(chunk) }
        if let error {
            FileHandle.standardError.write(Data("recv error: \(error)\n".utf8))
            conn.cancel()
            return
        }
        if let req = parseRequest(buf) {
            handle(conn, req)
        } else if isComplete {
            conn.cancel()
        } else {
            receive(conn, buffer: buf)   // keep reading until headers+body are whole
        }
    }
}

// MARK: - Boot

switch SystemLanguageModel.default.availability {
case .available:
    break
case .unavailable(let reason):
    FileHandle.standardError.write(Data("""
    gary-daemon: the on-device model is unavailable (\(reason)).
    Check that Apple Intelligence is enabled in System Settings, and that this is
    an Apple Silicon Mac running macOS 26 or later.

    """.utf8))
    exit(1)
@unknown default:
    break
}

let params = NWParameters.tcp
params.requiredLocalEndpoint = NWEndpoint.hostPort(host: .init("127.0.0.1"), port: port)
params.allowLocalEndpointReuse = true

guard let listener = try? NWListener(using: params) else {
    FileHandle.standardError.write(Data("gary-daemon: could not bind 127.0.0.1:\(port)\n".utf8))
    exit(1)
}

listener.newConnectionHandler = { conn in
    conn.start(queue: .global())
    receive(conn)
}
listener.stateUpdateHandler = { state in
    if case .ready = state {
        print("gary-daemon: listening on http://127.0.0.1:\(port) — on-device model ready")
    }
    if case .failed(let e) = state {
        FileHandle.standardError.write(Data("gary-daemon: listener failed: \(e)\n".utf8))
        exit(1)
    }
}
listener.start(queue: .main)
dispatchMain()
