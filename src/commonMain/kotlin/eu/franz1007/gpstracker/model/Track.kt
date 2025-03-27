package eu.franz1007.gpstracker.model

import kotlinx.datetime.Instant

data class Track(val id: Long, val startTimestamp: Instant, val endTimesamp: Instant, val points: List<GpsPoint>)