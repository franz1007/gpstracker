package eu.franz1007.exposed.gis.postgis

import eu.franz1007.exposed.gis.core.models.Geo
import eu.franz1007.exposed.gis.core.models.Geography
import eu.franz1007.exposed.gis.core.models.LineStringGeometry
import eu.franz1007.exposed.gis.core.models.PointGeography
import eu.franz1007.exposed.gis.core.models.PointGeometry
import net.postgis.jdbc.PGgeo
import net.postgis.jdbc.PGgeography
import net.postgis.jdbc.PGgeometry
import net.postgis.jdbc.geometry.Geometry
import net.postgis.jdbc.geometry.LineString
import net.postgis.jdbc.geometry.Point
import org.jetbrains.exposed.v1.core.ColumnType
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.ExpressionWithColumnType
import org.jetbrains.exposed.v1.core.Function
import org.jetbrains.exposed.v1.core.IColumnType
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.TextColumnType
import org.jetbrains.exposed.v1.core.append


fun Table.pointGeometry(name: String, srid: Int = 4326) = registerColumn(name, PointGeometryColumnType(srid))
private class PointGeometryColumnType(val srid: Int = 4326) : ColumnType<PointGeometry>() {
    override fun sqlType() = "GEOMETRY(PointZ, $srid)"
    override fun valueFromDB(value: Any): PointGeometry = when (value) {
        is PGgeo -> {
            check(value.geometry.type == Geometry.POINT) {
                "Unexpected value of type ${sqlType()}: PGeometry of wrong type. expected ${Geometry.POINT}, name ${
                    Geometry.getTypeString(
                        Geometry.POINT
                    )
                }, got ${value.geometry.type}, typename: ${value.geometry.typeString} $value of ${value::class.qualifiedName}"
            }
            (value.geometry as net.postgis.jdbc.geometry.Point).firstPoint.let {
                PointGeometry(
                    it.x, it.y, it.z, srid
                )
            }
        }

        else -> {
            error("Unexpected value of type ${sqlType()}: $value of ${value::class.qualifiedName}")
        }
    }

    override fun notNullValueToDB(value: PointGeometry): Any {
        return PGgeometry(Point(value.x, value.y, value.z))
    }
}

fun Table.pointGeography(name: String, srid: Int = 4326) = registerColumn(name, PointGeographyColumnType(srid))
private class PointGeographyColumnType(val srid: Int = 4326) : ColumnType<PointGeography>() {
    override fun sqlType() = "GEOGRAPHY(PointZ, $srid)"
    override fun valueFromDB(value: Any): PointGeography = when (value) {
        is PGgeo -> {
            check(value.geometry.type == Geometry.POINT) {
                "Unexpected value of type ${sqlType()}: PGeometry of wrong type. expected ${Geometry.POINT}, name ${
                    Geometry.getTypeString(
                        Geometry.POINT
                    )
                }, got ${value.geometry.type}, typename: ${value.geometry.typeString} $value of ${value::class.qualifiedName}"
            }
            (value.geometry as net.postgis.jdbc.geometry.Point).firstPoint.let {
                PointGeography(
                    it.x, it.y, it.z, srid
                )
            }
        }

        else -> {
            error("Unexpected value of type ${sqlType()}: $value of ${value::class.qualifiedName}")
        }
    }

    override fun notNullValueToDB(value: PointGeography): Any {
        return PGgeography(net.postgis.jdbc.geometry.Point(value.x, value.y, value.z))
    }
}

fun Table.lineStringGeometry(name: String, srid: Int = 4326) = registerColumn(name, LineStringGeometryColumnType(srid))
private class LineStringGeometryColumnType(val srid: Int = 4326) : ColumnType<LineStringGeometry>() {
    override fun sqlType() = "GEOMETRY(LineStringZ, $srid)"
    override fun valueFromDB(value: Any): LineStringGeometry = when (value) {
        is PGgeo -> {
            check(value.geometry.type == Geometry.LINESTRING) {
                "Unexpected value of type ${sqlType()}: PGeometry of wrong type. expected ${Geometry.LINESTRING}, name ${
                    Geometry.getTypeString(
                        Geometry.LINESTRING
                    )
                }, got ${value.geometry.type}, typename: ${value.geometry.typeString} $value of ${value::class.qualifiedName}"
            }
            LineStringGeometry((value.geometry as LineString).points.map {
                PointGeometry(it.x, it.y, it.z, srid)
            })
        }

        else -> {
            error("Unexpected value of type ${sqlType()}: $value of ${value::class.qualifiedName}")
        }
    }

    override fun notNullValueToDB(value: LineStringGeometry): Any {
        return PGgeometry(LineString(value.points.map{ Point(it.x, it.y, it.z)}.toTypedArray()))
    }
}

class ToGeometryFunction<T : Geography, S : eu.franz1007.exposed.gis.core.models.Geometry>(
    val expression: Expression<T>, columnType: IColumnType<S>
) : Function<S>(columnType) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append(expression)
        append("::geometry")
    }
}

class ST_AsGeoJSONFunction<T : Geo>(
    val expression: Expression<T>,
) : Function<String>(TextColumnType()) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append("ST_AsGeoJSON", '(')
        append(expression)
        append(')')
    }
}

class ST_MakeLineFunction<T : eu.franz1007.exposed.gis.core.models.Geometry>(
    val expression: Expression<T>,
) : Function<LineStringGeometry>(LineStringGeometryColumnType()) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append("ST_MakeLine", '(')
        append(expression)
        append(')')
    }
}

fun <T : Geo> Expression<T>.ST_AsGeoJSON() = ST_AsGeoJSONFunction(this)
fun <T : eu.franz1007.exposed.gis.core.models.Geometry> ExpressionWithColumnType<T>.ST_MakeLine() =
    ST_MakeLineFunction(this)

fun ExpressionWithColumnType<PointGeography>.toGeometry() =
    ToGeometryFunction(this, this.columnType as ColumnType<PointGeometry>)

//SELECT ST_ASGEOJSON(ST_MakeLine(location::geometry ORDER BY timestamp))
//        FROM gpspoints WHERE track_id = 202;