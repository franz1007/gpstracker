package eu.franz1007.gpstracker

import eu.franz1007.gpstracker.plugins.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    configureSecurity()
    configureHTTP()
    configureMonitoring()
    configureTemplating()
    configureSockets()
    configureSerialization()
    configureDatabases()
    configureRouting()
}
