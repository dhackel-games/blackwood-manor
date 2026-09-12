// StubURLProtocol.swift — intercepts URLSession requests in tests so WebContentUpdater
// can be exercised against canned manifest/file responses (no real network).

import Foundation

final class StubURLProtocol: URLProtocol {
    /// Returns (statusCode, body) for a request, or nil to emulate a 404.
    static var handler: ((URLRequest) -> (Int, Data)?)?

    static func reset() { handler = nil }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let result = StubURLProtocol.handler?(request)
        let status = result?.0 ?? 404
        let data = result?.1 ?? Data()
        let response = HTTPURLResponse(url: request.url!, statusCode: status,
                                       httpVersion: "HTTP/1.1", headerFields: nil)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

extension StubURLProtocol {
    /// A session whose traffic is fully served by StubURLProtocol.
    static func makeSession() -> URLSession {
        let cfg = URLSessionConfiguration.ephemeral
        cfg.protocolClasses = [StubURLProtocol.self]
        return URLSession(configuration: cfg)
    }
}
