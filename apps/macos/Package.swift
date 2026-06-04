// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "SquidexDesktop",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "SquidexDesktop", targets: ["SquidexDesktop"])
    ],
    targets: [
        .executableTarget(
            name: "SquidexDesktop",
            resources: [
                .process("Resources")
            ]
        )
    ]
)
