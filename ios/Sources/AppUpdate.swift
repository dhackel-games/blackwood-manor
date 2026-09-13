// AppUpdate.swift. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.085:acoven.

import Foundation

enum AppUpdateChannel: String, Equatable {
    case testFlight
    case appStore
}

struct AppUpdate: Equatable {
    let version: String
    let build: Int?
    let channel: AppUpdateChannel
    let storeURL: URL

    var identifier: String {
        "\(channel.rawValue):\(version):\(build.map(String.init) ?? "-")"
    }
}

enum AppDistribution {
    static func isTestFlight(receiptURL: URL?) -> Bool {
        receiptURL?.lastPathComponent == "sandboxReceipt"
    }
}

enum AppUpdatePromptPolicy {
    static func shouldPresent(updateIdentifier: String, lastPromptedIdentifier: String?) -> Bool {
        updateIdentifier != lastPromptedIdentifier
    }
}

final class AppUpdateChecker {
    private struct LookupResponse: Decodable {
        let results: [LookupResult]
    }

    private struct LookupResult: Decodable {
        let bundleId: String
        let version: String
        let trackViewUrl: URL?
    }

    private struct TestFlightRelease: Decodable {
        let channel: String
        let available: Bool
        let appVersion: String?
        let appBuild: Int?
        let expiresAt: String?
    }

    private let bundleIdentifier: String
    private let installedVersion: String
    private let installedBuild: Int
    private let countryCode: String?
    private let appStoreLookupURL: URL
    private let testFlightReleaseURL: URL
    private let session: URLSession
    private let now: () -> Date

    init(
        bundleIdentifier: String,
        installedVersion: String,
        installedBuild: String,
        countryCode: String? = nil,
        appStoreLookupURL: URL = URL(string: "https://itunes.apple.com/lookup")!,
        testFlightReleaseURL: URL = URL(
            string: "https://dhackel-games.github.io/blackwood-manor/latest_app_build_available.json")!,
        session: URLSession? = nil,
        now: @escaping () -> Date = Date.init
    ) {
        self.bundleIdentifier = bundleIdentifier
        self.installedVersion = installedVersion
        self.installedBuild = Int(installedBuild) ?? 0
        self.countryCode = countryCode
        self.appStoreLookupURL = appStoreLookupURL
        self.testFlightReleaseURL = testFlightReleaseURL
        self.now = now
        if let session {
            self.session = session
        } else {
            let configuration = URLSessionConfiguration.ephemeral
            configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
            configuration.timeoutIntervalForRequest = 15
            self.session = URLSession(configuration: configuration)
        }
    }

    func check(receiptURL: URL?, completion: @escaping (AppUpdate?) -> Void) {
        if AppDistribution.isTestFlight(receiptURL: receiptURL) {
            checkTestFlight(completion: completion)
        } else {
            checkAppStore(completion: completion)
        }
    }

    private func isNewer(version: String, build: Int?) -> Bool {
        switch version.compare(installedVersion, options: .numeric) {
        case .orderedDescending:
            return true
        case .orderedSame:
            return build.map { $0 > installedBuild } ?? false
        case .orderedAscending:
            return false
        }
    }

    private func checkTestFlight(completion: @escaping (AppUpdate?) -> Void) {
        guard var components = URLComponents(
            url: testFlightReleaseURL, resolvingAgainstBaseURL: false) else {
            completion(nil)
            return
        }
        components.queryItems = [URLQueryItem(name: "v", value: UUID().uuidString)]
        guard let url = components.url else {
            completion(nil)
            return
        }
        fetch(url) { data in
            guard let data,
                  let release = try? JSONDecoder().decode(TestFlightRelease.self, from: data),
                  release.channel == "testflight",
                  release.available,
                  let version = release.appVersion,
                  let build = release.appBuild,
                  let expiresAt = release.expiresAt,
                  let expiration = Self.iso8601Date(expiresAt),
                  expiration > self.now(),
                  self.isNewer(version: version, build: build),
                  let testFlightURL = URL(string: "itms-beta://") else {
                completion(nil)
                return
            }
            completion(AppUpdate(
                version: version,
                build: build,
                channel: .testFlight,
                storeURL: testFlightURL))
        }
    }

    private func checkAppStore(completion: @escaping (AppUpdate?) -> Void) {
        guard var components = URLComponents(
            url: appStoreLookupURL, resolvingAgainstBaseURL: false) else {
            completion(nil)
            return
        }
        var queryItems = [URLQueryItem(name: "bundleId", value: bundleIdentifier)]
        if let countryCode, !countryCode.isEmpty {
            queryItems.append(URLQueryItem(name: "country", value: countryCode.lowercased()))
        }
        components.queryItems = queryItems
        guard let url = components.url else {
            completion(nil)
            return
        }
        fetch(url) { data in
            guard let data,
                  let lookup = try? JSONDecoder().decode(LookupResponse.self, from: data),
                  let result = lookup.results.first(where: {
                      $0.bundleId == self.bundleIdentifier && $0.trackViewUrl != nil
                  }),
                  self.isNewer(version: result.version, build: nil),
                  let storeURL = result.trackViewUrl else {
                completion(nil)
                return
            }
            completion(AppUpdate(
                version: result.version,
                build: nil,
                channel: .appStore,
                storeURL: storeURL))
        }
    }

    private func fetch(_ url: URL, completion: @escaping (Data?) -> Void) {
        var request = URLRequest(
            url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        session.dataTask(with: request) { data, response, _ in
            guard let data, (response as? HTTPURLResponse)?.statusCode == 200 else {
                completion(nil)
                return
            }
            completion(data)
        }.resume()
    }

    private static func iso8601Date(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: value) { return date }
        formatter.formatOptions.insert(.withFractionalSeconds)
        return formatter.date(from: value)
    }
}

// end AppUpdate.swift
