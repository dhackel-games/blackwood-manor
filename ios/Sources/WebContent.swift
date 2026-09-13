// WebContent.swift. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.

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
    let files: [String]

    var label: String { "\(appVersion) build \(build)" }
    var sortKey: Int64 { contentVersion }

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
        let parts = appVersion.split(separator: ".").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return Int64(String(format: "%04d%02d%02d%03d",
                            parts[0], parts[1], parts[2], build))
    }

    static func parse(_ data: Data) -> WebContentRelease? {
        guard let source = String(data: data, encoding: .utf8) else { return nil }
        func capture(_ name: String) -> String? {
            let pattern = "export const \(name)\\s*=\\s*\"([^\"]+)\""
            guard let regex = try? NSRegularExpression(pattern: pattern),
                  let match = regex.firstMatch(
                    in: source, range: NSRange(source.startIndex..., in: source)),
                  let range = Range(match.range(at: 1), in: source) else {
                return nil
            }
            return String(source[range])
        }
        let filesPattern = "export const CONTENT_FILES\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;"
        guard let appVersion = capture("APP_VERSION"),
              let buildText = capture("BUILD"),
              let build = Int(buildText),
              let contentVersionText = { () -> String? in
                  let pattern = "export const CONTENT_VERSION\\s*=\\s*(\\d+)"
                  guard let regex = try? NSRegularExpression(pattern: pattern),
                        let match = regex.firstMatch(
                            in: source, range: NSRange(source.startIndex..., in: source)),
                        let range = Range(match.range(at: 1), in: source) else {
                      return nil
                  }
                  return String(source[range])
              }(),
              let contentVersion = Int64(contentVersionText),
              contentVersion == Self.contentVersion(appVersion: appVersion, build: build),
              let filesRegex = try? NSRegularExpression(pattern: filesPattern),
              let filesMatch = filesRegex.firstMatch(
                in: source, range: NSRange(source.startIndex..., in: source)),
              let filesRange = Range(filesMatch.range(at: 1), in: source),
              let filesData = String(source[filesRange]).data(using: .utf8),
              let files = try? JSONDecoder().decode([String].self, from: filesData),
              files.contains("index.html"),
              files.contains("js/version.js"),
              files.allSatisfy(Self.isSafeRelativePath),
              Set(files).count == files.count else {
            return nil
        }
        return WebContentRelease(
            appVersion: appVersion, build: build,
            contentVersion: contentVersion, files: files)
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
        let file = root.appendingPathComponent("js/version.js")
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

    func bundledManifestData() -> Data? {
        try? Data(contentsOf: bundleRoot.appendingPathComponent("manifest.json"))
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
    struct VersionLabels: Equatable {
        let current: String
        let remote: String?
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
        fetchRemoteFile("js/version.js", cacheKey: UUID().uuidString) { data in
            guard let data else {
                completion(nil, nil)
                return
            }
            completion(WebContentRelease.parse(data), data)
        }
    }

    func versionLabels(completion: @escaping (VersionLabels) -> Void) {
        let current = store.cacheRelease?.label ?? store.bundleRelease?.label ?? "unknown"
        fetchRemoteRelease { remote, _ in
            completion(VersionLabels(current: current, remote: remote?.label))
        }
    }

    func checkForAppManifestChange(completion: @escaping (Bool) -> Void) {
        let installed = store.bundledManifestData()
        fetchRemoteFile("manifest.json", cacheKey: UUID().uuidString) { remote in
            completion(installed != nil && remote != nil && installed != remote)
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
            if relativePath == "js/version.js" {
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
