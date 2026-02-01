plugins {
    id("kotlin")
    `java-library`
}

group = "eu.franz1007"
version = "0.0.1"

repositories {
    mavenCentral()
}

dependencies {
    implementation(libs.exposed.jdbc)
    api(libs.postgis)

    testImplementation(libs.logback.classic)
    testImplementation(libs.kotlin.test.junit)
    testImplementation(libs.testcontainers.postgres)
}

kotlin {
    jvmToolchain(21)
}

tasks.test{
    maxParallelForks = Runtime.getRuntime().availableProcessors()
    systemProperties["junit.jupiter.execution.parallel.enabled"] = true
    systemProperties["junit.jupiter.execution.parallel.mode.default"] = "concurrent"
    println("Forks:")
    println(maxParallelForks)
}