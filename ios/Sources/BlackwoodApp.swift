import SwiftUI
import WebKit
import Speech
import AVFoundation
import UIKit

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

final class GameViewController: UIViewController, WKUIDelegate {
    private var webView: WKWebView!
    private var speechBridge: SpeechBridge?
    private var garyBridge: AnyObject?
    private var schemeHandler: AppSchemeHandler!
    private let contentStore = WebContentStore()
    private lazy var contentUpdater = WebContentUpdater(store: contentStore)
    private var pendingUpdateNotice: (from: String, to: String)?

    override func viewDidLoad() {
        super.viewDidLoad()
        let bg = UIColor(red: 5/255, green: 8/255, blue: 5/255, alpha: 1)
        view.backgroundColor = bg

        let config = WKWebViewConfiguration()
        schemeHandler = AppSchemeHandler(baseURL: contentStore.activeRoot())
        config.setURLSchemeHandler(schemeHandler, forURLScheme: "app")
        config.websiteDataStore = .default()

        // Native speech-to-text bridge, exposed to JS as window.webkit.messageHandlers.speech
        let bridge = SpeechBridge()
        let ucc = WKUserContentController()
        ucc.add(bridge, name: "speech")
        speechBridge = bridge

        // Gary's on-device brain (Apple Foundation Models). Registered ONLY when the
        // model is actually usable, because js/gary-brain.js decides whether to use
        // the native provider purely by testing for the existence of this handler —
        // registering it on an unsupported device would strand Gary on a dead bridge
        // instead of falling back to his canned lines.
        let report: ModelReport
        if #available(iOS 26.0, macOS 26.0, *) {
            report = GaryBridge.availabilityReport()
            if report.supported {
                let gb = GaryBridge()
                ucc.add(gb, name: "gary")
                garyBridge = gb
            }
        } else {
            report = ModelReport(
                supported: false, code: "osTooOld",
                detail: "This device is on an older OS. Gary's on-device voice needs iOS 26 or later.",
                fix: "Update to iOS 26 or later in Settings → General → Software Update.")
        }

        // Tell the web layer what the native side found, ALWAYS — including (in fact
        // especially) when the bridge was not registered. Without this the page can
        // only observe "no gary handler" and then falls through to its browser-oriented
        // reasoning, which on a phone produced the actively misleading advice to "add
        // ?llm to the URL" — there is no URL bar in an app. Injected at documentStart
        // so it is present before any module runs.
        ucc.addUserScript(WKUserScript(source: report.js,
                                       injectionTime: .atDocumentStart,
                                       forMainFrameOnly: true))

        config.userContentController = ucc

        webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = self
        webView.navigationDelegate = self
        bridge.webView = webView
        if #available(iOS 26.0, macOS 26.0, *) {
            (garyBridge as? GaryBridge)?.webView = webView
        }
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

        // Non-blocking self-update: the game is already on screen from the bundle
        // (or last cache); if GitHub Pages has something newer, fetch it into the
        // cache and reload into it. Offline or no-update => this quietly no-ops.
        let fromLabel = contentStore.activeLabel()
        contentUpdater.checkForUpdate { [weak self] result in
            guard let self, case .updated(let toLabel) = result else { return }
            DispatchQueue.main.async {
                self.pendingUpdateNotice = (from: fromLabel, to: toLabel)
                self.schemeHandler.baseURL = self.contentStore.cacheRoot
                if let url = URL(string: "app://local/index.html") {
                    self.webView.load(URLRequest(url: url,
                                                 cachePolicy: .reloadIgnoringLocalCacheData,
                                                 timeoutInterval: 30))
                }
            }
        }
    }

    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        guard navigationAction.targetFrame == nil,
              let url = navigationAction.request.url,
              ["http", "https"].contains(url.scheme?.lowercased() ?? "") else {
            return nil
        }
        UIApplication.shared.open(url)
        return nil
    }
}

// MARK: - Navigation delegate (announce a completed self-update to the web layer)

extension GameViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let notice = pendingUpdateNotice else { return }
        pendingUpdateNotice = nil
        let payload = (try? JSONSerialization.data(withJSONObject: [notice.from, notice.to]))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "[\"\",\"\"]"
        webView.evaluateJavaScript(
            "window.__appUpdateNotice && window.__appUpdateNotice.apply(null, \(payload));",
            completionHandler: nil)
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

// MARK: - Gary's on-device brain (Apple Foundation Models -> JS)
//
// JS posts { id, instructions, prompt } to window.webkit.messageHandlers.gary and
// we call back into window.__garyReply(id, text, error). Everything runs on-device;
// nothing leaves the phone, which is the whole point of Gary being private enough
// to say anything to.
//
// The model is a VOICE layer only — game facts (hints, the phone bill, Gary's arc)
// are computed in JS and never asked of the model. See web/js/gary-brain.js.

import FoundationModels

/// What the native side found out about the on-device model, in a form the web
/// layer can display verbatim. `fix` is the actionable half — the difference
/// between "not supported" (dead end) and "not switched on yet" (one tap away)
/// is the whole question a tester is asking, so never collapse them into a bool.
struct ModelReport {
    let supported: Bool
    let code: String
    let detail: String
    let fix: String

    var js: String {
        let payload: [String: Any] = [
            "supported": supported, "code": code, "detail": detail, "fix": fix,
        ]
        let json = (try? JSONSerialization.data(withJSONObject: payload))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "{\"supported\":false}"
        return "window.__garyNative = \(json);"
    }
}

@available(iOS 26.0, macOS 26.0, *)
final class GaryBridge: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?

    static func isModelAvailable() -> Bool { availabilityReport().supported }

    /// Map Apple's availability enum to something a human can act on.
    static func availabilityReport() -> ModelReport {
        switch SystemLanguageModel.default.availability {
        case .available:
            return ModelReport(
                supported: true, code: "available",
                detail: "Apple's on-device model is available. Gary's replies are written live on this device.",
                fix: "")
        case .unavailable(.deviceNotEligible):
            return ModelReport(
                supported: false, code: "deviceNotEligible",
                detail: "This iPhone doesn't support Apple Intelligence, so Gary can't think on-device. He'll use his scripted lines.",
                fix: "Nothing to fix — the on-device model needs a newer iPhone. The game plays fine scripted.")
        case .unavailable(.appleIntelligenceNotEnabled):
            return ModelReport(
                supported: false, code: "appleIntelligenceNotEnabled",
                detail: "This iPhone supports Apple Intelligence, but it isn't switched on — so Gary is scripted.",
                fix: "Turn it on in Settings → Apple Intelligence & Siri, then relaunch the game.")
        case .unavailable(.modelNotReady):
            return ModelReport(
                supported: false, code: "modelNotReady",
                detail: "Apple Intelligence is on, but the model is still downloading or preparing.",
                fix: "Wait for the download to finish (Settings → Apple Intelligence & Siri), then relaunch.")
        case .unavailable(let other):
            return ModelReport(
                supported: false, code: "unavailable",
                detail: "Apple's on-device model is unavailable on this device (\(other)).",
                fix: "Check Settings → Apple Intelligence & Siri, then relaunch.")
        }
    }

    func userContentController(_ uc: WKUserContentController, didReceive message: WKScriptMessage) {
        guard
            let body = message.body as? [String: Any],
            let id = body["id"] as? Int,
            let instructions = body["instructions"] as? String,
            let prompt = body["prompt"] as? String
        else { return }

        Task { [weak self] in
            guard let self else { return }
            do {
                let text = try await self.reply(instructions: instructions, prompt: prompt)
                self.callBack(id: id, text: text, error: nil)
            } catch {
                self.callBack(id: id, text: "", error: "\(error)")
            }
        }
    }

    @MainActor
    private func session(for instructions: String) -> LanguageModelSession {
        // Deliberately stateless — a fresh session per turn. A reused session
        // accumulates its transcript and this model drifts out of character as
        // that grows (measured: Gary claiming his job paid well, then sliding
        // into mystical free verse about a mansion he has never entered).
        // instructions + prompt are rebuilt from game state every turn, so there
        // is nothing to carry; this makes drift structurally impossible.
        LanguageModelSession(instructions: instructions)
    }

    private func reply(instructions: String, prompt: String) async throws -> String {
        let s = await session(for: instructions)
        // At default temperature the small model parrots its own few-shot examples.
        let options = GenerationOptions(sampling: .random(top: 40, seed: nil), temperature: 1.0)
        return try await s.respond(to: prompt, options: options).content
    }

    private func callBack(id: Int, text: String, error: String?) {
        // JSON-encode through an array so quotes/newlines can't break out of the JS.
        let payload: [Any] = [text, error ?? NSNull()]
        let json = (try? JSONSerialization.data(withJSONObject: payload))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "[\"\",null]"
        let js = "window.__garyReply && window.__garyReply(\(id), \(json)[0], \(json)[1]);"
        DispatchQueue.main.async { self.webView?.evaluateJavaScript(js, completionHandler: nil) }
    }
}
