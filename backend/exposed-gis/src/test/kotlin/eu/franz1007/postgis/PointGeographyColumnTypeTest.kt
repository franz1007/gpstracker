package eu.franz1007.postgis

import eu.franz1007.exposed.gis.postgis.*
import net.postgis.jdbc.geometry.Point
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.StdOutSqlLogger
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.function
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
        val positionGreenwich = Point(51.477928, -0.001545, 5.0)
        val otherPosition = Point(-0.001545, 51.477928, 5.0)
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
            val test = PositionsTable.select(PositionsTable.location.toGeometry().ST_MakeLine().ST_Force2D().ST_AsGeoJSON()).first().let {
                it[PositionsTable.location.toGeometry().ST_MakeLine().ST_Force2D().ST_AsGeoJSON()]
            }

            val result = PositionsTable.select(PositionsTable.location.toGeometry().ST_MakeLine().ST_AsGeoJSON()).map {
                it[PositionsTable.location.toGeometry().ST_MakeLine().ST_AsGeoJSON()]
            }
            println(result)
            println(test)
        }
        assertEquals(2, positionsDb.size)
        positionsDb.first().let { (geography, geometry) ->
            assertEquals(positionGreenwich, geography.withoutSRID())
            assertEquals(otherPosition, geometry.withoutSRID())
        }

        transaction(db) {
            SchemaUtils.drop(PositionsTable)
        }
    }

}

fun Point.withoutSRID(): Point = when (dimension) {
    2 -> Point(x, y)
    3 -> Point(x, y, z)
    else -> throw IllegalArgumentException("only 2 and 3 dimensions implemented")
}

