package eu.franz1007.postgis

import eu.franz1007.exposed.gis.postgis.ST_AsGeoJSON
import eu.franz1007.exposed.gis.postgis.ST_Force2D
import eu.franz1007.exposed.gis.postgis.pointGeography
import eu.franz1007.exposed.gis.postgis.pointGeometry
import eu.franz1007.exposed.gis.postgis.toGeography
import eu.franz1007.exposed.gis.postgis.toGeometry
import net.postgis.jdbc.geometry.Point
import org.jetbrains.exposed.v1.core.StdOutSqlLogger
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.exceptions.ExposedSQLException
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.postgresql.util.PSQLException
import org.testcontainers.postgresql.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertFails
import kotlin.test.assertFailsWith

class GeometryFunctionsTest {
    private object PositionsTable : Table() {
        val id = integer("id").autoIncrement()
        val location = pointGeography("location", srid = 4326)
        override val primaryKey = PrimaryKey(id)
    }

    private object PositionsTableGeometry : Table() {
        val id = integer("id").autoIncrement()
        val location = pointGeometry("location", srid = 4326)
        override val primaryKey = PrimaryKey(id)
    }

    @Test
    fun `test ST_AsGeoJSON`() {
        val image = DockerImageName.parse("postgis/postgis:18-3.6").asCompatibleSubstituteFor("postgres")
        val postgres = PostgreSQLContainer(image)
        postgres.start()
        val db = Database.connect(url = postgres.jdbcUrl, user = postgres.username, password = postgres.password)
        transaction(db) {
            addLogger(StdOutSqlLogger)
            SchemaUtils.create(PositionsTable)
        }
        val positions = listOf(
            Point(51.477928, -0.001545, 5.0), Point(-0.001545, 51.477928, 5.0)
        )
        transaction(db) {
            addLogger(StdOutSqlLogger)
            positions.forEach { position ->
                PositionsTable.insert {
                    it[PositionsTable.location] = position
                }
            }
        }
        val result = transaction(db) {
            addLogger(StdOutSqlLogger)
            PositionsTable.select(
                PositionsTable.location.ST_AsGeoJSON()
            ).map {
                it[PositionsTable.location.ST_AsGeoJSON()]
            }
        }
        assertContentEquals(
            listOf(
                "{\"type\":\"Point\",\"coordinates\":[51.477928,-0.001545,5]}",
                "{\"type\":\"Point\",\"coordinates\":[-0.001545,51.477928,5]}"
            ), result
        )
    }

    @Test
    fun `test ST_Force2D`() {
        val image = DockerImageName.parse("postgis/postgis:18-3.6").asCompatibleSubstituteFor("postgres")
        val postgres = PostgreSQLContainer(image)
        postgres.start()
        val db = Database.connect(url = postgres.jdbcUrl, user = postgres.username, password = postgres.password)
        transaction(db) {
            addLogger(StdOutSqlLogger)
            SchemaUtils.create(PositionsTableGeometry)
        }
        val positions = listOf(
            Point(51.477928, -0.001545, 5.0), Point(-0.001545, 51.477928, 5.0)
        )
        transaction(db) {
            addLogger(StdOutSqlLogger)
            positions.forEach { position ->
                PositionsTableGeometry.insert {
                    it[PositionsTableGeometry.location] = position
                }
            }
        }
        val result = transaction(db) {
            addLogger(StdOutSqlLogger)
            PositionsTableGeometry.select(
                PositionsTableGeometry.location.ST_Force2D()
            ).map {
                it[PositionsTableGeometry.location.ST_Force2D()]
            }
        }
        assertContentEquals(positions.map { it.asTwoDimensionPoint() }, result.map { it.withoutSRID() })
    }

    @Test
    fun `test toGeometry`() {
        //ST_Force2D fails for Geometry so this is used for testing
        val image = DockerImageName.parse("postgis/postgis:18-3.6").asCompatibleSubstituteFor("postgres")
        val postgres = PostgreSQLContainer(image)
        postgres.start()
        val db = Database.connect(url = postgres.jdbcUrl, user = postgres.username, password = postgres.password)
        transaction(db) {
            addLogger(StdOutSqlLogger)
            SchemaUtils.create(PositionsTable)
        }
        val positions = listOf(
            Point(51.477928, -0.001545, 5.0), Point(-0.001545, 51.477928, 5.0)
        )
        transaction(db) {
            addLogger(StdOutSqlLogger)
            positions.forEach { position ->
                PositionsTable.insert {
                    it[PositionsTable.location] = position
                }
            }
        }
        assertFailsWith(ExposedSQLException::class) {
            transaction(db) {
                PositionsTable.select(
                    PositionsTable.location.ST_Force2D()
                ).map {
                    it[PositionsTable.location.ST_Force2D()]
                }
            }
        }
        transaction(db) {
            PositionsTable.select(
                PositionsTable.location.toGeometry().ST_Force2D()
            ).map {
                it[PositionsTable.location.toGeometry().ST_Force2D()]
            }
        }
    }

    @Test
    fun `test toGeograpyh`() {
        //ST_Force2D fails for Geometry so this is used for testing
        val image = DockerImageName.parse("postgis/postgis:18-3.6").asCompatibleSubstituteFor("postgres")
        val postgres = PostgreSQLContainer(image)
        postgres.start()
        val db = Database.connect(url = postgres.jdbcUrl, user = postgres.username, password = postgres.password)
        transaction(db) {
            addLogger(StdOutSqlLogger)
            SchemaUtils.create(PositionsTableGeometry)
        }
        val positions = listOf(
            Point(51.477928, -0.001545, 5.0), Point(-0.001545, 51.477928, 5.0)
        )
        transaction(db) {
            addLogger(StdOutSqlLogger)
            positions.forEach { position ->
                PositionsTableGeometry.insert {
                    it[PositionsTableGeometry.location] = position
                }
            }
        }
        //This should not fail:
        val result = transaction(db) {
            PositionsTableGeometry.select(
                PositionsTableGeometry.location.ST_Force2D()
            ).map {
                it[PositionsTableGeometry.location.ST_Force2D()]
            }
        }
        assertContentEquals(positions.map { it.asTwoDimensionPoint() }, result.map { it.withoutSRID() })
        assertFailsWith(ExposedSQLException::class) {
            transaction(db) {
                PositionsTableGeometry.select(
                    PositionsTableGeometry.location.toGeography().ST_Force2D()
                ).map {
                    it[PositionsTableGeometry.location.toGeography().ST_Force2D()]
                }
            }
        }

    }
}