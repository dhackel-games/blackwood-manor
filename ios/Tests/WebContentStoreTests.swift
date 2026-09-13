// WebContentStoreTests.swift. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-12.067:acoven.

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

    private func versionData(appVersion: String = "2026.9.11", build: Int) -> Data {
        Data("""
        export const APP_VERSION = "\(appVersion)";
        export const BUILD = "\(build)";
        export const CONTENT_VERSION = \(contentVersion(appVersion, build));
        export const CONTENT_FILES = ["index.html", "js/version.js"];
        """.utf8)
    }

    private func contentVersion(_ appVersion: String, _ build: Int) -> Int64 {
        let parts = appVersion.split(separator: ".").map(String.init)
        return Int64(parts[0] + parts[1].leftPadded(to: 2) +
                     parts[2].leftPadded(to: 2) + String(build).leftPadded(to: 3))!
    }

    private func writeRelease(appVersion: String = "2026.9.11", build: Int, at root: URL) {
        let js = root.appendingPathComponent("js", isDirectory: true)
        try? FileManager.default.createDirectory(at: js, withIntermediateDirectories: true)
        try? versionData(appVersion: appVersion, build: build)
            .write(to: js.appendingPathComponent("version.js"))
        try? Data("<html></html>".utf8).write(to: root.appendingPathComponent("index.html"))
        try? Data("{\"files\":[]}".utf8).write(to: root.appendingPathComponent("manifest.json"))
    }

    func testNumericContentVersionUsesPaddedDateAndBuild() {
        XCTAssertEqual(
            WebContentRelease.contentVersion(appVersion: "2026.9.11", build: 67),
            20260911067)
    }

    func testBundleSeedsPersistentCacheWhenCacheIsMissing() {
        let bundle = root("bundle")
        let cache = tmp.appendingPathComponent("cache")
        writeRelease(build: 10, at: bundle)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertEqual(store.activeRoot(), bundle)
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.activeRoot(), cache)
        XCTAssertEqual(store.cacheRelease?.build, 10)
    }

    func testNewerBundledContentReplacesOlderPersistentCache() {
        let bundle = root("bundle")
        let cache = tmp.appendingPathComponent("cache")
        let staging = root("downloaded")
        writeRelease(build: 30, at: bundle)
        writeRelease(build: 20, at: staging)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertTrue(store.replaceCache(with: staging))
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.cacheRelease?.build, 30)
    }

    func testNewerDownloadedCacheSurvivesAnOlderAppBundle() {
        let bundle = root("bundle")
        let cache = tmp.appendingPathComponent("cache")
        let staging = root("downloaded")
        writeRelease(build: 10, at: bundle)
        writeRelease(build: 20, at: staging)
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertTrue(store.replaceCache(with: staging))
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.cacheRelease?.build, 20)
    }

    func testInvalidCacheIsReplacedByBundledContent() {
        let bundle = root("bundle")
        let cache = root("cache")
        writeRelease(build: 10, at: bundle)
        try? Data("not version metadata".utf8)
            .write(to: cache.appendingPathComponent("version.js"))
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.cacheRelease?.build, 10)
    }

    func testNewerPartialCacheIsReplacedByCompleteBundledContent() {
        let bundle = root("bundle")
        let cache = root("cache")
        writeRelease(build: 10, at: bundle)
        writeRelease(build: 20, at: cache)
        try? FileManager.default.removeItem(at: cache.appendingPathComponent("index.html"))
        let store = WebContentStore(bundleRoot: bundle, cacheRoot: cache)

        XCTAssertNil(store.cacheRelease)
        XCTAssertEqual(store.activeRoot(), bundle)
        XCTAssertTrue(store.ensureCacheFromBundle())
        XCTAssertEqual(store.activeRoot(), cache)
        XCTAssertEqual(store.cacheRelease?.build, 10)
    }
}

private extension String {
    func leftPadded(to width: Int) -> String {
        String(repeating: "0", count: max(0, width - count)) + self
    }
}
