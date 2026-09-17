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

    private let bundleIdentifier: String
    private let installedVersion: String
    private let installedBuild: String
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
            string: "https://dhackel-games.github.io/blackwood-manor/versions.json")!,
        session: URLSession? = nil,
        now: @escaping () -> Date = Date.init
    ) {
        self.bundleIdentifier = bundleIdentifier
        self.installedVersion = installedVersion
        self.installedBuild = installedBuild
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
            guard let installedBuildNumber = Int(installedBuild) else { return false }
            return build.map { $0 > installedBuildNumber } ?? false
        case .orderedAscending:
            return false
        }
    }

    static func releaseNumber(appVersion: String, build: String) -> Int64? {
        let rawParts = appVersion.split(separator: ".")
        guard rawParts.count == 3,
              let buildNumber = Int(build) else { return nil }
        let parsedParts = rawParts.map { Int($0) }
        guard parsedParts.allSatisfy({ $0 != nil }) else { return nil }
        let parts = parsedParts.map { $0! }
        guard (1000...9999).contains(parts[0]),
              (1...12).contains(parts[1]),
              (1...31).contains(parts[2]),
              (0...999).contains(buildNumber) else {
            return nil
        }
        return Int64(String(format: "%04d%02d%02d%03d",
                            parts[0], parts[1], parts[2], buildNumber))
    }

    private static func releaseIdentity(
        _ release: Int64
    ) -> (version: String, build: Int, releaseDate: Date)? {
        guard release > 0 else { return nil }
        let build = Int(release % 1_000)
        let date = release / 1_000
        let day = date % 100
        let month = (date / 100) % 100
        let year = date / 10_000
        guard year > 0, (1...12).contains(month), (1...31).contains(day) else {
            return nil
        }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let components = DateComponents(
            calendar: calendar,
            timeZone: calendar.timeZone,
            year: Int(year),
            month: Int(month),
            day: Int(day))
        guard let releaseDate = calendar.date(from: components),
              calendar.component(.year, from: releaseDate) == Int(year),
              calendar.component(.month, from: releaseDate) == Int(month),
              calendar.component(.day, from: releaseDate) == Int(day) else {
            return nil
        }
        return ("\(year).\(month).\(day)", build, releaseDate)
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
            guard             let data,
            let release = WebContentRelease.parse(data),
            let installedRelease = Self.releaseNumber(
                appVersion: self.installedVersion,
                build: self.installedBuild),
            release.latestAppBuildAvailable > installedRelease,
            let identity = Self.releaseIdentity(release.latestAppBuildAvailable),
            let expires = Calendar(identifier: .gregorian).date(
                byAdding: .day, value: 90, to: identity.releaseDate),
            self.now() < expires,
            let testFlightURL = URL(string: "itms-beta://") else {
                completion(nil)
                return
            }
            completion(AppUpdate(
                version: identity.version,
                build: identity.build,
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

}

// end AppUpdate.swift
