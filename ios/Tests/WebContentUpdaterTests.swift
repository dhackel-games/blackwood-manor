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
}
