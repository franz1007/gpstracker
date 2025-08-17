@file:OptIn(ExperimentalTime::class)

package eu.franz1007.gpstracker.model

import eu.franz1007.gpstracker.gpxtool.*
import org.junit.Test
import java.io.File
import kotlin.test.assertEquals
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

class TestTrackNoId {
    @Test
    fun testGpxToTrack() {
        val trkPt = Trkpt(0.0, 0.0, 0.0, 0.0, Clock.System.now(), Extensions(0.0, 0.0))
        val gpx = Gpx(
            metadata = Metadata("test", null), trks = listOf(
                Trk(
                    listOf(
                        Trkseg(listOf(trkPt)), Trkseg(listOf(trkPt))
                    )
                ), Trk(
                    listOf(
                        Trkseg(listOf(trkPt)), Trkseg(listOf(trkPt))
                    )
                )
            )
        )
        val track = TrackNoId.fromGpxTrack(gpx)
        assertEquals(4, track.points.size)
    }

    @Test
    fun parseGpx() {
        val gpx = GpxParser().parseGpx(File("September2024/2024-09-15_10-51_Sun.gpx").inputStream())
        val track = TrackNoId.fromGpxTrack(gpx)
        assertEquals(896, track.points.size, "GpxParser should parse all points and fromGpxTrack should map all")
    }
}