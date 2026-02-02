@file:OptIn(ExperimentalTime::class)

package eu.franz1007.gpstracker.model

import eu.franz1007.gpstracker.gpxtool.Gpx
import kotlinx.serialization.Serializable
import kotlin.time.ExperimentalTime
import kotlin.time.Instant
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

enum class TRACK_CATEGORY {
    UNCATEGORIZED, CYCLING, RUNNING, HIKING
}

@Serializable
@OptIn(ExperimentalUuidApi::class)
data class TrackOnlyMetadata(
    val uuid: Uuid,
    val startTimestamp: Instant,
    val endTimestamp: Instant,
    val distanceMeters: Int,
    val averageSpeedKph: Double,
    val category: TRACK_CATEGORY
)

@Serializable
@OptIn(ExperimentalUuidApi::class)
data class TrackNoPoints(
    val uuid: Uuid, val startTimestamp: Instant, val endTimestamp: Instant, val category: TRACK_CATEGORY
)

data class TrackNoId(
    val startTimestamp: Instant, val endTimestamp: Instant, val points: List<GpsPointNoId>, val category: TRACK_CATEGORY
) {
    companion object {
        fun fromGpxTrack(gpx: Gpx): TrackNoId {
            val points = gpx.trks.flatMap { it.trksegList }.flatMap { it.trkptList }.sortedBy { it.time }.map {
                GpsPointNoId(
                    timestamp = it.time ?: Instant.fromEpochMilliseconds(0),
                    lat = it.lat,
                    lon = it.lon,
                    hdop = it.hdop ?: -1.0,
                    altitude = it.ele ?: -1.0,
                    speed = it.extensions?.osmandSpeed ?: -1.0,
                    bearing = it.extensions?.osmandHeading ?: -1.0,
                    eta = Instant.fromEpochMilliseconds(0),
                    etfa = Instant.fromEpochMilliseconds(0),
                    eda = -1,
                    edfa = -1
                )
            }
            return TrackNoId(points.first().timestamp, points.last().timestamp, points, TRACK_CATEGORY.UNCATEGORIZED)
        }
    }
}