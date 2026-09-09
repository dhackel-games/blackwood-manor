// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "GaryDaemon",
    platforms: [.macOS("26.0")],
    targets: [
        .executableTarget(name: "GaryDaemon", path: "Sources/GaryDaemon")
    ]
)
