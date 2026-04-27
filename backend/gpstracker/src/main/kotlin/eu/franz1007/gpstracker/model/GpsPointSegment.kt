@file:OptIn(ExperimentalTime::class)

package eu.franz1007.gpstracker.model

import kotlinx.serialization.Serializable
import kotlin.time.Duration
import kotlin.time.ExperimentalTime
import kotlin.time.Instant

@Serializable
data class GpsPointSegment(val duration: Duration, val distance: Double)
@Serializable
data class PointMetadata(val timestamp: Instant, val distance: Double, val speed: Double)