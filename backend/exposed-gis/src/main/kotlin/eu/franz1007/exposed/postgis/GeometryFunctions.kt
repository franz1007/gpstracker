package eu.franz1007.exposed.postgis

import net.postgis.jdbc.geometry.Geometry
import net.postgis.jdbc.geometry.LineString
import net.postgis.jdbc.geometry.Point
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.ExpressionWithColumnType
import org.jetbrains.exposed.v1.core.Function
import org.jetbrains.exposed.v1.core.IColumnType
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.TextColumnType
import org.jetbrains.exposed.v1.core.append

@Suppress("ClassName")
class ST_AsGeoJSONFunction<T : Geometry>(
    val expression: Expression<T>,
) : Function<String>(TextColumnType()) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append("ST_AsGeoJSON", '(')
        append(expression)
        append(')')
    }
}

// TODO ST_MakeLine exists for Geometry, not Geography. Somehow use types to prohibit Geography
@Suppress("ClassName")
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
    val expr: Expression<T>, columnType: IColumnType<T>
) : Function<T>(columnType) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append(expr)
        append("::geometry")
    }
}

class ToGeographyFunction<T : Geometry>(
    val expr: Expression<T>, columnType: IColumnType<T>
) : Function<T>(columnType) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append(expr)
        append("::geography")
    }
}

// TODO ST_Force2D exists for Geometry, not Geography. Somehow use types to prohibit Geography
@Suppress("ClassName")
class ST_Force2DFunction<T : Geometry>(
    val expr: Expression<T>, columnType: IColumnType<T>
) : Function<T>(columnType) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append("ST_Force2D", '(')
        append(expr)
        append(')')
    }
}


@Suppress("FunctionName")
fun <T : Geometry> Expression<T>.ST_AsGeoJSON() = ST_AsGeoJSONFunction(this)

@Suppress("FunctionName")
fun ExpressionWithColumnType<Point>.ST_MakeLine() = ST_MakeLineFunction(this)
fun <T : Geometry> ExpressionWithColumnType<T>.toGeometry() = ToGeometryFunction(this, columnType)
fun <T : Geometry> ExpressionWithColumnType<T>.toGeography() = ToGeographyFunction(this, columnType)

@Suppress("FunctionName")
fun <T : Geometry> ExpressionWithColumnType<T>.ST_Force2D() = ST_Force2DFunction(this, columnType)