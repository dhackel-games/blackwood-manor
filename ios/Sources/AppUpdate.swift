// AppUpdate.swift. Copyright (c) dhackel-games. All Rights Reserved. 2026...2026-09-13.084:acoven.

import Foundation

struct AppStoreUpdate: Equatable {
    let version: String
    let storeURL: URL
}

enum AppDistribution {
    static func isTestFlight(receiptURL: URL?) -> Bool {
        receiptURL?.lastPathComponent == "sandboxReceipt"
    }
}

enum AppUpdatePromptPolicy {
    static func shouldPresent(availableVersion: String, lastPromptedVersion: String?) -> Bool {
        availableVersion != lastPromptedVersion
    }
}

final class AppStoreUpdateChecker {
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
    private let countryCode: String?
    private let session: URLSession

    init(bundleIdentifier: String, installedVersion: String, countryCode: String? = nil,
         session: URLSession? = nil) {
        self.bundleIdentifier = bundleIdentifier
        self.installedVersion = installedVersion
        self.countryCode = countryCode
        if let session {
            self.session = session
        } else {
            let configuration = URLSessionConfiguration.ephemeral
            configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
            configuration.timeoutIntervalForRequest = 15
            self.session = URLSession(configuration: configuration)
        }
    }

    func check(receiptURL: URL? = nil, completion: @escaping (AppStoreUpdate?) -> Void) {
        guard !AppDistribution.isTestFlight(receiptURL: receiptURL) else {
            completion(nil)
            return
        }
        var components = URLComponents(string: "https://itunes.apple.com/lookup")
        components?.queryItems = [
            URLQueryItem(name: "bundleId", value: bundleIdentifier),
        ]
        if let countryCode, !countryCode.isEmpty {
            components?.queryItems?.append(
                URLQueryItem(name: "country", value: countryCode.lowercased()))
        }
        guard let url = components?.url else {
            completion(nil)
            return
        }

        var request = URLRequest(
            url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 15)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        session.dataTask(with: request) { [bundleIdentifier, installedVersion] data, response, _ in
            guard let data,
                  (response as? HTTPURLResponse)?.statusCode == 200,
                  let lookup = try? JSONDecoder().decode(LookupResponse.self, from: data),
                  let result = lookup.results.first(where: {
                      $0.bundleId == bundleIdentifier && $0.trackViewUrl != nil
                  }),
                  result.version.compare(installedVersion, options: .numeric) == .orderedDescending,
                  let storeURL = result.trackViewUrl else {
                completion(nil)
                return
            }
            completion(AppStoreUpdate(version: result.version, storeURL: storeURL))
        }.resume()
    }
}

// end AppUpdate.swift
