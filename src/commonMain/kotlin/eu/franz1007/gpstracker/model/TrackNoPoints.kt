package eu.franz1007.gpstracker.model

import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class TrackNoPoints(
    val id: Long, val startTimestamp: Instant, val endTimestamp: Instant
)