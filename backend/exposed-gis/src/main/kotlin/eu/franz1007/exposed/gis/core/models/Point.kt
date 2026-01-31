package eu.franz1007.exposed.gis.core.models

data class Point(val x: Double, val y: Double, val z: Double, val srid: Int = 4326)