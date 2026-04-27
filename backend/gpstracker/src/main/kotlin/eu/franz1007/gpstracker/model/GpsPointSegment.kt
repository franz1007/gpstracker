package eu.franz1007.gpstracker.model

import kotlinx.serialization.Serializable
import kotlin.time.Duration

@Serializable
data class GpsPointSegment(val duration: Duration, val distance: Double)