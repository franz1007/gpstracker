package eu.franz1007.gpstracker.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.server.plugins.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import io.ktor.server.websocket.*
import io.ktor.sse.*
import io.ktor.util.collections.*
import kotlinx.coroutines.channels.produce
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.io.IOException
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.Database
import java.lang.Thread.sleep
import java.util.*
import kotlin.time.DurationUnit
import kotlin.time.toDuration

fun Application.configureDatabases(config: ApplicationConfig) {
    val connections = Collections.synchronizedSet<DefaultWebSocketServerSession>(LinkedHashSet())
    val sseConnections = ConcurrentSet<ServerSSESession>()
    val database = Database.connect(
        url = config.property("storage.url").getString(),
        user = config.property("storage.user").getString(),
        driver = config.property("storage.driver").getString(),
        password = config.property("storage.password").getString(),
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
        get("/osmand") {
            val timestamp = call.parameters["timestamp"]?.toLong()?.let { it1 -> Instant.fromEpochMilliseconds(it1) }
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
            val id = gpsPointService.create(point)
            connections.forEach {
                it.sendSerialized(point)
            }
            val event = ServerSentEvent(Json.encodeToString(point), "newPoint", id.toString(), 1_000, null)
            sseConnections.forEach {
                it.send(event)
            }
        }
        route("/api") {
            get("/points") {
                call.respond(gpsPointService.readAll())
            }
            webSocket("/ws") {
                println("Adding user!")
                connections += this
                println(connections)
                try {
                    for (frame in incoming) {
                        println(frame)
                    }
                } catch (e: Exception) {
                    println(e.localizedMessage)
                } finally {
                    println("Removing $this!")
                    connections -= this
                }
            }
            sse("/sse") {
                sseConnections += this
                while (true) {
                    delay(10000)
                    try {
                        send(ServerSentEvent("ping", "ping", null, 1_000, null))
                    } catch (e: IOException) {
                        sseConnections.remove(this)
                    }
                }
            }
        }


    }

    launch {
        val pointMunich = GpsPointNoId(
            timestamp = Clock.System.now(),
            lat = 48.1374300,
            lon = 11.5754900,
            altitude = 524.0,
            hdop = 1.0,
            speed = 0.0,
            bearing = 0.0,
            eta = Instant.fromEpochMilliseconds(0),
            etfa = Instant.fromEpochMilliseconds(0),
            eda = 0,
            edfa = 0
        )
        val pointSalzburg = pointMunich.copy(
            timestamp = Clock.System.now().minus(1.toDuration(DurationUnit.MINUTES)),
            lat = 47.7994100,
            lon = 13.0439900,
            altitude = 520.0
        )
        gpsPointService.create(pointMunich)
        gpsPointService.create(pointSalzburg)
        var lat = 47.7994100
        var lon = 13.0439900
        repeat(1000) { repetition ->
            if ((repetition + 2) % 2 == 0) lat += 0.0001
            lon += 0.0001
            val id = gpsPointService.create(pointSalzburg.copy(timestamp = Clock.System.now(), lat = lat, lon = lon))
            val point = gpsPointService.read(id)
            connections.forEach {
                println("sending")
                it.sendSerialized(point)
            }
            sseConnections.forEach {
                println("sendingSSE")
                try {
                    it.send(ServerSentEvent(Json.encodeToString(point), id = point?.id.toString()))
                } catch (e: IOException) {
                    sseConnections.remove(it)
                }
            }
            println("Loop")
            sleep(1000)
        }
    }

}