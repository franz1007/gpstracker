plugins {
    id("kotlin")
}

group = "eu.franz1007"
version = "0.0.1"

repositories {
    mavenCentral()
}

dependencies {
    implementation(libs.exposed.jdbc)
    implementation(libs.postgis)


    testImplementation(libs.kotlin.test.junit)
    testImplementation(libs.testcontainers.postgres)
}

kotlin {
    jvmToolchain(21)
}