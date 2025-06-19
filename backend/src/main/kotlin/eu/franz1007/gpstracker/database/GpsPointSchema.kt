package eu.franz1007.gpstracker.database

import eu.franz1007.gpstracker.model.*
import eu.franz1007.gpstracker.uitl.Quadruple
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction


class GpsPointService(database: Database) {

    object Tracks : Table() {
        val id = long("id").autoIncrement()
        val startTimestamp = timestamp("startTimestamp")
        val endTimestamp = timestamp("endTimestamp")
        val category = enumeration<TRACK_CATEGORY>("category")
        override val primaryKey = PrimaryKey(id)
    }

    object GpsPositions : Table() {
        val id = long("id").autoIncrement()
        val lat = double("lat")
        val lon = double("lon")

        override val primaryKey = PrimaryKey(id)
    }

    object GpsPoints : Table() {
        val id = long("id").autoIncrement()
        val timestamp = timestamp("timestamp")
        val hdop = double("hdop")
        val altitude = double("altitude")
        val speed = double("speed")
        val bearing = double("bearing")
        val eta = timestamp("eta")
        val etfa = timestamp("etfa")
        val eda = integer("eda")
        val edfa = integer("edfa")
        val positionId = long("position_id") references GpsPositions.id
        val trackId = long("track_id") references Tracks.id

        override val primaryKey = PrimaryKey(id)
    }

    init {
        transaction(database) {
            addLogger(StdOutSqlLogger)
            SchemaUtils.create(GpsPositions, Tracks, GpsPoints)
        }
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

            val newPositionId = GpsPositions.insert {
                it[lat] = point.lat
                it[lon] = point.lon
            }[GpsPositions.id]

            val newPointId = GpsPoints.insert {
                it[timestamp] = point.timestamp
                it[hdop] = point.hdop
                it[altitude] = point.altitude
                it[speed] = point.speed
                it[bearing] = point.bearing
                it[eta] = point.eta
                it[etfa] = point.etfa
                it[eda] = point.eda
                it[edfa] = point.edfa
                it[positionId] = newPositionId
                it[trackId] = currentTrackId
            }[GpsPoints.id]
            Tracks.update({ Tracks.id eq currentTrackId }) {
                it[endTimestamp] = point.timestamp
            }
            return@dbQuery newPointId
        }
    }

    suspend fun categorizeTrack(trackId: Long, newCategory: TRACK_CATEGORY) {
        dbQuery {
            Tracks.update({ Tracks.id eq trackId }) {
                it[category] = newCategory
            }
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
                val newPositionId = GpsPositions.insert {
                    it[lat] = point.lat
                    it[lon] = point.lon
                }[GpsPositions.id]
                GpsPoints.insert {
                    it[timestamp] = point.timestamp
                    it[hdop] = point.hdop
                    it[altitude] = point.altitude
                    it[speed] = point.speed
                    it[bearing] = point.bearing
                    it[eta] = point.eta
                    it[etfa] = point.etfa
                    it[eda] = point.eda
                    it[edfa] = point.edfa
                    it[positionId] = newPositionId
                    it[trackId] = id
                }[GpsPoints.id]
            }
            return@dbQuery id
        }
    }

    suspend fun read(id: Long): GpsPoint? {
        return dbQuery {
            GpsPoints.leftJoin(GpsPositions).selectAll().where { GpsPoints.id eq id }.map {
                GpsPoint(
                    it[GpsPoints.id],
                    it[GpsPoints.timestamp],
                    it[GpsPositions.lat],
                    it[GpsPositions.lon],
                    it[GpsPoints.hdop],
                    it[GpsPoints.altitude],
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
            GpsPoints.leftJoin(GpsPositions).selectAll().map {
                GpsPoint(
                    it[GpsPoints.id],
                    it[GpsPoints.timestamp],
                    it[GpsPositions.lat],
                    it[GpsPositions.lon],
                    it[GpsPoints.hdop],
                    it[GpsPoints.altitude],
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
            GpsPoints.leftJoin(GpsPositions).selectAll().orderBy(GpsPoints.timestamp, SortOrder.DESC).limit(limit).map {
                GpsPoint(
                    it[GpsPoints.id],
                    it[GpsPoints.timestamp],
                    it[GpsPositions.lat],
                    it[GpsPositions.lon],
                    it[GpsPoints.hdop],
                    it[GpsPoints.altitude],
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
                TrackNoPoints(it[Tracks.id], it[Tracks.startTimestamp], it[Tracks.endTimestamp], it[Tracks.category])
            }
        }
    }

    suspend fun readLatestTrackNoPoints(): TrackNoPoints? {
        return dbQuery {
            Tracks.selectAll().orderBy(Tracks.endTimestamp, SortOrder.DESC).limit(1).map {
                TrackNoPoints(
                    it[Tracks.id], it[Tracks.startTimestamp], it[Tracks.endTimestamp], it[Tracks.category]
                )
            }.singleOrNull()
        }
    }

    //TODO query with join should be better
    suspend fun readLatestTrack(): Track? {
        return dbQuery {
            val (trackId, startTimestamp, endTimestamp, category) =
                Tracks.selectAll()
                    .orderBy(Tracks.endTimestamp, SortOrder.DESC).limit(1).map {
                        Quadruple(
                            it[Tracks.id], it[Tracks.startTimestamp], it[Tracks.endTimestamp], it[Tracks.category]
                        )
                    }.singleOrNull() ?: return@dbQuery null
            val points = pointsByTrack(trackId)
            Track(trackId, startTimestamp, endTimestamp, points, category)
        }
    }

    suspend fun readTrack(id: Long): Track? {
        return dbQuery {
            val (trackId, startTimestamp, endTimestamp, category) =
                Tracks.selectAll().where { Tracks.id eq id }.map {
                    Quadruple(it[Tracks.id], it[Tracks.startTimestamp], it[Tracks.endTimestamp], it[Tracks.category])
                }.singleOrNull() ?: return@dbQuery null
            val points = pointsByTrack(trackId)
            Track(trackId, startTimestamp, endTimestamp, points, category)
        }
    }

    suspend fun pointsByTrack(id: Long): List<GpsPoint> {
        return dbQuery {
            GpsPoints.leftJoin(GpsPositions).selectAll().where { GpsPoints.trackId eq id }
                .orderBy(GpsPoints.timestamp, SortOrder.ASC).map {
                    GpsPoint(
                        it[GpsPoints.id],
                        it[GpsPoints.timestamp],
                        it[GpsPositions.lat],
                        it[GpsPositions.lon],
                        it[GpsPoints.hdop],
                        it[GpsPoints.altitude],
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

    private suspend fun <T> dbQuery(block: suspend () -> T): T = newSuspendedTransaction(Dispatchers.IO) { block() }
}

