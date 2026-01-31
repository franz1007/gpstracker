package eu.franz1007.gpstracker.model

import kotlinx.serialization.Serializable
import kotlin.time.ExperimentalTime
import kotlin.time.Instant

@ExperimentalTime
@Serializable
data class GpsPointNoId(
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