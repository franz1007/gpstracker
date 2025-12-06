@file:OptIn(ExperimentalTime::class)

package eu.franz1007.gpstracker

import eu.franz1007.gpstracker.database.GpsPointService
import eu.franz1007.gpstracker.model.GpsPointNoId
import eu.franz1007.gpstracker.model.TRACK_CATEGORY
import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cachingheaders.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import io.ktor.server.util.*
import io.ktor.server.websocket.*
import io.ktor.sse.*
import io.ktor.util.collections.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.io.IOException
import kotlinx.serialization.json.Json
import java.util.*
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.ExperimentalTime
import kotlin.time.Instant
import kotlin.time.toDuration
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@OptIn(ExperimentalUuidApi::class)
fun Application.configureGpsRoutes(gpsPointService: GpsPointService) {
    val connections = Collections.synchronizedSet<DefaultWebSocketServerSession>(LinkedHashSet())
    val sseConnections = ConcurrentSet<ServerSSESession>()
    routing {
        get("/osmand") {
            val timestamp =
                call.parameters.getOrFail<Long>("timestamp").let { it1 -> Instant.fromEpochMilliseconds(it1) }
            val lat = call.parameters.getOrFail<Double>("lat")
            val lon = call.parameters.getOrFail<Double>("lon")
            val hdop = call.parameters.getOrFail<Double>("hdop")
            val altitude = call.parameters.getOrFail<Double>("altitude")
            val speed = call.parameters.getOrFail<Double>("speed")
            val bearing = call.parameters.getOrFail<Double>("bearing")
            val eta = call.parameters.getOrFail<Long>("eta").let { it1 -> Instant.fromEpochMilliseconds(it1) }
            val etfa = call.parameters.getOrFail<Long>("etfa").let { it1 -> Instant.fromEpochMilliseconds(it1) }
            val eda = call.parameters.getOrFail<Int>("eda")
            val edfa = call.parameters.getOrFail<Int>("edfa")
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
            route("/tracks") {
                get {
                    call.respond(gpsPointService.readAllTracksWithoutPoints())
                }
                get("/metadata/{trackId}") {
                    val trackId = call.parameters.getOrFail("trackid").let {
                        runCatching {
                            Uuid.parse(it)
                        }.getOrElse {
                            call.respond(HttpStatusCode.BadRequest, it.message.orEmpty())
                            return@get
                        }
                    }
                    println("test")
                    val track = gpsPointService.readTrack(trackId)
                    if (track == null) {
                        call.respond(HttpStatusCode.NotFound)
                    } else {
                        call.respond(
                            track.calculateMetadata().onlyMetadata()
                        )
                    }
                }
                get("/geoJson/{trackId}") {
                    when (val trackId = call.parameters.getOrFail("trackId")) {
                        "latest" -> {
                            val track = gpsPointService.readLatestTrack()
                            if (track == null) {
                                call.respond("")
                            } else {
                                call.respond(track.calculateMetadata().toGeoJson().json())
                            }
                        }

                        else -> {
                            call.caching = CachingOptions(CacheControl.MaxAge(maxAgeSeconds = 3600))
                            val track = gpsPointService.readTrack(Uuid.parse(trackId))
                            if (track == null) {
                                call.respond(HttpStatusCode.NotFound, "Track $trackId does not exist")
                            } else {
                                call.respond(
                                    track.calculateMetadata().toGeoJson().json()
                                )
                            }
                        }

                    }
                }
                post("/updateCategory") {
                    val trackId = call.parameters.getOrFail("trackid").let {
                        runCatching {
                            Uuid.parse(it)
                        }.getOrElse {
                            call.respond(HttpStatusCode.BadRequest, it.message.orEmpty())
                            return@post
                        }
                    }
                    val newCategory = call.parameters.getOrFail("category")
                    val changedTrack = gpsPointService.categorizeTrack(trackId, TRACK_CATEGORY.valueOf(newCategory))
                    if (changedTrack == null) {
                        call.respond(HttpStatusCode.BadRequest, "No track available with this uuid")
                    } else {
                        call.respond(changedTrack)
                    }
                }

                get("/latest") {
                    call.respondNullable(gpsPointService.readLatestTrackNoPoints())
                }
            }
            route("/trackCategories") {
                get {
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