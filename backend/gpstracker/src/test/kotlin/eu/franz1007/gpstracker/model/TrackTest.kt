package eu.franz1007.gpstracker.model

import kotlinx.serialization.json.Json
import kotlin.random.Random
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.time.Clock
import kotlin.time.ExperimentalTime
import kotlin.time.Instant
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid


class TrackTest {

    @OptIn(ExperimentalUuidApi::class, ExperimentalTime::class)
    @Test
    fun calculateMetadataMustNotReturnInfinityOrFrontendWillFail() {
        val track = Track(
            uuid = Uuid.random(),
            startTimestamp = Instant.fromEpochMilliseconds(0),
            endTimestamp = Instant.fromEpochMilliseconds(0),
            points = generateGpsPoints(5),//.map { it.copy(timestamp = Instant.fromEpochMilliseconds(0)) },
            category = TRACK_CATEGORY.CYCLING
        )
        val metadata = track.calculateMetadata()
        assertEquals(0.0, metadata.averageSpeedKph)
        assertFalse(Json.encodeToString(metadata.onlyMetadata()).contains("Infinity", true))
    }


    @OptIn(ExperimentalTime::class)
    fun generateGpsPoints(amount: Int): List<GpsPoint> {
        val pointMunich = GpsPoint(
            id = 0,
            timestamp = Clock.System.now(),
            lat = 48.1374300,
            lon = 11.5754900,
            altitude = 524.0,
            hdop = 1.0,
            speed = 0.0,
            bearing = 0.0,
            eta = Instant.fromEpochMilliseconds(0),
            etfa = Instant.fromEpochMilliseconds(0),
            eda = 0,
            edfa = 0
        )
        return buildList {
            repeat(amount) { repetition ->
                add(
                    pointMunich.copy(
                        timestamp = Clock.System.now(),
                        id = repetition.toLong(),
                        lat = pointMunich.lat + Random.nextDouble(-1.0, 1.0),
                        lon = pointMunich.lon + Random.nextDouble(-1.0, 1.0)
                    )
                )
            }
        }
    }

}