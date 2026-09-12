// WebContentUpdaterTests.swift — the version-gated download+swap that pulls newer web
// content from Pages into the local cache. Network is stubbed via StubURLProtocol.

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
        // Bundle ships version 1000.
        try manifestJSON(version: 1000, label: "bundle-1000", files: ["index.html"])
            .write(to: bundle.appendingPathComponent("manifest.json"))
    }

    override func tearDownWithError() throws {
        StubURLProtocol.reset()
        try? FileManager.default.removeItem(at: tmp)
    }

    private func manifestJSON(version: Int, label: String, files: [String]) -> Data {
        let list = files.map { "\"\($0)\"" }.joined(separator: ",")
        return "{\"version\":\(version),\"label\":\"\(label)\",\"files\":[\(list)]}".data(using: .utf8)!
    }

    private func makeUpdater() -> WebContentUpdater {
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        return WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
    }

    func testUpToDateWhenRemoteNotNewer() {
        StubURLProtocol.handler = { req in
            if req.url!.lastPathComponent == "manifest.json" {
                return (200, self.manifestJSON(version: 1000, label: "remote-1000", files: ["index.html"]))
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
                                          files: ["index.html", "js/core.js"])
        StubURLProtocol.handler = { req in
            switch req.url!.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html":    return (200, Data("<html>v2</html>".utf8))
            case "core.js":       return (200, Data("core-v2".utf8))
            default:              return nil
            }
        }
        let exp = expectation(description: "check")
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        let updater = WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
        updater.checkForUpdate { result in
            XCTAssertEqual(result, .updated(label: "remote-2000"))
            // Cache now exists, holds the new version and files.
            XCTAssertEqual(store.cacheVersion, 2000)
            XCTAssertEqual(store.activeRoot(), self.cache)
            let core = self.cache.appendingPathComponent("js/core.js")
            XCTAssertEqual(try? String(contentsOf: core, encoding: .utf8), "core-v2")
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testReportsCurrentAndRemoteVersionLabelsWithoutDownloading() {
        StubURLProtocol.handler = { req in
            guard req.url!.lastPathComponent == "manifest.json" else { return nil }
            return (200, self.manifestJSON(
                version: 2000, label: "remote-2000", files: ["index.html"]))
        }
        let exp = expectation(description: "versions")
        let updater = makeUpdater()
        updater.versionLabels { labels in
            XCTAssertEqual(labels, .init(current: "bundle-1000", remote: "remote-2000"))
            XCTAssertFalse(FileManager.default.fileExists(atPath: self.cache.path))
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testForceRefreshDownloadsWhenRemoteVersionMatches() {
        let remoteManifest = manifestJSON(version: 1000, label: "remote-1000",
                                          files: ["index.html"])
        StubURLProtocol.handler = { req in
            switch req.url!.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html":    return (200, Data("<html>forced</html>".utf8))
            default:              return nil
            }
        }
        let exp = expectation(description: "force")
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        let updater = WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
        updater.checkForUpdate(force: true) { result in
            XCTAssertEqual(result, .updated(label: "remote-1000"))
            XCTAssertEqual(store.cacheVersion, 1000)
            XCTAssertEqual(store.activeRoot(), self.cache)
            let html = self.cache.appendingPathComponent("index.html")
            XCTAssertEqual(try? String(contentsOf: html, encoding: .utf8), "<html>forced</html>")
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testForceRefreshRefusesOlderRemoteVersion() {
        try? manifestJSON(version: 2000, label: "bundle-2000", files: ["index.html"])
            .write(to: bundle.appendingPathComponent("manifest.json"))
        StubURLProtocol.handler = { req in
            guard req.url!.lastPathComponent == "manifest.json" else {
                XCTFail("An older manifest must not trigger file downloads")
                return nil
            }
            return (200, self.manifestJSON(
                version: 1000, label: "remote-1000", files: ["index.html"]))
        }
        let exp = expectation(description: "refuse downgrade")
        let updater = makeUpdater()
        updater.checkForUpdate(force: true) { result in
            XCTAssertEqual(result, .failed)
            XCTAssertFalse(FileManager.default.fileExists(atPath: self.cache.path))
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testOverlappingRefreshesCompleteWithAValidCache() {
        let remoteManifest = manifestJSON(version: 2000, label: "remote-2000",
                                          files: ["index.html"])
        StubURLProtocol.handler = { req in
            switch req.url!.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html":    return (200, Data("<html>serialized</html>".utf8))
            default:              return nil
            }
        }
        let exp = expectation(description: "both refreshes")
        exp.expectedFulfillmentCount = 2
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        let updater = WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
        updater.checkForUpdate { result in
            XCTAssertEqual(result, .updated(label: "remote-2000"))
            exp.fulfill()
        }
        updater.checkForUpdate(force: true) { result in
            XCTAssertEqual(result, .updated(label: "remote-2000"))
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
        XCTAssertEqual(store.cacheVersion, 2000)
        let html = cache.appendingPathComponent("index.html")
        XCTAssertEqual(try? String(contentsOf: html, encoding: .utf8), "<html>serialized</html>")
    }

    func testPartialFailureLeavesCacheUntouched() {
        let remoteManifest = manifestJSON(version: 2000, label: "remote-2000",
                                          files: ["index.html", "js/missing.js"])
        StubURLProtocol.handler = { req in
            switch req.url!.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html":    return (200, Data("<html>v2</html>".utf8))
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

    func testForcedPartialFailurePreservesExistingCache() {
        try? FileManager.default.createDirectory(at: cache, withIntermediateDirectories: true)
        try? manifestJSON(version: 900, label: "cached-900", files: ["index.html"])
            .write(to: cache.appendingPathComponent("manifest.json"))
        try? Data("<html>cached</html>".utf8)
            .write(to: cache.appendingPathComponent("index.html"))
        let remoteManifest = manifestJSON(version: 1000, label: "remote-1000",
                                          files: ["index.html", "js/missing.js"])
        StubURLProtocol.handler = { req in
            switch req.url!.lastPathComponent {
            case "manifest.json": return (200, remoteManifest)
            case "index.html":    return (200, Data("<html>remote</html>".utf8))
            default:              return nil
            }
        }
        let exp = expectation(description: "force failure")
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        let updater = WebContentUpdater(store: store, session: StubURLProtocol.makeSession())
        updater.checkForUpdate(force: true) { result in
            XCTAssertEqual(result, .failed)
            XCTAssertEqual(store.cacheVersion, 900)
            let html = self.cache.appendingPathComponent("index.html")
            XCTAssertEqual(try? String(contentsOf: html, encoding: .utf8), "<html>cached</html>")
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }
}
