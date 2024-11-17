package eu.franz1007.gpstracker.web

import io.kvision.MapsModule
import io.kvision.maps.DefaultTileLayers
import io.kvision.maps.LeafletObjectFactory
import io.kvision.maps.externals.leaflet.geo.LatLng
import kotlinx.browser.document
import kotlinx.html.div
import kotlinx.html.dom.append
import kotlinx.html.dom.create
import kotlinx.html.id
import kotlinx.html.style

fun main() {
    MapsModule.initialize()
    val body = document.body ?: error("No body")
    body.append {
        div {
            id = "testDiv"
        }
    }
    val mapDiv = document.create.div {
        style = "height: 500px; width: 1000px;"
        id="mapDiv"
    }
    body.append(mapDiv)
    val map = LeafletObjectFactory.map(mapDiv)
    DefaultTileLayers.OpenStreetMap.addTo(map)
    map.setView(LatLng(51.505, -0.09), 13)
}