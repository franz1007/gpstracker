@file:OptIn(ExperimentalTime::class)

package eu.franz1007.gpstracker.model

import eu.franz1007.gpstracker.gpxtool.Gpx
import eu.franz1007.gpstracker.util.SloppyMath
import io.github.dellisd.spatialk.geojson.Feature
import io.github.dellisd.spatialk.geojson.dsl.feature
import io.github.dellisd.spatialk.geojson.dsl.lineString
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
data class Track(
    val uuid: Uuid,
    val startTimestamp: Instant,
    val endTimestamp: Instant,
    val points: List<GpsPoint>,
    val category: TRACK_CATEGORY
) {
    fun calculateMetadata(): TrackWIthMetadata {
        val (distanceMeters, _) = points.fold(Pair<Double, GpsPoint?>(0.0, null)) { acc, next ->
            val last = acc.second
            if (last != null) {
                val distance = SloppyMath.haversinMeters(last.lat, last.lon, next.lat, next.lon)
                acc.copy(first = acc.first + distance, second = next)
            } else {
                acc.copy(second = next)
            }
        }
        val averageSpeedKph = (distanceMeters / endTimestamp.minus(startTimestamp).inWholeSeconds) * 3.6
        return TrackWIthMetadata(
            uuid, startTimestamp, endTimestamp, points, distanceMeters.toInt(), averageSpeedKph, category
        )
    }
}

@Serializable
@OptIn(ExperimentalUuidApi::class)
data class TrackWIthMetadata(
    val uuid: Uuid,
    val startTimestamp: Instant,
    val endTimestamp: Instant,
    val points: List<GpsPoint>,
    val distanceMeters: Int,
    val averageSpeedKph: Double,
    val category: TRACK_CATEGORY
) {
    fun onlyMetadata(): TrackOnlyMetadata {
        return TrackOnlyMetadata(uuid, startTimestamp, endTimestamp, distanceMeters, averageSpeedKph, category)
    }

    fun toGeoJson(): Feature = feature(geometry = lineString {
        points.forEach {
            point(it.lon, it.lat, it.altitude)
        }
    }, id = "track$uuid") {
        put("startTimestamp", startTimestamp.toString())
        put("endTimestamp", endTimestamp.toString())
        put("distanceMeters", distanceMeters.toString())
        put("category", category.toString())
        put("averageSpeedKph", averageSpeedKph.toString())
    }
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
                    timestamp = it.time?:Instant.fromEpochMilliseconds(0),
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