package eu.franz1007.gpstracker.plugins

import kotlinx.coroutines.Dispatchers
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.kotlin.datetime.timestamp
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable
data class GpsPoint(
    val id: Long,
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

        override val primaryKey = PrimaryKey(id)
    }

    init {
        transaction(database) {
            SchemaUtils.create(GpsPoints)
        }
    }

    suspend fun create(
        point: GpsPointNoId
    ): Long = dbQuery {
        GpsPoints.insert {
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
        }[GpsPoints.id]
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

    suspend fun update(point: GpsPoint) {
        dbQuery {
            GpsPoints.update({ GpsPoints.id eq point.id }) {
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
            }
        }
    }

    suspend fun delete(id: Long) {
        dbQuery {
            GpsPoints.deleteWhere { GpsPoints.id.eq(id) }
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

    private suspend fun <T> dbQuery(block: suspend () -> T): T = newSuspendedTransaction(Dispatchers.IO) { block() }
}

