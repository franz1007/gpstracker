package eu.franz1007.gpstracker.gpxtool

import kotlinx.datetime.Instant
import org.w3c.dom.Element
import org.w3c.dom.Node
import java.io.InputStream
import javax.xml.parsers.DocumentBuilderFactory

data class Metadata(val name: String, val time: Instant?)
data class Extensions(val osmandHeading: Double?, val osmandSpeed: Double?)
data class Trkpt(
    val lat: Double, val lon: Double, val ele: Double?, val hdop: Double?, val time: Instant?, val extensions: Extensions?
)

data class Trk(val trksegList: List<Trkseg>)
data class Trkseg(val trkptList: List<Trkpt>)
data class Gpx(val metadata: Metadata, val trks: List<Trk>)

class GpxParser {
    fun parseGpx(stream: InputStream): Gpx {
        val document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(stream)
        val root = document.documentElement

        val metadataNode = root.getElementsByTagName("metadata").let {
            val nodes = root.getElementsByTagName("metadata")
            assert(nodes.length == 1 && nodes.item(0).nodeType == Node.ELEMENT_NODE) { "No Or bad metadata element found" }
            nodes.item(0) as Element
        }
        val metadata = Metadata(
            metadataNode.getElementsByTagName("name").item(0).textContent,
            metadataNode.getElementsByTagName("time").item(0)?.textContent?.let {
                Instant.parse(it)
            })
        val trkNodeList = root.getElementsByTagName("trk")
        val trkList = mutableListOf<Trk>()
        for (i in 0..<trkNodeList.length) {
            val trkSegs = (trkNodeList.item(i) as Element).getElementsByTagName("trkseg").let { trkSegNodeList ->
                val segs = mutableListOf<Trkseg>()
                for (j in 0..<trkSegNodeList.length) {
                    val trkPts: List<Trkpt> =
                        (trkSegNodeList.item(j) as Element).getElementsByTagName("trkpt").let { trkptNodeList ->
                            val points = mutableListOf<Trkpt>()
                            for (k in 0..<trkptNodeList.length) {
                                val trkptNode = trkptNodeList.item(k) as Element
                                val lat = trkptNode.getAttribute("lat").toDouble()
                                val lon = trkptNode.getAttribute("lon").toDouble()
                                val ele = trkptNode.getElementsByTagName("ele").item(0)?.textContent?.toDouble()
                                val hdop = trkptNode.getElementsByTagName("hdop").item(0)?.textContent?.toDouble()
                                val time = trkptNode.getElementsByTagName("time").item(0)?.textContent?.let{
                                    Instant.parse(it)
                                }
                                val extensionNodeList = trkptNode.getElementsByTagName("extensions")
                                val extensions = if(extensionNodeList.length > 0){
                                    if(extensionNodeList.length > 1) throw IllegalStateException("Too many extension nodes")
                                    else (trkptNode.getElementsByTagName("extensions")
                                        .item(0) as Element).let { extensionsNode ->
                                        Extensions(
                                            extensionsNode.getElementsByTagName("osmand:heading")
                                                .item(0)?.textContent?.toDouble(),
                                            extensionsNode.getElementsByTagName("osmand:speed")
                                                .item(0)?.textContent?.toDouble()
                                        )
                                    }
                                }
                                else{
                                    null
                                }
                                points.add(Trkpt(lat, lon, ele, hdop, time, extensions))
                            }
                            points
                        }
                    segs.add(Trkseg(trkPts))
                }
                segs
            }
            trkList.add(Trk(trkSegs))
        }
        return Gpx(metadata, trkList)
    }
}