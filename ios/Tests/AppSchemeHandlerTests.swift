// AppSchemeHandlerTests.swift — the pure request→file resolution used to serve web
// content over the app:// scheme.

import XCTest
// WebContent.swift is compiled directly into this test target, so its types are
// same-module — no import of the app needed.

final class AppSchemeHandlerTests: XCTestCase {
    private var root: URL!

    override func setUpWithError() throws {
        root = FileManager.default.temporaryDirectory
            .appendingPathComponent("scheme-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: root.appendingPathComponent("js"),
                                                withIntermediateDirectories: true)
        try "<html>HELLO</html>".data(using: .utf8)!
            .write(to: root.appendingPathComponent("index.html"))
        try "console.log(1)".data(using: .utf8)!
            .write(to: root.appendingPathComponent("js/app.js"))
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: root)
    }

    func testEmptyPathServesIndex() {
        let h = AppSchemeHandler(baseURL: root)
        let r = h.resolve(requestPath: "/")
        XCTAssertEqual(r?.mime, "text/html; charset=utf-8")
        XCTAssertEqual(String(data: r!.data, encoding: .utf8), "<html>HELLO</html>")
    }

    func testNestedFileWithMime() {
        let h = AppSchemeHandler(baseURL: root)
        let r = h.resolve(requestPath: "/js/app.js")
        XCTAssertEqual(r?.mime, "text/javascript; charset=utf-8")
        XCTAssertEqual(String(data: r!.data, encoding: .utf8), "console.log(1)")
    }

    func testTraversalRejected() {
        let h = AppSchemeHandler(baseURL: root)
        XCTAssertNil(h.resolve(requestPath: "/../secret.txt"))
    }

    func testMissingFileReturnsNil() {
        let h = AppSchemeHandler(baseURL: root)
        XCTAssertNil(h.resolve(requestPath: "/js/nope.js"))
    }

    func testMimeMapping() {
        XCTAssertEqual(AppSchemeHandler.mime(for: "css"), "text/css; charset=utf-8")
        XCTAssertEqual(AppSchemeHandler.mime(for: "json"), "application/json")
        XCTAssertEqual(AppSchemeHandler.mime(for: "MJS"), "text/javascript; charset=utf-8")
        XCTAssertEqual(AppSchemeHandler.mime(for: "bin"), "application/octet-stream")
    }
}
