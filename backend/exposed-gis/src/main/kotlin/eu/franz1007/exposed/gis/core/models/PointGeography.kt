package eu.franz1007.exposed.gis.core.models

import net.postgis.jdbc.geometry.LineString


interface Geo
open class Geography : Geo
open class Geometry : Geo

data class PointGeography(val x: Double, val y: Double, val z: Double, val srid: Int = 4326) : Geography()
data class PointGeometry(val x: Double, val y: Double, val z: Double, val srid: Int = 4326) : Geometry()

class LineStringGeometry(val points: List<PointGeometry>) : Geometry()