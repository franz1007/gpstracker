package eu.franz1007.gpstracker

import eu.franz1007.gpstracker.database.GpsPointService
import eu.franz1007.gpstracker.gpxtool.GpxParser
import eu.franz1007.gpstracker.model.*
import eu.franz1007.gpstracker.util.SloppyMath
import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.application.*
import io.ktor.server.plugins.*
import io.ktor.server.plugins.cachingheaders.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import io.ktor.server.websocket.*
import io.ktor.sse.*
import io.ktor.util.collections.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.io.IOException
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.nio.file.Files
import java.util.*
import kotlin.io.path.Path
import kotlin.io.path.inputStream
import kotlin.io.path.isRegularFile
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.measureTime
import kotlin.time.toDuration

fun Application.configureDatabases(gpsPointService: GpsPointService) {
    val connections = Collections.synchronizedSet<DefaultWebSocketServerSession>(LinkedHashSet())
    val sseConnections = ConcurrentSet<ServerSSESession>()
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
            val id = gpsPointService.addPoint(point)
            connections.forEach {
                it.sendSerialized(point)
            }
            val event = ServerSentEvent(Json.encodeToString(point), id = id.toString())
            sseConnections.forEach {
                println("sendingSSE")
                try {
                    it.send(event)
                } catch (e: IOException) {
                    sseConnections.remove(it)
                }
            }
            call.response.status(HttpStatusCode.OK)
        }
        route("/api") {
            route("/points") {
                get {
                    call.respond(gpsPointService.readAllPoints())
                }
                get("/byTrack/{trackId}") {
                    when (val trackId = call.parameters["trackId"]) {
                        "latest" -> {
                            val track = gpsPointService.readLatestTrack()
                            if (track == null) {
                                call.respond("")
                            } else {
                                call.respond(gpsPointService.pointsByTrack(track.id))
                            }
                        }

                        null -> call.respond(HttpStatusCode.BadRequest)
                        else -> {
                            call.caching = CachingOptions(CacheControl.MaxAge(maxAgeSeconds = 3600))
                            call.respond(gpsPointService.pointsByTrack(trackId.toLong()))
                        }
                    }
                }
            }
            route("/tracks") {
                get {
                    call.respond(gpsPointService.readAllTracksWithoutPoints())
                }
                get("/withMetadata/{trackId}") {
                    val trackId = call.parameters["trackId"]
                    if (trackId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Path parameter id required")
                    } else {
                        val track = gpsPointService.readTrack(trackId.toLong())
                        if (track == null) {
                            call.respond(HttpStatusCode.NotFound)
                        } else {
                            val withMetadata = track.calculateMetadata().onlyMetadata()
                            call.respond(
                                withMetadata
                            )
                        }
                    }
                }
                post("/updateCategory"){
                    val trackId = call.parameters["trackId"]
                    val newCategory = call.parameters["category"]
                }

                get("/latest") {
                    call.respondNullable(gpsPointService.readLatestTrack())
                }
            }
            route("/trackCategories"){
                get{
                    println(TRACK_CATEGORY.entries.toTypedArray())
                    call.respond(TRACK_CATEGORY.entries.toTypedArray())
                }
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
                println("Adding sse connection")
                sseConnections += this
                while (true) {
                    try {
                        send(ServerSentEvent("ping", "ping", null, 1_000, null))
                    } catch (e: IOException) {
                        sseConnections.remove(this)
                    }
                    delay(10000)
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

        /*
        run {
            run {
                val parser = GpxParser()
                val tracks = Files.walk(Path("September2024")).filter { it.isRegularFile() }.map {
                    TrackNoId.fromGpxTrack(parser.parseGpx(it.inputStream()))
                }.toList()
                tracks.forEach {
                    gpsPointService.importTrack(it.copy(category = TRACK_CATEGORY.CYCLING))
                }
            }
        }
                        run {
                            val parser = GpxParser()
                            val tracks = Files.walk(Path("September2024")).filter { it.isRegularFile() }.map {
                                TrackNoId.fromGpxTrack(parser.parseGpx(it.inputStream()))
                            }.toList()
                            tracks.forEach {
                                gpsPointService.importTrack(it)
                            }
                        }


                                runBlocking {
                                    initPoints(pointMunich, gpsPointService, connections, sseConnections, 10.milliseconds, 3.hours)
                                }
                                runBlocking {
                                    initPoints(pointSalzburg, gpsPointService, connections, sseConnections, 1.seconds, Duration.ZERO)
                                }

                                 */
    }
}

suspend fun initPoints(
    startingPoint: GpsPointNoId,
    gpsPointService: GpsPointService,
    connections: MutableSet<DefaultWebSocketServerSession>,
    sseConnections: MutableSet<ServerSSESession>,
    delay: Duration,
    timeAgo: Duration
) {
    var lat = startingPoint.lat
    var lon = startingPoint.lon
    repeat(1000) { repetition ->
        if ((repetition + 2) % 2 == 0) lat += 0.0001
        lon += 0.0001
        val timestamp = Clock.System.now().minus(timeAgo)
        val id = gpsPointService.addPoint(startingPoint.copy(timestamp, lat = lat, lon = lon))
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
        delay(delay)
    }
}