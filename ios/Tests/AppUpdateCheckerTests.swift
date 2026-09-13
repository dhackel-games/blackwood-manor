// AppUpdateCheckerTests.swift. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.084:acoven.

import XCTest

final class AppUpdateCheckerTests: XCTestCase {
    override func tearDown() {
        StubURLProtocol.reset()
        super.tearDown()
    }

    private func lookupJSON(
        bundleIdentifier: String = "com.dhackel.BlackwoodManor",
        version: String,
        storeURL: String = "https://apps.apple.com/app/id123456789"
    ) -> Data {
        Data("""
        {
          "resultCount": 1,
          "results": [{
            "bundleId": "\(bundleIdentifier)",
            "version": "\(version)",
            "trackViewUrl": "\(storeURL)"
          }]
        }
        """.utf8)
    }

    private func checker(installedVersion: String = "2026.9.11") -> AppStoreUpdateChecker {
        AppStoreUpdateChecker(
            bundleIdentifier: "com.dhackel.BlackwoodManor",
            installedVersion: installedVersion,
            countryCode: "US",
            session: StubURLProtocol.makeSession())
    }

    func testNewerPublishedVersionReturnsAppStoreUpdate() {
        var requestURL: URL?
        StubURLProtocol.handler = { request in
            requestURL = request.url
            return (200, self.lookupJSON(version: "2026.10.1"))
        }

        let exp = expectation(description: "lookup")
        checker().check { update in
            XCTAssertEqual(update, AppStoreUpdate(
                version: "2026.10.1",
                storeURL: URL(string: "https://apps.apple.com/app/id123456789")!))
            let components = requestURL.flatMap {
                URLComponents(url: $0, resolvingAgainstBaseURL: false)
            }
            XCTAssertEqual(components?.host, "itunes.apple.com")
            XCTAssertEqual(components?.path, "/lookup")
            XCTAssertEqual(
                components?.queryItems?.first(where: { $0.name == "bundleId" })?.value,
                "com.dhackel.BlackwoodManor")
            XCTAssertEqual(
                components?.queryItems?.first(where: { $0.name == "country" })?.value,
                "us")
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testMatchingOrOlderPublishedVersionDoesNotOfferUpdate() {
        for version in ["2026.9.11", "2026.8.31"] {
            StubURLProtocol.handler = { _ in
                (200, self.lookupJSON(version: version))
            }
            let exp = expectation(description: version)
            checker().check { update in
                XCTAssertNil(update)
                exp.fulfill()
            }
            wait(for: [exp], timeout: 5)
        }
    }

    func testMissingAppStoreListingDoesNotOfferUpdate() {
        StubURLProtocol.handler = { _ in
            (200, Data(#"{"resultCount":0,"results":[]}"#.utf8))
        }

        let exp = expectation(description: "no listing")
        checker().check { update in
            XCTAssertNil(update)
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)
    }

    func testTestFlightReceiptDelegatesUpdatesToTestFlight() {
        StubURLProtocol.handler = { _ in
            XCTFail("TestFlight must not query the App Store lookup service")
            return nil
        }

        let exp = expectation(description: "TestFlight")
        checker().check(
            receiptURL: URL(fileURLWithPath: "/bundle/StoreKit/sandboxReceipt")
        ) { update in
            XCTAssertNil(update)
            exp.fulfill()
        }
        wait(for: [exp], timeout: 5)

        XCTAssertFalse(AppDistribution.isTestFlight(
            receiptURL: URL(fileURLWithPath: "/bundle/StoreKit/receipt")))
        XCTAssertFalse(AppDistribution.isTestFlight(receiptURL: nil))
    }

    func testEachAvailableVersionIsPromptedOnlyOnce() {
        XCTAssertTrue(AppUpdatePromptPolicy.shouldPresent(
            availableVersion: "2026.10.1", lastPromptedVersion: nil))
        XCTAssertFalse(AppUpdatePromptPolicy.shouldPresent(
            availableVersion: "2026.10.1", lastPromptedVersion: "2026.10.1"))
        XCTAssertTrue(AppUpdatePromptPolicy.shouldPresent(
            availableVersion: "2026.10.2", lastPromptedVersion: "2026.10.1"))
    }
}

// end AppUpdateCheckerTests.swift
