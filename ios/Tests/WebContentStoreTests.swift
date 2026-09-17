// WebContentStoreTests.swift. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven.

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
        let url = tmp.appendingPathComponent(name, isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    private func versionData(contentDate: String = "2026.9.16", contentBuild: Int) -> Data {
        let version = contentVersion(contentDate, contentBuild)
        return try! JSONSerialization.data(withJSONObject: [
            "APP_VERSION": contentDate,
            "BUILD": String(contentBuild),
            "NATIVE_APP_VERSION": "2026.9.11",
            "NATIVE_APP_BUILD": "107",
            "CONTENT_DATE": contentDate,
            "CONTENT_BUILD": String(contentBuild),
            "CONTENT_VERSION": version,
            "LATEST_APP_BUILD_AVAILABLE": version,
            "CONTENT_FILES": ["index.html", "versions.json"],
        ], options: [.sortedKeys])
    }

    private func contentVersion(_ contentDate: String, _ contentBuild: Int) -> Int64 {
        let parts = contentDate.split(separator: ".").map(String.init)
        return Int64(parts[0] + parts[1].leftPadded(to: 2) +
                     parts[2].leftPadded(to: 2) + String(contentBuild).leftPadded(to: 3))!
    }

    private func writeRelease(contentDate: String = "2026.9.16", contentBuild: Int, at root: URL) {
        try? versionData(contentDate: contentDate, contentBuild: contentBuild)
            .write(to: root.appendingPathComponent("versions.json"))
        try? Data("<html></html>".utf8).write(to: root.appendingPathComponent("index.html"))
        try? Data("{\"files\":[]}".utf8).write(to: root.appendingPathComponent("manifest.json"))
    }

    func testNumericContentVersionUsesPaddedDateAndBuild() {
        XCTAssertEqual(
            WebContentRelease.contentVersion(contentDate: "2026.9.16", contentBuild: 67),
            20260916067)
    }

    func testNumericContentVersionRejectsValuesOutsideYYYYMMDDBBB() {
        XCTAssertNil(WebContentRelease.contentVersion(contentDate: "2026.13.1", contentBuild: 67))
        XCTAssertNil(WebContentRelease.contentVersion(contentDate: "2026.9.16", contentBuild: 1000))
    }

    func testBundleSeedsPersistentCacheWhenCacheIsMissing() {
        let bundle = root("bundle")
        let cache = tmp.appendingPathComponent("cache")
        writeRelease(contentBuild: 10, at: bundle)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertEqual(store.activeRoot(), bundle)
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.activeRoot(), cache)
        XCTAssertEqual(store.cacheRelease?.contentBuild, 10)
    }

    func testNewerBundledContentReplacesOlderPersistentCache() {
        let bundle = root("bundle")
        let cache = tmp.appendingPathComponent("cache")
        let staging = root("downloaded")
        writeRelease(contentBuild: 30, at: bundle)
        writeRelease(contentBuild: 20, at: staging)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertTrue(store.replaceCache(with: staging))
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.cacheRelease?.contentBuild, 30)
    }

    func testNewerDownloadedCacheSurvivesAnOlderAppBundle() {
        let bundle = root("bundle")
        let cache = tmp.appendingPathComponent("cache")
        let staging = root("downloaded")
        writeRelease(contentBuild: 10, at: bundle)
        writeRelease(contentBuild: 20, at: staging)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertTrue(store.replaceCache(with: staging))
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.cacheRelease?.contentBuild, 20)
    }

    func testInvalidCacheIsReplacedByBundledContent() {
        let bundle = root("bundle")
        let cache = root("cache")
        writeRelease(contentBuild: 10, at: bundle)
        try? Data("not version metadata".utf8)
            .write(to: cache.appendingPathComponent("versions.json"))
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.cacheRelease?.contentBuild, 10)
    }

    func testNewerPartialCacheIsReplacedByCompleteBundledContent() {
        let bundle = root("bundle")
        let cache = root("cache")
        writeRelease(contentBuild: 10, at: bundle)
        writeRelease(contentBuild: 20, at: cache)
        try? FileManager.default.removeItem(at: cache.appendingPathComponent("index.html"))
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)

        XCTAssertNil(store.cacheRelease)
        XCTAssertEqual(store.activeRoot(), bundle)
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.activeRoot(), cache)
        XCTAssertEqual(store.cacheRelease?.contentBuild, 10)
    }
}

private extension String {
    func leftPadded(to width: Int) -> String {
        String(repeating: "0", count: max(0, width - count)) + self
    }
}
