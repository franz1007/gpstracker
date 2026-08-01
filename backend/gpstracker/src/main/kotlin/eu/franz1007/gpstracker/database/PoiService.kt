@file:OptIn(ExperimentalUuidApi::class)

package eu.franz1007.gpstracker.database

import eu.franz1007.exposed.postgis.pointGeography
import kotlinx.coroutines.Dispatchers
import kotlinx.datetime.LocalDate
import kotlinx.serialization.Serializable
import net.postgis.jdbc.geometry.Point
import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.datetime.date
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.v1.jdbc.update
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

class PoiService(private val db: Database) {
    object Campsites : LongIdTable() {
        val uuid = uuid("uuid")
        val name = text("name")
        val location = pointGeography("location", srid = 4326)
        val description = text("description")
    }

    object CampsiteVisits : LongIdTable() {
        val uuid = uuid("uuid")
        val description = text("description")
        val dateArrived = date("date_arrived")
        val dateLeft = date("date_left")
        val priceCents = integer("price_cents").nullable()
        val personCount = integer("person_count").nullable()
        val tentCount = integer("tent_count").nullable()
        val carCount = integer("car_count").nullable()
        var vanCount = integer("van_count").nullable()
        val campsite = reference("campsite", Campsites)
    }

    suspend fun storeCampsite(campsite: Campsite) = dbQuery {
        Campsites.insert {
            it[uuid] = Uuid.random()
            it[name] = campsite.name
            it[description] = campsite.description
            it[location] = Point(campsite.location.lon, campsite.location.lat)
        }.let {
            DbEntity(
                uuid = it[Campsites.uuid], data = Campsite(
                    name = it[Campsites.name], location = it[Campsites.location].let {
                        Location(lat = it.y, lon = it.x)
                    }, description = it[Campsites.description]
                )
            )
        }
    }

    suspend fun storeVisit(visit: CampsiteVisit, campsiteId: Uuid): DbEntity<CampsiteVisit>? = dbQuery {
        Campsites.select(Campsites.id).where { Campsites.uuid eq campsiteId }.singleOrNull()?.let { camp ->
            CampsiteVisits.insert {
                it[uuid] = Uuid.random()
                it[description] = visit.description
                it[dateArrived] = visit.dateArrived
                it[dateLeft] = visit.dateLeft
                it[priceCents] = visit.priceCents
                it[personCount] = visit.personCount
                it[tentCount] = visit.tentCount
                it[carCount] = visit.carCount
                it[vanCount] = visit.vanCount
                it[campsite] = camp[Campsites.id]
            }.let {
                DbEntity(
                    uuid = it[CampsiteVisits.uuid], data = CampsiteVisit(
                        description = it[CampsiteVisits.description],
                        dateArrived = it[CampsiteVisits.dateArrived],
                        dateLeft = it[CampsiteVisits.dateLeft],
                        priceCents = it[CampsiteVisits.priceCents],
                        personCount = it[CampsiteVisits.personCount],
                        tentCount = it[CampsiteVisits.tentCount],
                        carCount = it[CampsiteVisits.carCount],
                        vanCount = it[CampsiteVisits.vanCount]
                    )
                )
            }
        }
    }

    suspend fun updateCampsite(campsite: Campsite, uuid: Uuid): DbEntity<Campsite>? = dbQuery {
        val updated = Campsites.update({ Campsites.uuid eq uuid }) {
            it[name] = campsite.name
            it[description] = campsite.description
            it[location] = Point(campsite.location.lon, campsite.location.lat)
        }
        when (updated) {
            0 -> null
            1 -> Campsites.selectAll().where { Campsites.uuid eq uuid }.single().let {
                DbEntity(
                    uuid = it[Campsites.uuid], data = Campsite(
                        name = it[Campsites.name], location = it[Campsites.location].let {
                            Location(lat = it.y, lon = it.x)
                        }, description = it[Campsites.description]
                    )
                )
            }

            else -> throw IllegalStateException("Updating multiple rows should not be possible")
        }
    }

    suspend fun updateVisit(visit: CampsiteVisit, uuid: Uuid): DbEntity<CampsiteVisit>? = dbQuery {
        val updated = CampsiteVisits.update({ CampsiteVisits.uuid eq uuid }) {
            it[description] = visit.description
            it[dateArrived] = visit.dateArrived
            it[dateLeft] = visit.dateLeft
            it[priceCents] = visit.priceCents
            it[personCount] = visit.personCount
            it[tentCount] = visit.tentCount
            it[carCount] = visit.carCount
            it[vanCount] = visit.vanCount
        }
        when (updated) {
            0 -> null
            1 -> CampsiteVisits.selectAll().where { CampsiteVisits.uuid eq uuid }.single().let {
                DbEntity(
                    uuid = it[CampsiteVisits.uuid], data = CampsiteVisit(
                        description = it[CampsiteVisits.description],
                        dateArrived = it[CampsiteVisits.dateArrived],
                        dateLeft = it[CampsiteVisits.dateLeft],
                        priceCents = it[CampsiteVisits.priceCents],
                        personCount = it[CampsiteVisits.personCount],
                        tentCount = it[CampsiteVisits.tentCount],
                        carCount = it[CampsiteVisits.carCount],
                        vanCount = it[CampsiteVisits.vanCount]
                    )
                )
            }

            else -> throw IllegalStateException("Updating multiple rows should not be possible")
        }
    }

    suspend fun getCampsite(uuid: Uuid): DbEntity<Campsite>? = dbQuery {
        Campsites.selectAll().where { Campsites.uuid eq uuid }.singleOrNull()?.let {
            DbEntity(
                uuid = it[Campsites.uuid], data = Campsite(
                    name = it[Campsites.name], location = it[Campsites.location].let {
                        Location(lat = it.y, lon = it.x)
                    }, description = it[Campsites.description]
                )
            )
        }
    }

    suspend fun getAllCampsites(): List<DbEntity<Campsite>> = dbQuery {
        Campsites.selectAll().map {
            DbEntity(
                uuid = it[Campsites.uuid], data = Campsite(
                    name = it[Campsites.name], location = it[Campsites.location].let {
                        Location(lat = it.y, lon = it.x)
                    }, description = it[Campsites.description]
                )
            )
        }
    }

    suspend fun getVisitsForCampsite(campsiteId: Uuid): List<DbEntity<CampsiteVisit>>? = dbQuery {
        Campsites.select(Campsites.id).where { Campsites.uuid eq campsiteId }.singleOrNull()?.let { camp ->
            CampsiteVisits.selectAll().where { CampsiteVisits.campsite eq camp[Campsites.id] }.map {
                DbEntity(
                    uuid = it[CampsiteVisits.uuid], data = CampsiteVisit(
                        description = it[CampsiteVisits.description],
                        dateArrived = it[CampsiteVisits.dateArrived],
                        dateLeft = it[CampsiteVisits.dateLeft],
                        priceCents = it[CampsiteVisits.priceCents],
                        personCount = it[CampsiteVisits.personCount],
                        tentCount = it[CampsiteVisits.tentCount],
                        carCount = it[CampsiteVisits.carCount],
                        vanCount = it[CampsiteVisits.vanCount]
                    )
                )
            }
        }
    }

    suspend fun getVisit(uuid: Uuid): DbEntity<CampsiteVisit>? = dbQuery {
        CampsiteVisits.selectAll().where { CampsiteVisits.uuid eq uuid }.singleOrNull()?.let {
            DbEntity(
                uuid = it[CampsiteVisits.uuid], data = CampsiteVisit(
                    description = it[CampsiteVisits.description],
                    dateArrived = it[CampsiteVisits.dateArrived],
                    dateLeft = it[CampsiteVisits.dateLeft],
                    priceCents = it[CampsiteVisits.priceCents],
                    personCount = it[CampsiteVisits.personCount],
                    tentCount = it[CampsiteVisits.tentCount],
                    carCount = it[CampsiteVisits.carCount],
                    vanCount = it[CampsiteVisits.vanCount]
                )
            )
        }
    }
}

@Serializable
data class DbEntity<T>(val uuid: Uuid, val data: T)

@Serializable
data class Location(
    val lat: Double,
    val lon: Double,
)

@Serializable
data class Campsite(
    val name: String, val location: Location, val description: String
)

@Serializable
data class CampsiteVisit(
    val description: String,
    val dateArrived: LocalDate,
    val dateLeft: LocalDate,
    val priceCents: Int?,
    val personCount: Int?,
    val tentCount: Int?,
    val carCount: Int?,
    val vanCount: Int?,
)

private suspend fun <T> dbQuery(block: suspend () -> T): T = newSuspendedTransaction(Dispatchers.IO) { block() }