import SwiftUI
import WebKit
import Speech
import AVFoundation

@main
struct BlackwoodApp: App {
    var body: some Scene {
        WindowGroup {
            GameView()
                .ignoresSafeArea()
                .preferredColorScheme(.dark)
                .statusBarHidden(true)
        }
    }
}

/// SwiftUI wrapper around a UIKit view controller so we can pin the web view to
/// the keyboard layout guide (smooth resize) and host the speech bridge.
struct GameView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> GameViewController { GameViewController() }
    func updateUIViewController(_ vc: GameViewController, context: Context) {}
}

final class GameViewController: UIViewController {
    private var webView: WKWebView!
    private var speechBridge: SpeechBridge?

    override func viewDidLoad() {
        super.viewDidLoad()
        let bg = UIColor(red: 5/255, green: 8/255, blue: 5/255, alpha: 1)
        view.backgroundColor = bg

        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(AppSchemeHandler(), forURLScheme: "app")
        config.websiteDataStore = .default()

        // Native speech-to-text bridge, exposed to JS as window.webkit.messageHandlers.speech
        let bridge = SpeechBridge()
        let ucc = WKUserContentController()
        ucc.add(bridge, name: "speech")
        config.userContentController = ucc
        speechBridge = bridge

        webView = WKWebView(frame: .zero, configuration: config)
        bridge.webView = webView
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isOpaque = false
        webView.backgroundColor = bg
        webView.scrollView.backgroundColor = bg
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        #endif
        view.addSubview(webView)

        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: safe.topAnchor),
            webView.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor),
        ])

        if let url = URL(string: "app://local/index.html") {
            webView.load(URLRequest(url: url))
        }
    }
}

// MARK: - Speech-to-text bridge (native SFSpeechRecognizer -> JS)

final class SpeechBridge: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?

    func userContentController(_ uc: WKUserContentController, didReceive message: WKScriptMessage) {
        let action = (message.body as? [String: Any])?["action"] as? String
            ?? (message.body as? String)
        switch action {
        case "start": start()
        case "stop":  stop()
        default:      break
        }
    }

    private func jsSend(_ text: String, final: Bool) {
        let arr = (try? JSONSerialization.data(withJSONObject: [text]))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "[\"\"]"
        let js = "window.__speech && window.__speech(\(arr)[0], \(final ? "true" : "false"));"
        DispatchQueue.main.async { self.webView?.evaluateJavaScript(js, completionHandler: nil) }
    }
    private func jsEnd() {
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript("window.__speechEnd && window.__speechEnd();", completionHandler: nil)
        }
    }

    private var wantsListening = false
    private var accumulated = ""
    private var lastPartial = ""

    // Start a fresh push-to-talk session (keeps listening until the user stops).
    private func start() {
        SFSpeechRecognizer.requestAuthorization { auth in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                DispatchQueue.main.async {
                    guard auth == .authorized, granted,
                          let rec = self.recognizer, rec.isAvailable else { self.jsEnd(); return }
                    self.accumulated = ""
                    self.lastPartial = ""
                    self.wantsListening = true
                    self.beginSegment()
                }
            }
        }
    }

    private func beginSegment() {
        teardownEngine()
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .default,
                                    options: [.duckOthers, .defaultToSpeaker, .allowBluetooth])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
        } catch { finishAndStop(); return }

        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        request = req

        let node = audioEngine.inputNode
        let format = node.outputFormat(forBus: 0)
        node.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            req.append(buffer)
        }
        audioEngine.prepare()
        do { try audioEngine.start() } catch { finishAndStop(); return }

        task = recognizer?.recognitionTask(with: req) { [weak self] result, error in
            guard let self = self else { return }
            if let result = result {
                self.lastPartial = result.bestTranscription.formattedString
                self.jsSend((self.accumulated + self.lastPartial).trimmingCharacters(in: .whitespaces), final: false)
                if result.isFinal {
                    // A pause finalized this segment — fold it in and keep listening
                    // (so we don't cut the user off mid-thought).
                    self.accumulated += self.lastPartial + " "
                    self.lastPartial = ""
                    if self.wantsListening {
                        DispatchQueue.main.async { self.beginSegment() }
                    }
                }
            }
            // Ignore errors (usually our own segment cancel); the user taps mic to stop.
        }
    }

    private func teardownEngine() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        request?.endAudio()
        task?.cancel()
        request = nil
        task = nil
    }

    // Called when the user taps the mic again (stop) — submit the full transcript.
    func stop() { finishAndStop() }

    private func finishAndStop() {
        wantsListening = false
        let text = (accumulated + lastPartial).trimmingCharacters(in: .whitespacesAndNewlines)
        teardownEngine()
        // Hand the audio session back to playback so Gary's TTS still works.
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, options: [.duckOthers])
        try? session.setActive(true, options: .notifyOthersOnDeactivation)
        jsSend(text, final: true)
        jsEnd()
    }
}

// MARK: - App:// scheme handler (serves the bundled web game offline)

final class AppSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else {
            task.didFailWithError(URLError(.badURL)); return
        }
        var path = url.path
        if path.hasPrefix("/") { path.removeFirst() }
        if path.isEmpty { path = "index.html" }

        let full = "www/" + path
        let ns = full as NSString
        let dir = ns.deletingLastPathComponent
        let file = ns.lastPathComponent as NSString
        let name = file.deletingPathExtension
        let ext = file.pathExtension

        guard let fileURL = Bundle.main.url(forResource: name, withExtension: ext,
                                            subdirectory: dir.isEmpty ? "www" : dir),
              let data = try? Data(contentsOf: fileURL) else {
            task.didFailWithError(URLError(.fileDoesNotExist)); return
        }

        let response = HTTPURLResponse(
            url: url, statusCode: 200, httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": Self.mime(for: ext),
                           "Content-Length": String(data.count)])!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    static func mime(for ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js", "mjs":   return "text/javascript; charset=utf-8"
        case "css":         return "text/css; charset=utf-8"
        case "json":        return "application/json"
        case "png":         return "image/png"
        case "svg":         return "image/svg+xml"
        case "ico":         return "image/x-icon"
        default:            return "application/octet-stream"
        }
    }
}
