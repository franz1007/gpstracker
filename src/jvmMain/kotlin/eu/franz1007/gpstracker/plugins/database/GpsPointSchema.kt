package eu.franz1007.gpstracker.plugins.database

import eu.franz1007.gpstracker.model.GpsPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction
import kotlin.time.DurationUnit

@Serializable
data class GpsPointNoId(
    val timestamp: Instant,
    val lat: Double,
    val lon: Double,
    val hdop: Double,
    val altitude: Double,
    val speed: Double,
    val bearing: Double,
    val eta: Instant,
    val etfa: Instant,
    val eda: Int,
    val edfa: Int
)


class GpsPointService(database: Database) {

    object Tracks : Table() {
        val id = long("id").autoIncrement()
        val startTimestamp = timestamp("startTimestamp")
        val endTimestamp = timestamp("endTimestamp")
        override val primaryKey = PrimaryKey(id)
    }

    object GpsPoints : Table() {
        val id = long("id").autoIncrement()
        val timestamp = timestamp("timestamp")
        val lat = double("lat")
        val lon = double("lon")
        val hdop = double("hdop")
        val altitude = double("altitude")
        val speed = double("speed")
        val bearing = double("bearing")
        val eta = timestamp("eta")
        val etfa = timestamp("etfa")
        val eda = integer("eda")
        val edfa = integer("edfa")
        val trackId = long("track_id") references Tracks.id

        override val primaryKey = PrimaryKey(id)
    }

    init {
        transaction(database) {
            SchemaUtils.create(Tracks)
            SchemaUtils.create(GpsPoints)
        }
    }

    suspend fun addPoint(point: GpsPointNoId): Long {
        return dbQuery {
            val latest = Tracks.select(Tracks.id, Tracks.endTimestamp).orderBy(Tracks.endTimestamp).limit(1).map {
                Pair(it[Tracks.id],it[Tracks.endTimestamp])
            }.singleOrNull()
            val currentTrackId = if(latest == null){
                Tracks.insert {
                    it[startTimestamp] = point.timestamp
                    it[endTimestamp] = point.timestamp
                }[Tracks.id]
            }
            else{
                // Create new Track if latest track is older than an hour
                if(point.timestamp.minus(latest.second).inWholeMinutes > 60){
                    Tracks.insert {
                        it[startTimestamp] = point.timestamp
                        it[endTimestamp] = point.timestamp
                    }[Tracks.id]
                }
                else{
                    latest.first
                }
            }

            val newPointId = GpsPoints.insert {
                it[timestamp] = point.timestamp
                it[lat] = point.lat
                it[lon] = point.lon
                it[hdop] = point.hdop
                it[altitude] = point.altitude
                it[speed] = point.speed
                it[bearing] = point.bearing
                it[eta] = point.eta
                it[etfa] = point.etfa
                it[eda] = point.eda
                it[edfa] = point.edfa
                it[trackId] = currentTrackId
            }[GpsPoints.id]
            Tracks.update({ Tracks.id eq currentTrackId }) {
                it[endTimestamp] = point.timestamp
            }
            return@dbQuery newPointId
        }
    }

    suspend fun read(id: Long): GpsPoint? {
        return dbQuery {
            GpsPoints.selectAll().where { GpsPoints.id eq id }.map {
                GpsPoint(
                    it[GpsPoints.id],
                    it[GpsPoints.timestamp],
                    it[GpsPoints.lat],
                    it[GpsPoints.lon],
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

    suspend fun readAll(): List<GpsPoint> {
        return dbQuery {
            GpsPoints.selectAll().map {
                GpsPoint(
                    it[GpsPoints.id],
                    it[GpsPoints.timestamp],
                    it[GpsPoints.lat],
                    it[GpsPoints.lon],
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

    suspend fun readLatest(limit: Int): List<GpsPoint> {
        return dbQuery {
            GpsPoints.selectAll().orderBy(GpsPoints.timestamp, SortOrder.ASC).limit(limit).map {
                GpsPoint(
                    it[GpsPoints.id],
                    it[GpsPoints.timestamp],
                    it[GpsPoints.lat],
                    it[GpsPoints.lon],
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

