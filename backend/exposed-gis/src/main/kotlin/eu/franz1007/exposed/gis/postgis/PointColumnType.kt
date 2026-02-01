package eu.franz1007.exposed.gis.postgis

import net.postgis.jdbc.PGgeo
import net.postgis.jdbc.PGgeography
import net.postgis.jdbc.PGgeometry
import net.postgis.jdbc.geometry.Geometry
import net.postgis.jdbc.geometry.LineString
import net.postgis.jdbc.geometry.Point
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.core.Function


fun Table.pointGeometry(name: String, srid: Int = 4326) = registerColumn(name, PointGeometryColumnType(srid))
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
            value.geometry as Point
        }

        else -> {
            error("Unexpected value of type ${sqlType()}: $value of ${value::class.qualifiedName}")
        }
    }

    override fun notNullValueToDB(value: Point): Any {
        return PGgeometry(value)
    }
}

fun Table.pointGeography(name: String, srid: Int = 4326) = registerColumn(name, PointGeographyColumnType(srid))
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
            value.geometry as Point
        }

        else -> {
            error("Unexpected value of type ${sqlType()}: $value of ${value::class.qualifiedName}")
        }
    }

    override fun notNullValueToDB(value: Point): Any {
        return PGgeography(value)
    }
}

fun Table.lineStringGeometry(name: String, srid: Int = 4326) = registerColumn(name, LineStringGeometryColumnType(srid))
private class LineStringGeometryColumnType(val srid: Int = 4326) : ColumnType<LineString>() {
    override fun sqlType() = "GEOMETRY(LineStringZ, $srid)"
    override fun valueFromDB(value: Any): LineString = when (value) {
        is PGgeo -> {
            check(value.geometry.type == Geometry.LINESTRING) {
                "Unexpected value of type ${sqlType()}: PGeometry of wrong type. expected ${Geometry.LINESTRING}, name ${
                    Geometry.getTypeString(
                        Geometry.LINESTRING
                    )
                }, got ${value.geometry.type}, typename: ${value.geometry.typeString} $value of ${value::class.qualifiedName}"
            }
            value.geometry as LineString
        }

        else -> {
            error("Unexpected value of type ${sqlType()}: $value of ${value::class.qualifiedName}")
        }
    }

    override fun notNullValueToDB(value: LineString): Any {
        return PGgeometry(value)
    }
}

class ST_AsGeoJSONFunction<T : Geometry>(
    val expression: Expression<T>,
) : Function<String>(TextColumnType()) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append("ST_AsGeoJSON", '(')
        append(expression)
        append(')')
    }
}

class ST_MakeLineFunction<T : Point>(
    val expression: Expression<T>,
) : Function<LineString>(LineStringGeometryColumnType()) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append("ST_MakeLine", '(')
        append(expression)
        append(')')
    }
}

class ToGeometryFunction<T : Geometry>(
    /** Returns the expression from which the minimum value is obtained. */
    val expr: Expression<T>, columnType: IColumnType<T>
) : Function<T>(columnType) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append(expr)
        append("::geometry")
    }
}

class ToGeographyFunction<T : Geometry>(
    /** Returns the expression from which the minimum value is obtained. */
    val expr: Expression<T>, columnType: IColumnType<T>
) : Function<T>(columnType) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append(expr)
        append("::geography")
    }
}

class ST_Force2DFunction<T : Geometry>(
    /** Returns the expression from which the minimum value is obtained. */
    val expr: Expression<T>, columnType: IColumnType<T>
) : Function<T>(columnType) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append("ST_Force2D", '(')
        append(expr)
        append(')')
    }
}


fun <T : Geometry> Expression<T>.ST_AsGeoJSON() = ST_AsGeoJSONFunction(this)
fun ExpressionWithColumnType<Point>.ST_MakeLine() = ST_MakeLineFunction(this)
fun <T : Geometry> ExpressionWithColumnType<T>.toGeometry() = ToGeometryFunction(this, columnType)
fun <T : Geometry> ExpressionWithColumnType<T>.toGeography() = ToGeographyFunction(this, columnType)
fun <T : Geometry> ExpressionWithColumnType<T>.ST_Force2D() = ST_Force2DFunction(this, columnType = columnType)

//SELECT ST_ASGEOJSON(ST_MakeLine(location::geometry ORDER BY timestamp))
//        FROM gpspoints WHERE track_id = 202;