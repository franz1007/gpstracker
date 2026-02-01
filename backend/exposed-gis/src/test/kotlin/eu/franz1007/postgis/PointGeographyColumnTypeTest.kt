package eu.franz1007.postgis

import eu.franz1007.exposed.gis.core.models.PointGeography
import eu.franz1007.exposed.gis.core.models.PointGeometry
import eu.franz1007.exposed.gis.postgis.ST_AsGeoJSON
import eu.franz1007.exposed.gis.postgis.ST_MakeLine
import eu.franz1007.exposed.gis.postgis.pointGeography
import eu.franz1007.exposed.gis.postgis.pointGeometry
import eu.franz1007.exposed.gis.postgis.toGeometry
import net.postgis.jdbc.geometry.Geometry
import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.StdOutSqlLogger
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.testcontainers.postgresql.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName
import kotlin.test.Test
import kotlin.test.assertEquals

class PointGeographyColumnTypeTest {
    @Test
    fun testCreateSchema() {
        val image = DockerImageName.parse("postgis/postgis:18-3.6").asCompatibleSubstituteFor("postgres")
        val postgres = PostgreSQLContainer(image)
        postgres.start()
        val db = Database.connect(url = postgres.jdbcUrl, user = postgres.username, password = postgres.password)
        transaction(db) {
            SchemaUtils.create(PositionsTable)
        }
        transaction(db) {
            SchemaUtils.drop(PositionsTable)
        }
    }

    object PositionsTable : Table() {
        val id = integer("id").autoIncrement()
        val location = pointGeography("location", srid = 4326)
        val geometryLocation = pointGeometry("geometryLocation", srid = 4326)
        override val primaryKey = PrimaryKey(id)
    }

    @Test
    fun `test insert and query`() {
        val image = DockerImageName.parse("postgis/postgis:18-3.6").asCompatibleSubstituteFor("postgres")
        val postgres = PostgreSQLContainer(image)
        postgres.start()
        val db = Database.connect(url = postgres.jdbcUrl, user = postgres.username, password = postgres.password)
        transaction {
            addLogger(StdOutSqlLogger)
            SchemaUtils.create(PositionsTable)
        }
        val positionGreenwich = PointGeography(51.477928, -0.001545, 5.0, 4326)
        val otherPosition = PointGeometry(-0.001545, 51.477928, 5.0, 4326)
        transaction(db) {
            addLogger(StdOutSqlLogger)
            println("inserting")
            PositionsTable.insert {
                it[PositionsTable.id] = 1
                it[PositionsTable.location] = positionGreenwich
                it[PositionsTable.geometryLocation] = otherPosition
            }
            PositionsTable.insert {
                it[PositionsTable.id] = 2
                it[PositionsTable.location] = positionGreenwich
                it[PositionsTable.geometryLocation] = otherPosition
            }
            println("inserted")
        }

        val positionsDb = transaction(db) {
            PositionsTable.selectAll().map { Pair(it[PositionsTable.location], it[PositionsTable.geometryLocation]) }
        }
        transaction {
            addLogger(StdOutSqlLogger)
            val result = PositionsTable.select(PositionsTable.location.toGeometry().ST_MakeLine().ST_AsGeoJSON()).map{
                it[PositionsTable.location.toGeometry().ST_MakeLine().ST_AsGeoJSON()]
            }
            println(result)
        }
        assertEquals(2, positionsDb.size)
        positionsDb.first().let { (geography, geometry) ->
            assertEquals(geography, positionGreenwich)
            assertEquals(geometry, otherPosition)
        }

        transaction(db) {
            SchemaUtils.drop(PositionsTable)
        }
    }
}
