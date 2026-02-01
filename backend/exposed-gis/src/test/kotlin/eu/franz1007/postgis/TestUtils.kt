package eu.franz1007.postgis

import net.postgis.jdbc.geometry.Point

fun Point.withoutSRID(): Point = when (dimension) {
    2 -> Point(x, y)
    3 -> Point(x, y, z)
    else -> throw IllegalArgumentException("only 2 and 3 dimensions implemented")
}

fun Point.asTwoDimensionPoint(): Point = Point(x, y)