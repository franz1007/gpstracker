import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.kotlin.serialization)
}


group = "eu.franz1007"
version = "0.0.1"

repositories {
    mavenCentral()
}
kotlin {
    jvmToolchain(21)
    js {
        browser()
        binaries.executable()
    }
    jvm {
        @OptIn(ExperimentalKotlinGradlePluginApi::class) mainRun {
            mainClass = "eu.franz1007.gpstracker.ApplicationKt"
            //val isDevelopment: Boolean = project.ext.has("development")
            //applicationDefaultJvmArgs = listOf("-Dio.ktor.development=$isDevelopment")
            args(listOf("-Dio.ktor.development=true"))
        }
    }
    sourceSets {
        commonMain {
            dependencies {
                implementation(libs.kotlinx.datetime)
                implementation(libs.ktor.serialization.kotlinx.json)
            }
        }
        jsMain {
            dependencies {
                implementation(libs.kotlinx.html)
            }
        }
        jvmMain {
            dependencies {
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
                implementation(libs.ktor.server.content.negotiation)
                implementation(libs.postgresql)
                implementation(libs.h2)
                implementation(libs.exposed.core)
                implementation(libs.exposed.jdbc)
                implementation(libs.exposed.datetime)
                implementation(libs.ktor.server.netty)
                implementation(libs.logback.classic)
                implementation(libs.kotlinx.datetime)
                implementation(libs.ktor.server.cors)
            }
        }
        jvmTest {
            dependencies {
                implementation(libs.ktor.server.test.host)
                implementation(libs.kotlin.test.junit)
            }
        }
    }
}
tasks.named<Test>("jvmTest") {
    useJUnitPlatform()
    testLogging {
        showExceptions = true
        showStandardStreams = true
        events = setOf(
            org.gradle.api.tasks.testing.logging.TestLogEvent.FAILED,
            org.gradle.api.tasks.testing.logging.TestLogEvent.PASSED
        )
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}