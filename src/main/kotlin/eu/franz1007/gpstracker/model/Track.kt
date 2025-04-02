package eu.franz1007.gpstracker.model

import eu.franz1007.gpstracker.gpxtool.Gpx
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

data class Track(val id: Long, val startTimestamp: Instant, val endTimesamp: Instant, val points: List<GpsPoint>)

@Serializable
data class TrackNoPoints(
    val id: Long, val startTimestamp: Instant, val endTimestamp: Instant
)

data class TrackNoId(val startTimestamp: Instant, val endTimestamp: Instant, val points: List<GpsPointNoId>) {
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
            return TrackNoId(points.first().timestamp, points.last().timestamp, points)
        }
    }
}