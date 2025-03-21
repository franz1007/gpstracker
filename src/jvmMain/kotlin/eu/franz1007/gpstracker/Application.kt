package eu.franz1007.gpstracker

import eu.franz1007.gpstracker.plugins.*
import io.ktor.server.application.*


fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    configureCors()
    configureSecurity()
    configureHTTP()
    configureMonitoring()
    configureTemplating()
    configureSockets()
    configureSerialization()
    configureRouting()
    configureDatabases(environment.config)
}
