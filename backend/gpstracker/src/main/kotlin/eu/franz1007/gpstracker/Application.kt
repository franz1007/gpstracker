package eu.franz1007.gpstracker

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import eu.franz1007.gpstracker.database.GpsPointService
import io.ktor.server.application.*
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database


fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

@Suppress("unused")
fun Application.module() {
    configureCors()
    configureSecurity()
    configureHTTP()
    configureMonitoring()
    configureSockets()
    configureSerialization()
    configureRouting()
    val databaseUrl = environment.config.property("storage.url").getString()
    val databaseUser = environment.config.property("storage.user").getString()
    val databasePassword = environment.config.property("storage.password").getString()
    val hikari = HikariDataSource(HikariConfig().apply {
        jdbcUrl = databaseUrl
        username = databaseUser
        password = databasePassword
        maximumPoolSize = 2
    })
    val flyway = Flyway.configure().dataSource(databaseUrl, databaseUser, databasePassword).baselineOnMigrate(true)
        .validateMigrationNaming(true).load()
    val database = Database.connect(hikari)
    flyway.migrate()
    val gpsPointService = GpsPointService(database)
    configureGpsRoutes(gpsPointService)

}
