package eu.franz1007.exposed.postgis

import net.postgis.jdbc.geometry.Geometry
import net.postgis.jdbc.geometry.LineString
import net.postgis.jdbc.geometry.Point
import org.jetbrains.exposed.v1.core.DoubleColumnType
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.ExpressionWithColumnType
import org.jetbrains.exposed.v1.core.Function
import org.jetbrains.exposed.v1.core.IColumnType
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.TextColumnType
import org.jetbrains.exposed.v1.core.WindowFunction
import org.jetbrains.exposed.v1.core.WindowFunctionDefinition
import org.jetbrains.exposed.v1.core.append
import org.jetbrains.exposed.v1.core.vendors.currentDialect

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
        appendOrderByClause()
        append(')')
    }

    private fun QueryBuilder.appendOrderByClause() {
        if (orderByExpressions.isNotEmpty()) {
            +" ORDER BY "
            orderByExpressions.appendTo { (expression, sortOrder) ->
                currentDialect.dataTypeProvider.precessOrderByClause(this, expression, sortOrder)
            }
        }
    }

    private val orderByExpressions: List<Pair<Expression<*>, SortOrder>> = mutableListOf()

    fun orderBy(column: Expression<*>, order: SortOrder = SortOrder.ASC): ST_MakeLineFunction<T> =
        orderBy(column to order)

    fun orderBy(vararg order: Pair<Expression<*>, SortOrder>): ST_MakeLineFunction<T> = apply {
        (orderByExpressions as MutableList).addAll(order)
    }

}

class ToGeometryFunction<T : Geometry>(
    val expr: Expression<T>, columnType: IColumnType<T>
) : Function<T>(columnType), WindowFunction<T> {

    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append(expr)
        append("::geometry")
    }

    override fun over(): WindowFunctionDefinition<T> {
        return WindowFunctionDefinition(columnType, this)
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

/**
 * @param useSpheroid:
 * If false, then the calculation is based on a sphere instead of a spheroid. Spheroid is more accurate
 */
@Suppress("ClassName")
class ST_LengthFunction<T : Geometry>(
    val expr: Expression<T>, val useSpheroid: Boolean = true
) : Function<Double>(DoubleColumnType()) {
    override fun toQueryBuilder(queryBuilder: QueryBuilder): Unit = queryBuilder {
        append("ST_Length", '(')
        append(expr)
        append(", $useSpheroid")
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

@Suppress("FunctionName")
fun <T : Geometry> ExpressionWithColumnType<T>.ST_Length() = ST_LengthFunction(this)