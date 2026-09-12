// WebContentStoreTests.swift — which directory the game serves from (bundle vs cache),
// version selection, and stale-cache discard.

import XCTest

final class WebContentStoreTests: XCTestCase {
    private var tmp: URL!

    override func setUpWithError() throws {
        tmp = FileManager.default.temporaryDirectory
            .appendingPathComponent("store-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: tmp, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: tmp)
    }

    private func root(_ name: String) -> URL {
        let u = tmp.appendingPathComponent(name, isDirectory: true)
        try? FileManager.default.createDirectory(at: u, withIntermediateDirectories: true)
        return u
    }

    private func writeManifest(version: Int, label: String, at root: URL) {
        let json = "{\"version\":\(version),\"label\":\"\(label)\",\"files\":[\"index.html\"]}"
        try? json.data(using: .utf8)!.write(to: root.appendingPathComponent("manifest.json"))
    }

    func testBundleOnlyServesBundle() {
        let bundle = root("bundle")
        writeManifest(version: 1000, label: "bundle-1000", at: bundle)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: tmp.appendingPathComponent("nonexistent-cache"))
        XCTAssertEqual(store.currentVersion, 1000)
        XCTAssertEqual(store.activeRoot(), bundle)
        XCTAssertEqual(store.activeLabel(), "bundle-1000")
    }

    func testNewerCacheWins() {
        let bundle = root("bundle")
        let cache = root("cache")
        writeManifest(version: 1000, label: "bundle-1000", at: bundle)
        writeManifest(version: 2000, label: "cache-2000", at: cache)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertEqual(store.currentVersion, 2000)
        XCTAssertEqual(store.activeRoot(), cache)
        XCTAssertEqual(store.activeLabel(), "cache-2000")
    }

    func testEqualVersionCacheWinsAfterForcedRefresh() {
        let bundle = root("bundle")
        let cache = root("cache")
        writeManifest(version: 1000, label: "bundle-1000", at: bundle)
        writeManifest(version: 1000, label: "remote-1000", at: cache)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertEqual(store.activeRoot(), cache)
        XCTAssertEqual(store.activeLabel(), "remote-1000")
    }

    func testStaleCacheDiscardedWhenBundleNewer() {
        let bundle = root("bundle")
        let cache = root("cache")
        writeManifest(version: 3000, label: "bundle-3000", at: bundle)
        writeManifest(version: 2000, label: "cache-2000", at: cache)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertEqual(store.activeRoot(), bundle)
        // The stale cache must be removed so we never serve it again.
        XCTAssertFalse(FileManager.default.fileExists(atPath: cache.path))
    }

    func testMissingManifestsGiveNegativeVersions() {
        let store = WebContentStore(bundleRoot: root("empty-bundle"), cacheRoot: root("empty-cache"))
        XCTAssertEqual(store.bundleVersion, -1)
        XCTAssertEqual(store.cacheVersion, -1)
        XCTAssertEqual(store.currentVersion, -1)
    }
}
