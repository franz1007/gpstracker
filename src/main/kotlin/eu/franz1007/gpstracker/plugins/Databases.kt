package eu.franz1007.gpstracker.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.datetime.Instant
import org.jetbrains.exposed.sql.*

fun Application.configureDatabases() {
    val database = Database.connect(
        url = "jdbc:h2:mem:test;DB_CLOSE_DELAY=-1",
        user = "root",
        driver = "org.h2.Driver",
        password = "",
    )
    val userService = UserService(database)
    val gpsPointService = GpsPointService(database)
    routing {
        // Create user
        post("/users") {
            val user = call.receive<ExposedUser>()
            val id = userService.create(user)
            call.respond(HttpStatusCode.Created, id)
        }

        // Read user
        get("/users/{id}") {
            val id = call.parameters["id"]?.toInt() ?: throw IllegalArgumentException("Invalid ID")
            val user = userService.read(id)
            if (user != null) {
                call.respond(HttpStatusCode.OK, user)
            } else {
                call.respond(HttpStatusCode.NotFound)
            }
        }

        // Update user
        put("/users/{id}") {
            val id = call.parameters["id"]?.toInt() ?: throw IllegalArgumentException("Invalid ID")
            val user = call.receive<ExposedUser>()
            userService.update(id, user)
            call.respond(HttpStatusCode.OK)
        }

        // Delete user
        delete("/users/{id}") {
            val id = call.parameters["id"]?.toInt() ?: throw IllegalArgumentException("Invalid ID")
            userService.delete(id)
            call.respond(HttpStatusCode.OK)
        }
    }
    routing {
        route("/api") {
            get("/addOsmand") {
                val timestamp =
                    call.parameters["timestamp"]?.toLong()?.let { it1 -> Instant.fromEpochMilliseconds(it1) }
                        ?: throw BadRequestException("Invalid timestamp")
                val lat = call.parameters["lat"]?.toDouble() ?: throw BadRequestException("Invalid lat")
                val lon = call.parameters["lon"]?.toDouble() ?: throw BadRequestException("Invalid lon")
                val hdop = call.parameters["hdop"]?.toDouble() ?: throw BadRequestException("Invalid hdop")
                val altitude = call.parameters["altitude"]?.toDouble() ?: throw BadRequestException("Invalid altitude")
                val speed = call.parameters["speed"]?.toDouble() ?: throw BadRequestException("Invalid speed")
                val bearing = call.parameters["bearing"]?.toDouble() ?: throw BadRequestException("Invalid bearing")
                val eta = call.parameters["eta"]?.toLong()?.let { it1 -> Instant.fromEpochMilliseconds(it1) }
                    ?: throw BadRequestException("Invalid eta")
                val etfa = call.parameters["etfa"]?.toLong()?.let { it1 -> Instant.fromEpochMilliseconds(it1) }
                    ?: throw BadRequestException("Invalid etfa")
                val eda = call.parameters["eda"]?.toInt() ?: throw BadRequestException("Invalid eda")
                val edfa = call.parameters["edfa"]?.toInt() ?: throw BadRequestException("Invalid edfa")
                val point = GpsPointNoId(timestamp, lat, lon, hdop, altitude, speed, bearing, eta, etfa, eda, edfa)
            }
        }
    }
}