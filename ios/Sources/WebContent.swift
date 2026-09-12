// WebContent.swift Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.
//
// The self-updating web-content layer for the iOS harness, kept in its own file
// (no SwiftUI / Speech / FoundationModels dependencies) so it can be unit-tested
// as plain logic. See BlackwoodManorTests.

import Foundation
import WebKit

// MARK: - App:// scheme handler (serves web content from a swappable directory)
//
// baseURL is the directory the game is served from: normally the copy baked into
// the app bundle (offline fallback), but swapped at runtime to a locally-cached
// copy downloaded from GitHub Pages when a newer version is published. See
// WebContentStore / WebContentUpdater below.

final class AppSchemeHandler: NSObject, WKURLSchemeHandler {
    var baseURL: URL
    init(baseURL: URL) { self.baseURL = baseURL }

    /// Pure request → file resolution, separated from WebKit so it can be tested
    /// directly. Returns nil for anything that shouldn't be served (traversal,
    /// missing file), which the scheme handler maps to a load failure.
    func resolve(requestPath: String) -> (data: Data, mime: String)? {
        var path = requestPath
        if path.hasPrefix("/") { path.removeFirst() }
        if path.isEmpty { path = "index.html" }
        // Refuse any traversal out of the served directory.
        guard !path.contains("..") else { return nil }
        let fileURL = baseURL.appendingPathComponent(path)
        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        return (data, Self.mime(for: (path as NSString).pathExtension))
    }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else {
            task.didFailWithError(URLError(.badURL)); return
        }
        guard let resolved = resolve(requestPath: url.path) else {
            task.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let response = HTTPURLResponse(
            url: url, statusCode: 200, httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": resolved.mime,
                           "Content-Length": String(resolved.data.count)])!
        task.didReceive(response)
        task.didReceive(resolved.data)
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

// MARK: - Self-updating web content (offline-first: bundle is fallback, Pages is latest)
//
// The iOS app is a thin native harness around the web game, so it can pick up new
// gameplay without a fresh TestFlight build: on launch it version-checks the copy
// published to GitHub Pages and, if that's newer than what's baked in (or last
// cached), downloads it into a local cache and serves from there. Everything is
// non-blocking — the game shows instantly from bundle/cache and only reloads if a
// newer version actually finishes downloading — so it works fully offline.

struct WebManifest: Decodable {
    let version: Int      // commit timestamp; monotonic, so higher == newer
    let label: String     // human-readable, e.g. "2026.9.11 build 62 · abc1234"
    let files: [String]   // runtime files, relative to the web root
}

final class WebContentStore {
    static let remoteBase = URL(string: "https://dhackel-games.github.io/blackwood-manor/")!

    let bundleRoot: URL   // .../www baked into the app bundle
    let cacheRoot: URL    // Application Support/webcache

    // Roots are injectable so tests can point them at scratch directories.
    init(bundleRoot: URL? = nil, cacheRoot: URL? = nil) {
        self.bundleRoot = bundleRoot ?? (Bundle.main.resourceURL ?? Bundle.main.bundleURL)
            .appendingPathComponent("www", isDirectory: true)
        if let cacheRoot {
            self.cacheRoot = cacheRoot
        } else {
            let support = (try? FileManager.default.url(
                for: .applicationSupportDirectory, in: .userDomainMask,
                appropriateFor: nil, create: true)) ?? FileManager.default.temporaryDirectory
            self.cacheRoot = support.appendingPathComponent("webcache", isDirectory: true)
        }
    }

    func manifest(at root: URL) -> WebManifest? {
        guard let data = try? Data(contentsOf: root.appendingPathComponent("manifest.json")) else { return nil }
        return try? JSONDecoder().decode(WebManifest.self, from: data)
    }

    var bundleVersion: Int { manifest(at: bundleRoot)?.version ?? -1 }
    var cacheVersion: Int { manifest(at: cacheRoot)?.version ?? -1 }
    var currentVersion: Int { max(bundleVersion, cacheVersion) }

    /// The directory to serve right now: the cache if it's newer than the bundle,
    /// otherwise the bundle. If the bundle is newer (a fresh TestFlight build that
    /// shipped newer web code than we last cached), drop the stale cache.
    func activeRoot() -> URL {
        if cacheVersion > bundleVersion { return cacheRoot }
        if cacheVersion >= 0 { try? FileManager.default.removeItem(at: cacheRoot) }
        return bundleRoot
    }

    /// Human label of whatever we're actually about to serve.
    func activeLabel() -> String { manifest(at: activeRoot())?.label ?? "unknown" }
}

final class WebContentUpdater {
    enum UpdateResult: Equatable { case upToDate, updated(label: String), failed }

    private let store: WebContentStore
    private let session: URLSession

    // Session is injectable so tests can stub the network with a URLProtocol.
    init(store: WebContentStore, session: URLSession? = nil) {
        self.store = store
        if let session {
            self.session = session
        } else {
            let cfg = URLSessionConfiguration.ephemeral   // don't let HTTP caching hide a fresh deploy
            cfg.requestCachePolicy = .reloadIgnoringLocalCacheData
            cfg.timeoutIntervalForRequest = 15
            self.session = URLSession(configuration: cfg)
        }
    }

    func checkForUpdate(completion: @escaping (UpdateResult) -> Void) {
        let manifestURL = WebContentStore.remoteBase.appendingPathComponent("manifest.json")
        session.dataTask(with: manifestURL) { [weak self] data, resp, _ in
            guard let self else { return }
            guard let data,
                  (resp as? HTTPURLResponse)?.statusCode == 200,
                  let remote = try? JSONDecoder().decode(WebManifest.self, from: data),
                  remote.version > self.store.currentVersion else {
                completion(.upToDate); return
            }
            self.downloadBundle(remote, manifestData: data) { ok in
                completion(ok ? .updated(label: remote.label) : .failed)
            }
        }.resume()
    }

    private func downloadBundle(_ manifest: WebManifest, manifestData: Data,
                                completion: @escaping (Bool) -> Void) {
        let fm = FileManager.default
        let staging = fm.temporaryDirectory
            .appendingPathComponent("webcache-\(UUID().uuidString)", isDirectory: true)
        do { try fm.createDirectory(at: staging, withIntermediateDirectories: true) }
        catch { completion(false); return }

        let group = DispatchGroup()
        let lock = NSLock()
        var ok = true

        for rel in manifest.files {
            if rel.contains("..") { ok = false; continue }
            group.enter()
            let fileURL = WebContentStore.remoteBase.appendingPathComponent(rel)
            session.dataTask(with: fileURL) { data, resp, _ in
                defer { group.leave() }
                guard let data, (resp as? HTTPURLResponse)?.statusCode == 200 else {
                    lock.lock(); ok = false; lock.unlock(); return
                }
                let dest = staging.appendingPathComponent(rel)
                do {
                    try fm.createDirectory(at: dest.deletingLastPathComponent(),
                                           withIntermediateDirectories: true)
                    try data.write(to: dest, options: .atomic)
                } catch {
                    lock.lock(); ok = false; lock.unlock()
                }
            }.resume()
        }

        group.notify(queue: .global()) {
            guard ok else { try? fm.removeItem(at: staging); completion(false); return }
            // Store the manifest verbatim so cacheVersion/label match the download exactly.
            do { try manifestData.write(to: staging.appendingPathComponent("manifest.json"), options: .atomic) }
            catch { try? fm.removeItem(at: staging); completion(false); return }
            // Swap the freshly-downloaded bundle into place. Only after a fully
            // successful download, so a dropped connection never corrupts the cache.
            do {
                try? fm.createDirectory(at: self.store.cacheRoot.deletingLastPathComponent(),
                                        withIntermediateDirectories: true)
                try? fm.removeItem(at: self.store.cacheRoot)
                try fm.moveItem(at: staging, to: self.store.cacheRoot)
                completion(true)
            } catch {
                try? fm.removeItem(at: staging)
                completion(false)
            }
        }
    }
}
