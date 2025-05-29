package eu.franz1007.gpstracker

import eu.franz1007.gpstracker.database.GpsPointService
import io.ktor.server.application.*
import org.jetbrains.exposed.sql.Database


fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    configureCors()
    configureSecurity()
    configureHTTP()
    configureMonitoring()
    configureSockets()
    configureSerialization()
    configureRouting()
    val database = Database.connect(
        url = environment.config.property("storage.url").getString(),
        user = environment.config.property("storage.user").getString(),
        driver = environment.config.property("storage.driver").getString(),
        password = environment.config.property("storage.password").getString(),
    )
    val gpsPointService = GpsPointService(database)
    configureDatabases(gpsPointService)

}
