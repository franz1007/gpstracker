package eu.franz1007.gpstracker.model

import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class GpsPoint(
    val id: Long,
    val timestamp: Instant,
    val lat: Double,
    val lon: Double,
    val hdop: Double,
    val altitude: Double,
    val speed: Double,
    val bearing: Double,
    val eta: Instant,
    val etfa: Instant,
    val eda: Int,
    val edfa: Int
)
