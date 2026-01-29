package eu.franz1007.exposed.gis.postgis

import eu.franz1007.exposed.gis.core.models.Point
import net.postgis.jdbc.PGgeo
import net.postgis.jdbc.PGgeography
import net.postgis.jdbc.PGgeometry
import net.postgis.jdbc.geometry.Geometry
import org.jetbrains.exposed.v1.core.ColumnType
import org.jetbrains.exposed.v1.core.Table


fun Table.pointGeometry(name: String, srid: Int = 4326) = registerColumn(name, PointGeometryColumnType(srid))
fun Table.pointGeography(name: String, srid: Int = 4326) = registerColumn(name, PointGeographyColumnType(srid))
private class PointGeometryColumnType(val srid: Int = 4326) : ColumnType<Point>() {
    override fun sqlType() = "GEOMETRY(PointZ, $srid)"
    override fun valueFromDB(value: Any): Point = when (value) {
        is PGgeo -> {
            check(value.geometry.type == Geometry.POINT) {
                "Unexpected value of type ${sqlType()}: PGeometry of wrong type. expected ${Geometry.POINT}, name ${
                    Geometry.getTypeString(
                        Geometry.POINT
                    )
                }, got ${value.geometry.type}, typename: ${value.geometry.typeString} $value of ${value::class.qualifiedName}"
            }
            (value.geometry as net.postgis.jdbc.geometry.Point).firstPoint.let {
                Point(
                    it.x, it.y, it.z, srid
                )
            }
        }

        else -> {
            error("Unexpected value of type ${sqlType()}: $value of ${value::class.qualifiedName}")
        }
    }

    override fun notNullValueToDB(value: Point): Any {
        return PGgeometry(net.postgis.jdbc.geometry.Point(value.x, value.y, value.z))
    }
}

private class PointGeographyColumnType(val srid: Int = 4326) : ColumnType<Point>() {
    override fun sqlType() = "GEOGRAPHY(PointZ, $srid)"
    override fun valueFromDB(value: Any): Point = when (value) {
        is PGgeo -> {
            check(value.geometry.type == Geometry.POINT) {
                "Unexpected value of type ${sqlType()}: PGeometry of wrong type. expected ${Geometry.POINT}, name ${
                    Geometry.getTypeString(
                        Geometry.POINT
                    )
                }, got ${value.geometry.type}, typename: ${value.geometry.typeString} $value of ${value::class.qualifiedName}"
            }
            (value.geometry as net.postgis.jdbc.geometry.Point).firstPoint.let {
                Point(
                    it.x, it.y, it.z, srid
                )
            }
        }

        else -> {
            error("Unexpected value of type ${sqlType()}: $value of ${value::class.qualifiedName}")
        }
    }

    override fun notNullValueToDB(value: Point): Any {
        return PGgeography(net.postgis.jdbc.geometry.Point(value.x, value.y, value.z))
    }
}
