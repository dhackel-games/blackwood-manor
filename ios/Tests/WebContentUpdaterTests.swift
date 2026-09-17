// WebContentUpdaterTests.swift. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven.

import XCTest

final class WebContentUpdaterTests: XCTestCase {
    private var tmp: URL!
    private var bundle: URL!
    private var cache: URL!

    override func setUpWithError() throws {
        tmp = FileManager.default.temporaryDirectory
            .appendingPathComponent("updater-\(UUID().uuidString)", isDirectory: true)
        bundle = tmp.appendingPathComponent("bundle", isDirectory: true)
        cache = tmp.appendingPathComponent("cache", isDirectory: true)
        try FileManager.default.createDirectory(at: bundle, withIntermediateDirectories: true)
        try manifestJSON(version: 1000, label: "2026.9.16 content build 10", files: ["index.html"])
            .write(to: bundle.appendingPathComponent("manifest.json"))
        try FileManager.default.createDirectory(
            at: bundle.appendingPathComponent("js"), withIntermediateDirectories: true)
        try versionsJSON(contentBuild: 10).write(
            to: bundle.appendingPathComponent("versions.json"))
        try Data("<html>bundled</html>".utf8)
            .write(to: bundle.appendingPathComponent("index.html"))
    }

    override func tearDownWithError() throws {
        StubURLProtocol.reset()
        try? FileManager.default.removeItem(at: tmp)
    }

    private func versionsJSON(contentDate: String = "2026.9.16", contentBuild: Int,
                              files: [String] = ["index.html", "versions.json"]) -> Data {
        let parts = contentDate.split(separator: ".").map(String.init)
        let contentVersion = Int64(parts[0] + parts[1].leftPadded(to: 2) +
            parts[2].leftPadded(to: 2) + String(contentBuild).leftPadded(to: 3))!
        return try! JSONSerialization.data(withJSONObject: [
            "APP_VERSION": contentDate,
            "BUILD": String(contentBuild),
            "NATIVE_APP_VERSION": "2026.9.11",
            "NATIVE_APP_BUILD": "107",
            "CONTENT_DATE": contentDate,
            "CONTENT_BUILD": String(contentBuild),
            "CONTENT_VERSION": contentVersion,
            "LATEST_APP_BUILD_AVAILABLE": contentVersion,
            "CONTENT_FILES": files,
        ], options: [.sortedKeys])
    }

    private func manifestJSON(version: Int, label: String, files: [String]) -> Data {
        let list = files.map { "\"\($0)\"" }.joined(separator: ",")
        return "{\"version\":\(version),\"label\":\"\(label)\",\"files\":[\(list)]}"
            .data(using: .utf8)!
    }

    private func makeUpdater() -> WebContentUpdater {
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        return WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
    }

    func testUpToDateWhenRemoteNotNewer() {
        StubURLProtocol.handler = { req in
            if req.url!.lastPathComponent == "versions.json" {
                return (200, self.versionsJSON(contentBuild: 10))
            }
            return nil
        }
        let exp = expectation(description: "check")
        let updater = makeUpdater()
        updater.checkForUpdate { result in
            XCTAssertEqual(result, .upToDate)
            XCTAssertFalse(FileManager.default.fileExists(atPath: self.cache.path))
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testDownloadsAndSwapsWhenNewer() {
        let remoteManifest = manifestJSON(version: 2000, label: "remote-2000",
                                          files: ["index.html", "js/core.js", "versions.json"])
        let lock = NSLock()
        var cacheKeys: [String: String] = [:]
        StubURLProtocol.handler = { req in
            let url = req.url!
            let key = URLComponents(url: url, resolvingAgainstBaseURL: false)?
                .queryItems?.first(where: { $0.name == "v" })?.value
            lock.lock()
            cacheKeys[url.lastPathComponent] = key
            lock.unlock()
            switch url.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html":    return (200, Data("<html>v2</html>".utf8))
            case "core.js":       return (200, Data("core-v2".utf8))
            case "versions.json": return (200, self.versionsJSON(
                contentBuild: 20, files: ["index.html", "js/core.js", "versions.json"]))
            default:              return nil
            }
        }
        let exp = expectation(description: "check")
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        let updater = WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
        updater.checkForUpdate { result in
            XCTAssertEqual(result, .updated(label: "2026.9.16 content build 20"))
            // Cache now exists, holds the new version and files.
            XCTAssertEqual(store.cacheRelease?.contentBuild, 20)
            XCTAssertEqual(store.activeRoot(), self.cache)
            let core = self.cache.appendingPathComponent("js/core.js")
            XCTAssertEqual(try? String(contentsOf: core, encoding: .utf8), "core-v2")
            lock.lock()
            let observedKeys = cacheKeys
            lock.unlock()
            XCTAssertFalse(observedKeys["versions.json", default: ""].isEmpty)
            XCTAssertEqual(observedKeys["index.html"], "20260916020")
            XCTAssertEqual(observedKeys["core.js"], "20260916020")
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testReportsCurrentAndRemoteVersionLabelsWithoutDownloading() {
        StubURLProtocol.handler = { req in
            guard req.url!.lastPathComponent == "versions.json" else { return nil }
            return (200, self.versionsJSON(contentBuild: 20))
        }
        let exp = expectation(description: "versions")
        let updater = makeUpdater()
        updater.versionLabels { labels in
            XCTAssertEqual(labels, .init(
                contentLocal: "20260916010",
                contentSource: "20260916020"))
            XCTAssertFalse(FileManager.default.fileExists(atPath: self.cache.path))
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testVersionLabelsReportNewerDownloadedCache() throws {
        try FileManager.default.createDirectory(
            at: cache.appendingPathComponent("js"), withIntermediateDirectories: true)
        try versionsJSON(contentBuild: 30).write(
            to: cache.appendingPathComponent("versions.json"))
        try Data("<html>cached</html>".utf8)
            .write(to: cache.appendingPathComponent("index.html"))
        StubURLProtocol.handler = { req in
            guard req.url!.lastPathComponent == "versions.json" else { return nil }
            return (200, self.versionsJSON(contentBuild: 40))
        }

        let exp = expectation(description: "content versions")
        makeUpdater().versionLabels { labels in
            XCTAssertEqual(labels, .init(
                contentLocal: "20260916030",
                contentSource: "20260916040"))
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testVersionJsBuildWinsRegardlessOfLegacyManifestTimestamp() {
        try? manifestJSON(version: 2000, label: "bundle-2000", files: ["index.html"])
            .write(to: bundle.appendingPathComponent("manifest.json"))
        let remoteManifest = manifestJSON(
            version: 1000, label: "remote-1000",
            files: ["index.html", "versions.json"])
        StubURLProtocol.handler = { req in
            switch req.url!.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html": return (200, Data("<html>different</html>".utf8))
            case "versions.json": return (200, self.versionsJSON(contentBuild: 20))
            default: return nil
            }
        }
        let exp = expectation(description: "content identity")
        let updater = makeUpdater()
        updater.checkForUpdate { result in
            XCTAssertEqual(result, .updated(label: "2026.9.16 content build 20"))
            XCTAssertEqual(
                try? String(contentsOf: self.cache.appendingPathComponent("index.html"),
                            encoding: .utf8),
                "<html>different</html>")
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testOverlappingRefreshesCompleteWithAValidCache() {
        let remoteManifest = manifestJSON(version: 2000, label: "remote-2000",
                                          files: ["index.html", "versions.json"])
        StubURLProtocol.handler = { req in
            switch req.url!.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html":    return (200, Data("<html>serialized</html>".utf8))
            case "versions.json": return (200, self.versionsJSON(contentBuild: 20))
            default:              return nil
            }
        }
        let exp = expectation(description: "both refreshes")
        exp.expectedFulfillmentCount = 2
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        let updater = WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
        updater.checkForUpdate { result in
            XCTAssertEqual(result, .updated(label: "2026.9.16 content build 20"))
            exp.fulfill()
        }
        updater.checkForUpdate { result in
            XCTAssertEqual(result, .upToDate)
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
        XCTAssertEqual(store.cacheRelease?.contentBuild, 20)
        let html = cache.appendingPathComponent("index.html")
        XCTAssertEqual(try? String(contentsOf: html, encoding: .utf8), "<html>serialized</html>")
    }

    func testPartialFailureLeavesCacheUntouched() {
        let remoteManifest = manifestJSON(version: 2000, label: "remote-2000",
                                          files: ["index.html", "versions.json", "js/missing.js"])
        StubURLProtocol.handler = { req in
            switch req.url!.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html":    return (200, Data("<html>v2</html>".utf8))
            case "versions.json": return (200, self.versionsJSON(
                contentBuild: 20, files: ["index.html", "versions.json", "js/missing.js"]))
            default:              return nil   // js/missing.js -> 404
            }

        }
        let exp = expectation(description: "check")
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        let updater = WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
        updater.checkForUpdate { result in
            XCTAssertEqual(result, .failed)
            // A failed download must never leave a partial/corrupt cache behind.
            XCTAssertFalse(FileManager.default.fileExists(atPath: self.cache.path))
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testPartialFailurePreservesExistingCache() {
        try? FileManager.default.createDirectory(at: cache, withIntermediateDirectories: true)
        try? manifestJSON(version: 900, label: "cached-900", files: ["index.html"])
            .write(to: cache.appendingPathComponent("manifest.json"))
        try? Data("<html>cached</html>".utf8)
            .write(to: cache.appendingPathComponent("index.html"))
        try? FileManager.default.createDirectory(
            at: cache.appendingPathComponent("js"), withIntermediateDirectories: true)
        try? versionsJSON(contentBuild: 9).write(
            to: cache.appendingPathComponent("versions.json"))
        let remoteManifest = manifestJSON(version: 1000, label: "remote-1000",
                                          files: ["index.html", "versions.json", "js/missing.js"])
        StubURLProtocol.handler = { req in
            switch req.url!.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html":    return (200, Data("<html>remote</html>".utf8))
            case "versions.json": return (200, self.versionsJSON(
                contentBuild: 20, files: ["index.html", "versions.json", "js/missing.js"]))
            default:              return nil
            }
        }

        let exp = expectation(description: "force failure")
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        let updater = WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
        updater.checkForUpdate { result in
            XCTAssertEqual(result, .failed)
            let html = self.cache.appendingPathComponent("index.html")
            XCTAssertEqual(try? String(contentsOf: html, encoding: .utf8), "<html>cached</html>")
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }
}

private extension String {
    func leftPadded(to width: Int) -> String {
        String(repeating: "0", count: max(0, width - count)) + self
    }
}
