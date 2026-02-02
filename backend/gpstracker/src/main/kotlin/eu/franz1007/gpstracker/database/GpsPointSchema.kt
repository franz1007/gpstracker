package eu.franz1007.gpstracker.database

import eu.franz1007.exposed.postgis.ST_AsGeoJSON
import eu.franz1007.exposed.postgis.ST_Force2D
import eu.franz1007.exposed.postgis.ST_Length
import eu.franz1007.exposed.postgis.ST_MakeLine
import eu.franz1007.exposed.postgis.pointGeography
import eu.franz1007.exposed.postgis.toGeography
import eu.franz1007.exposed.postgis.toGeometry
import eu.franz1007.gpstracker.model.*
import eu.franz1007.gpstracker.uitl.Quintuple
import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.JsonUnquotedLiteral
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.putJsonObject
import net.postgis.jdbc.geometry.Point
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.datetime.timestamp
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.experimental.newSuspendedTransaction
import kotlin.time.ExperimentalTime
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@OptIn(ExperimentalUuidApi::class, ExperimentalTime::class)
class GpsPointService(database: Database) {

    object Tracks : Table() {
        val id = long("id").autoIncrement()
        val uuid = uuid("uuid").index().autoGenerate()
        val startTimestamp = timestamp("startTimestamp")
        val endTimestamp = timestamp("endTimestamp")
        val category = enumeration<TRACK_CATEGORY>("category")
        override val primaryKey = PrimaryKey(id)
    }

    object GpsPoints : Table() {
        val id = long("id").autoIncrement()
        val timestamp = timestamp("timestamp")
        val hdop = double("hdop")
        val speed = double("speed")
        val bearing = double("bearing")
        val eta = timestamp("eta")
        val etfa = timestamp("etfa")
        val eda = integer("eda")
        val edfa = integer("edfa")
        val location = pointGeography("location", srid = 4326)
        val trackId = long("track_id") references Tracks.id
        override val primaryKey = PrimaryKey(id)
    }

    suspend fun addPoint(point: GpsPointNoId): Long {
        return dbQuery {
            val latest =
                Tracks.select(Tracks.id, Tracks.endTimestamp).orderBy(Tracks.endTimestamp, SortOrder.DESC).limit(1)
                    .map {
                        Pair(it[Tracks.id], it[Tracks.endTimestamp])
                    }.singleOrNull()
            val currentTrackId = if (latest == null || point.timestamp.minus(latest.second).inWholeMinutes > 60) {
                Tracks.insert {
                    it[startTimestamp] = point.timestamp
                    it[endTimestamp] = point.timestamp
                    it[category] = TRACK_CATEGORY.UNCATEGORIZED
                }[Tracks.id]
            } else {
                latest.first

            }

            val newPointGeographyId = GpsPoints.insert {
                it[timestamp] = point.timestamp
                it[hdop] = point.hdop
                it[speed] = point.speed
                it[bearing] = point.bearing
                it[eta] = point.eta
                it[etfa] = point.etfa
                it[eda] = point.eda
                it[edfa] = point.edfa
                it[trackId] = currentTrackId
                it[location] = Point(point.lat, point.lon, point.altitude)
            }[GpsPoints.id]
            Tracks.update({ Tracks.id eq currentTrackId }) {
                it[endTimestamp] = point.timestamp
            }
            return@dbQuery newPointGeographyId
        }
    }

    suspend fun categorizeTrack(trackId: Uuid, newCategory: TRACK_CATEGORY): TrackNoPoints? {
        return dbQuery {
            return@dbQuery Tracks.updateReturning(where = { Tracks.uuid eq trackId }) {
                it[uuid] = Uuid.random()
                it[category] = newCategory
            }.map {
                TrackNoPoints(
                    it[Tracks.uuid], it[Tracks.startTimestamp], it[Tracks.endTimestamp], it[Tracks.category]
                )
            }.singleOrNull()
        }
    }

    suspend fun importTrack(track: TrackNoId): Long {
        return dbQuery {
            val id = Tracks.insert {
                it[startTimestamp] = track.startTimestamp
                it[endTimestamp] = track.endTimestamp
                it[category] = track.category
            }[Tracks.id]
            track.points.forEach { point ->
                GpsPoints.insert {
                    it[timestamp] = point.timestamp
                    it[hdop] = point.hdop
                    it[speed] = point.speed
                    it[bearing] = point.bearing
                    it[eta] = point.eta
                    it[etfa] = point.etfa
                    it[eda] = point.eda
                    it[edfa] = point.edfa
                    it[trackId] = id
                    it[location] = Point(point.lon, point.lat, point.altitude)
                }[GpsPoints.id]
            }
            return@dbQuery id
        }
    }

    suspend fun read(id: Long): GpsPoint? {
        return dbQuery {
            GpsPoints.selectAll().where { GpsPoints.id eq id }.map {
                GpsPoint(
                    it[GpsPoints.id],
                    it[GpsPoints.timestamp],
                    it[GpsPoints.location].y,
                    it[GpsPoints.location].x,
                    it[GpsPoints.hdop],
                    it[GpsPoints.location].z,
                    it[GpsPoints.speed],
                    it[GpsPoints.bearing],
                    it[GpsPoints.eta],
                    it[GpsPoints.etfa],
                    it[GpsPoints.eda],
                    it[GpsPoints.edfa]
                )
            }.singleOrNull()
        }
    }

    suspend fun readAllPoints(): List<GpsPoint> {
        return dbQuery {
            GpsPoints.selectAll().map {
                GpsPoint(
                    it[GpsPoints.id],
                    it[GpsPoints.timestamp],
                    it[GpsPoints.location].y,
                    it[GpsPoints.location].x,
                    it[GpsPoints.hdop],
                    it[GpsPoints.location].z,
                    it[GpsPoints.speed],
                    it[GpsPoints.bearing],
                    it[GpsPoints.eta],
                    it[GpsPoints.etfa],
                    it[GpsPoints.eda],
                    it[GpsPoints.edfa]
                )
            }.toList()
        }
    }

    suspend fun readLatestPoints(limit: Int): List<GpsPoint> {
        return dbQuery {
            GpsPoints.selectAll().orderBy(GpsPoints.timestamp, SortOrder.DESC).limit(limit).map {
                GpsPoint(
                    it[GpsPoints.id],
                    it[GpsPoints.timestamp],
                    it[GpsPoints.location].y,
                    it[GpsPoints.location].x,
                    it[GpsPoints.hdop],
                    it[GpsPoints.location].z,
                    it[GpsPoints.speed],
                    it[GpsPoints.bearing],
                    it[GpsPoints.eta],
                    it[GpsPoints.etfa],
                    it[GpsPoints.eda],
                    it[GpsPoints.edfa]
                )
            }
        }
    }

    suspend fun readAllTracksWithoutPoints(): List<TrackNoPoints> {
        return dbQuery {
            Tracks.selectAll().map {
                TrackNoPoints(
                    it[Tracks.uuid], it[Tracks.startTimestamp], it[Tracks.endTimestamp], it[Tracks.category]
                )
            }
        }
    }

    suspend fun readLatestTrackNoPoints(): TrackNoPoints? {
        return dbQuery {
            Tracks.selectAll().orderBy(Tracks.endTimestamp, SortOrder.DESC).limit(1).map {
                TrackNoPoints(
                    it[Tracks.uuid], it[Tracks.startTimestamp], it[Tracks.endTimestamp], it[Tracks.category]
                )
            }.singleOrNull()
        }
    }

    //TODO query with join should be better
    suspend fun readLatestTrack(): Track? {
        return dbQuery {
            val (trackId, trackUuid, startTimestamp, endTimestamp, category) = Tracks.selectAll()
                .orderBy(Tracks.endTimestamp, SortOrder.DESC).limit(1).map {
                    Quintuple(
                        it[Tracks.id],
                        it[Tracks.uuid],
                        it[Tracks.startTimestamp],
                        it[Tracks.endTimestamp],
                        it[Tracks.category]
                    )
                }.singleOrNull() ?: return@dbQuery null
            val points =
                GpsPoints.selectAll().where { GpsPoints.trackId eq trackId }.orderBy(GpsPoints.timestamp, SortOrder.ASC)
                    .map {
                        GpsPoint(
                            it[GpsPoints.id],
                            it[GpsPoints.timestamp],
                            it[GpsPoints.location].y,
                            it[GpsPoints.location].x,
                            it[GpsPoints.hdop],
                            it[GpsPoints.location].z,
                            it[GpsPoints.speed],
                            it[GpsPoints.bearing],
                            it[GpsPoints.eta],
                            it[GpsPoints.etfa],
                            it[GpsPoints.eda],
                            it[GpsPoints.edfa]
                        )
                    }
            Track(trackUuid, startTimestamp, endTimestamp, points, category)
        }
    }

    suspend fun readTrack(uuid: Uuid): Track? {
        return dbQuery {
            val (trackId, trackUuid, startTimestamp, endTimestamp, category) = Tracks.selectAll()
                .where { Tracks.uuid eq uuid }.map {
                    Quintuple(
                        it[Tracks.id],
                        it[Tracks.uuid],
                        it[Tracks.startTimestamp],
                        it[Tracks.endTimestamp],
                        it[Tracks.category]
                    )
                }.singleOrNull() ?: return@dbQuery null
            val points =
                GpsPoints.selectAll().where { GpsPoints.trackId eq trackId }.orderBy(GpsPoints.timestamp, SortOrder.ASC)
                    .map {
                        GpsPoint(
                            it[GpsPoints.id],
                            it[GpsPoints.timestamp],
                            it[GpsPoints.location].y,
                            it[GpsPoints.location].x,
                            it[GpsPoints.hdop],
                            it[GpsPoints.location].z,
                            it[GpsPoints.speed],
                            it[GpsPoints.bearing],
                            it[GpsPoints.eta],
                            it[GpsPoints.etfa],
                            it[GpsPoints.eda],
                            it[GpsPoints.edfa]
                        )
                    }
            Track(trackUuid, startTimestamp, endTimestamp, points, category)
        }
    }

    @OptIn(ExperimentalSerializationApi::class)
    suspend fun readTrackGeoJson(uuid: Uuid): String? = dbQuery {
        Tracks.leftJoin(GpsPoints).select(
            Tracks.category,
            Tracks.startTimestamp,
            Tracks.endTimestamp,
            GpsPoints.location.toGeometry().ST_MakeLine().ST_AsGeoJSON(),
            GpsPoints.location.toGeometry().ST_MakeLine().ST_Force2D().toGeography().ST_Length()
        ).where { Tracks.uuid eq uuid }.groupBy(Tracks.id).singleOrNull()?.let {
            val distanceMeters =
                it[GpsPoints.location.toGeometry().ST_MakeLine().ST_Force2D().toGeography().ST_Length()]
            val startTimestamp = it[Tracks.startTimestamp]
            val endTimestamp = it[Tracks.endTimestamp]
            val averageSpeedKph =
                ((distanceMeters / endTimestamp.minus(startTimestamp).inWholeSeconds) * 3.6).takeIf { speed -> speed.isFinite() }
                    ?: 0.0
            Json.encodeToString(buildJsonObject {
                put("type", JsonPrimitive("Feature"))
                put("geometry", JsonUnquotedLiteral(it[GpsPoints.location.toGeometry().ST_MakeLine().ST_AsGeoJSON()]))
                put("uuid", JsonPrimitive(uuid.toString()))
                putJsonObject("properties") {
                    put("startTimestamp", JsonPrimitive(startTimestamp.toString()))
                    put("endTimestamp", JsonPrimitive(endTimestamp.toString()))
                    put("distanceMeters", JsonPrimitive(distanceMeters.toInt().toString()))
                    put("category", JsonPrimitive(it[Tracks.category].toString()))
                    put("averageSpeedKph", JsonPrimitive(averageSpeedKph.toString()))
                }
            })
        }
    }

    private suspend fun <T> dbQuery(block: suspend () -> T): T = newSuspendedTransaction(Dispatchers.IO) { block() }
}

