plugins {
    id("kotlin")
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ktor)
    application
}


group = "eu.franz1007"
version = "0.0.1"

repositories {
    mavenCentral()
}

dependencies {
    implementation(project(":exposed-gis"))
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.config.yaml)
    implementation(libs.ktor.server.sessions)
    implementation(libs.ktor.server.auto.head.response)
    implementation(libs.ktor.server.host.common)
    implementation(libs.ktor.server.status.pages)
    implementation(libs.ktor.server.compression)
    implementation(libs.ktor.server.caching.headers)
    implementation(libs.ktor.server.call.logging)
    implementation(libs.ktor.server.call.id)
    implementation(libs.ktor.server.html.builder)
    implementation(libs.kotlinx.html)
    implementation(libs.ktor.server.websockets)
    implementation(libs.ktor.serialization.kotlinx.json)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.postgresql)
    implementation(libs.h2)
    implementation(libs.exposed.core)
    implementation(libs.exposed.jdbc)
    implementation(libs.exposed.datetime)
    implementation(libs.exposed.migration.core)
    implementation(libs.exposed.migration.jdbc)
    implementation(libs.flyway)
    implementation(libs.flyway.postgres)
    implementation(libs.ktor.server.netty)
    implementation(libs.logback.classic)
    implementation(libs.kotlinx.datetime)
    implementation(libs.ktor.server.cors)
    implementation(libs.ktor.server.sse)
    implementation(libs.spatialk.geojson)
    implementation(libs.hikari)

    testImplementation(libs.kotlin.test.junit)
    testImplementation(libs.testcontainers.postgres)
}

kotlin {
    jvmToolchain(21)
}

application {
    mainClass = "eu.franz1007.gpstracker.ApplicationKt"
}

tasks.register<JavaExec>("generateMigrationScript") {
    group = "application"
    description = "Generate migration script in the path exposed-migration/migrations"
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass = "eu.franz1007.gpstracker.database.migration.GenerateMigrationScriptKt"
}

// Necessary for flyway to work
tasks.shadowJar { mergeServiceFiles() }

tasks.test{
    systemProperties["junit.jupiter.execution.parallel.enabled"] = true
    systemProperties["junit.jupiter.execution.parallel.mode.default"] = "concurrent"
}