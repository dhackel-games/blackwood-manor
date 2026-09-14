// WebContent.swift. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven.

import Foundation
import WebKit

final class AppSchemeHandler: NSObject, WKURLSchemeHandler {
    var baseURL: URL
    init(baseURL: URL) { self.baseURL = baseURL }

    func resolve(requestPath: String) -> (data: Data, mime: String)? {
        var path = requestPath
        if path.hasPrefix("/") { path.removeFirst() }
        if path.isEmpty { path = "index.html" }
        guard !path.contains("..") else { return nil }
        let fileURL = baseURL.appendingPathComponent(path)
        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        return (data, Self.mime(for: (path as NSString).pathExtension))
    }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else {
            task.didFailWithError(URLError(.badURL))
            return
        }
        guard let resolved = resolve(requestPath: url.path) else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        let response = HTTPURLResponse(
            url: url, statusCode: 200, httpVersion: "HTTP/1.1",
            headerFields: [
                "Content-Type": resolved.mime,
                "Content-Length": String(resolved.data.count),
            ])!
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

struct WebContentRelease: Equatable {
    let appVersion: String
    let build: Int
    let contentVersion: Int64
    let latestAppBuildAvailable: Int64
    let files: [String]

    var label: String { "\(appVersion) build \(build)" }
    var sortKey: Int64 { contentVersion }

    private struct VersionDocument: Decodable {
        let appVersion: String
        let build: String
        let contentVersion: Int64
        let latestAppBuildAvailable: Int64
        let contentFiles: [String]

        enum CodingKeys: String, CodingKey {
            case appVersion = "APP_VERSION"
            case build = "BUILD"
            case contentVersion = "CONTENT_VERSION"
            case latestAppBuildAvailable = "LATEST_APP_BUILD_AVAILABLE"
            case contentFiles = "CONTENT_FILES"
        }
    }

    static func isSafeRelativePath(_ path: String) -> Bool {
        guard !path.isEmpty,
              !path.hasPrefix("/"),
              !path.contains("\\"),
              !path.contains("?"),
              !path.contains("#") else {
            return false
        }
        let parts = path.split(separator: "/", omittingEmptySubsequences: false)
        return parts.allSatisfy { !$0.isEmpty && $0 != "." && $0 != ".." }
    }

    static func contentVersion(appVersion: String, build: Int) -> Int64? {
        let rawParts = appVersion.split(separator: ".")
        guard rawParts.count == 3 else { return nil }
        let parsedParts = rawParts.map { Int($0) }
        guard parsedParts.allSatisfy({ $0 != nil }) else { return nil }
        let parts = parsedParts.map { $0! }
        guard (1000...9999).contains(parts[0]),
              (1...12).contains(parts[1]),
              (1...31).contains(parts[2]),
              (0...999).contains(build) else {
            return nil
        }
        return Int64(String(format: "%04d%02d%02d%03d",
                            parts[0], parts[1], parts[2], build))
    }

    static func parse(_ data: Data) -> WebContentRelease? {
        guard let document = try? JSONDecoder().decode(VersionDocument.self, from: data),
              let build = Int(document.build),
              document.contentVersion == Self.contentVersion(
                  appVersion: document.appVersion, build: build),
              document.contentFiles.contains("index.html"),
              document.contentFiles.contains("versions.json"),
              document.contentFiles.allSatisfy(Self.isSafeRelativePath),
              Set(document.contentFiles).count == document.contentFiles.count else {
            return nil
        }
        return WebContentRelease(
            appVersion: document.appVersion, build: build,
            contentVersion: document.contentVersion,
            latestAppBuildAvailable: document.latestAppBuildAvailable,
            files: document.contentFiles)
    }
}

final class WebContentStore {
    static let remoteBase = URL(string: "https://dhackel-games.github.io/blackwood-manor/")!

    let bundleRoot: URL
    let cacheRoot: URL

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

    func contentRelease(at root: URL) -> WebContentRelease? {
        let file = root.appendingPathComponent("versions.json")
        guard let data = try? Data(contentsOf: file),
              let release = WebContentRelease.parse(data) else {
            return nil
        }
        let fileManager = FileManager.default
        for relativePath in release.files {
            let resource = root.appendingPathComponent(relativePath)
            var isDirectory: ObjCBool = false
            guard fileManager.fileExists(atPath: resource.path, isDirectory: &isDirectory),
                  !isDirectory.boolValue,
                  fileManager.isReadableFile(atPath: resource.path) else {
                return nil
            }
        }
        return release
    }

    var bundleRelease: WebContentRelease? { contentRelease(at: bundleRoot) }
    var cacheRelease: WebContentRelease? { contentRelease(at: cacheRoot) }

    func activeRoot() -> URL {
        cacheRelease == nil ? bundleRoot : cacheRoot
    }

    func activeLabel() -> String {
        contentRelease(at: activeRoot())?.label ?? "unknown"
    }

    @discardableResult
    func ensureCacheFromBundle() -> Bool {
        guard let bundled = bundleRelease else {
            return cacheRelease != nil
        }
        if let cached = cacheRelease, cached.sortKey >= bundled.sortKey {
            return true
        }
        return seedCacheFromBundle()
    }

    @discardableResult
    func seedCacheFromBundle() -> Bool {
        let fm = FileManager.default
        let staging = fm.temporaryDirectory
            .appendingPathComponent("webcache-bundle-\(UUID().uuidString)", isDirectory: true)
        do {
            try fm.copyItem(at: bundleRoot, to: staging)
            return replaceCache(with: staging)
        } catch {
            try? fm.removeItem(at: staging)
            return false
        }
    }

    @discardableResult
    func replaceCache(with staging: URL) -> Bool {
        let fm = FileManager.default
        guard contentRelease(at: staging) != nil else {
            try? fm.removeItem(at: staging)
            return false
        }
        let parent = cacheRoot.deletingLastPathComponent()
        let backup = parent.appendingPathComponent(
            "webcache-backup-\(UUID().uuidString)", isDirectory: true)
        var movedExistingCache = false
        do {
            try fm.createDirectory(at: parent, withIntermediateDirectories: true)
            if fm.fileExists(atPath: cacheRoot.path) {
                try fm.moveItem(at: cacheRoot, to: backup)
                movedExistingCache = true
            }
            try fm.moveItem(at: staging, to: cacheRoot)
            try? fm.removeItem(at: backup)
            return true
        } catch {
            if movedExistingCache
                && !fm.fileExists(atPath: cacheRoot.path)
                && fm.fileExists(atPath: backup.path) {
                try? fm.moveItem(at: backup, to: cacheRoot)
            }
            try? fm.removeItem(at: staging)
            return false
        }
    }
}

final class WebContentUpdater {
    enum UpdateResult: Equatable { case upToDate, updated(label: String), failed }

    // IMPORTANT: Blackwood has three independent version identities.
    //
    // 1. INSTALLED APP: CFBundleShortVersionString + CFBundleVersion from the
    //    installed iOS app's Info.plist. GameViewController owns and reports
    //    these values. Downloaded web content must NEVER replace them.
    // 2. LOCAL CONTENT: the CONTENT_VERSION of the web tree actually selected
    //    by the existing bundle-versus-persistent-cache winner logic. This may
    //    legitimately be newer than the installed app's bundled web content.
    // 3. CONTENT SOURCE: the CONTENT_VERSION currently published remotely.
    //    It is nil when the source cannot be reached.
    //
    // Native-app availability is checked separately through
    // LATEST_APP_BUILD_AVAILABLE (TestFlight) or Apple's catalog (App Store).
    // Web manifests never imply that a native binary is available.
    struct VersionLabels: Equatable {
        let contentLocal: String
        let contentSource: String?
    }

    private let store: WebContentStore
    private let session: URLSession
    private let updateLock = NSLock()
    private var updateInFlight = false
    private var pendingUpdates: [(UpdateResult) -> Void] = []

    init(store: WebContentStore, session: URLSession? = nil) {
        self.store = store
        if let session {
            self.session = session
        } else {
            let config = URLSessionConfiguration.ephemeral
            config.requestCachePolicy = .reloadIgnoringLocalCacheData
            config.timeoutIntervalForRequest = 15
            self.session = URLSession(configuration: config)
        }
    }

    private func fetchRemoteFile(_ relativePath: String, cacheKey: String,
                                 completion: @escaping (Data?) -> Void) {
        let baseURL = WebContentStore.remoteBase.appendingPathComponent(relativePath)
        guard var components = URLComponents(
            url: baseURL, resolvingAgainstBaseURL: false) else {
            completion(nil)
            return
        }
        components.queryItems = [URLQueryItem(name: "v", value: cacheKey)]
        guard let url = components.url else {
            completion(nil)
            return
        }
        session.dataTask(with: url) { data, response, _ in
            guard let data, (response as? HTTPURLResponse)?.statusCode == 200 else {
                completion(nil)
                return
            }
            completion(data)
        }.resume()
    }

    private func fetchRemoteRelease(
        completion: @escaping (WebContentRelease?, Data?) -> Void
    ) {
        fetchRemoteFile("versions.json", cacheKey: UUID().uuidString) { data in
            guard let data else {
                completion(nil, nil)
                return
            }
            completion(WebContentRelease.parse(data), data)
        }
    }

    func versionLabels(completion: @escaping (VersionLabels) -> Void) {
        let releaseLocal = store.cacheRelease ?? store.bundleRelease
        let contentLocal = releaseLocal.map { String($0.contentVersion) } ?? "unknown"
        fetchRemoteRelease { remote, _ in
            completion(VersionLabels(
                contentLocal: contentLocal,
                contentSource: remote.map { String($0.contentVersion) }))
        }
    }

    func checkForUpdate(completion: @escaping (UpdateResult) -> Void) {
        updateLock.lock()
        if updateInFlight {
            pendingUpdates.append(completion)
            updateLock.unlock()
            return
        }
        updateInFlight = true
        updateLock.unlock()
        performUpdate(completion: completion)
    }

    private func performUpdate(completion: @escaping (UpdateResult) -> Void) {
        fetchRemoteRelease { [weak self] remote, versionData in
            guard let self else { return }
            guard let remote, let versionData else {
                self.finishUpdate(.failed, completion: completion)
                return
            }
            let localKey = (self.store.cacheRelease ?? self.store.bundleRelease)?.sortKey ?? -1
            guard remote.sortKey > localKey else {
                self.finishUpdate(.upToDate, completion: completion)
                return
            }
            self.downloadBundle(remote, versionData: versionData) { ok in
                self.finishUpdate(ok ? .updated(label: remote.label) : .failed,
                                  completion: completion)
            }
        }
    }

    private func finishUpdate(_ result: UpdateResult,
                              completion: @escaping (UpdateResult) -> Void) {
        completion(result)
        updateLock.lock()
        if pendingUpdates.isEmpty {
            updateInFlight = false
            updateLock.unlock()
            return
        }
        let next = pendingUpdates.removeFirst()
        updateLock.unlock()
        performUpdate(completion: next)
    }

    private func downloadBundle(_ release: WebContentRelease, versionData: Data,
                                completion: @escaping (Bool) -> Void) {
        let fileManager = FileManager.default
        let staging = fileManager.temporaryDirectory
            .appendingPathComponent("webcache-\(UUID().uuidString)", isDirectory: true)
        do {
            try fileManager.createDirectory(at: staging, withIntermediateDirectories: true)
        } catch {
            completion(false)
            return
        }

        let group = DispatchGroup()
        let lock = NSLock()
        var ok = true
        for relativePath in release.files {
            if !WebContentRelease.isSafeRelativePath(relativePath) {
                ok = false
                continue
            }
            if relativePath == "versions.json" {
                let destination = staging.appendingPathComponent(relativePath)
                do {
                    try fileManager.createDirectory(
                        at: destination.deletingLastPathComponent(),
                        withIntermediateDirectories: true)
                    try versionData.write(to: destination, options: .atomic)
                } catch {
                    ok = false
                }
                continue
            }
            group.enter()
            fetchRemoteFile(
                relativePath, cacheKey: String(release.contentVersion)
            ) { data in
                defer { group.leave() }
                guard let data else {
                    lock.lock(); ok = false; lock.unlock()
                    return
                }
                let destination = staging.appendingPathComponent(relativePath)
                do {
                    try fileManager.createDirectory(
                        at: destination.deletingLastPathComponent(),
                        withIntermediateDirectories: true)
                    try data.write(to: destination, options: .atomic)
                } catch {
                    lock.lock(); ok = false; lock.unlock()
                }
            }
        }

        group.notify(queue: .global()) {
            guard ok, self.store.contentRelease(at: staging) == release else {
                try? fileManager.removeItem(at: staging)
                completion(false)
                return
            }
            completion(self.store.replaceCache(with: staging))
        }
    }
}
