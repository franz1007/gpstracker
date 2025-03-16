package eu.franz1007.gpstracker.web

import eu.franz1007.gpstracker.model.GpsPoint
import io.kvision.MapsModule
import io.kvision.maps.DefaultTileLayers
import io.kvision.maps.LeafletObjectFactory
import io.kvision.maps.externals.leaflet.geo.LatLng
import kotlinx.browser.document
import kotlinx.html.div
import kotlinx.html.dom.create
import kotlinx.html.id
import kotlinx.html.style
import kotlinx.serialization.json.Json
import org.w3c.dom.WebSocket
import org.w3c.xhr.XMLHttpRequest

fun main() {
    MapsModule.initialize()
    val body = document.body ?: error("No body")
    val mapDiv = document.create.div {
        style = "height: 100%; position: absolute; margin: 0; inset: 0;"
        div {
            style = "height: 100%; width: 1000px;"
            id = "mapDiv"
        }

    }
    body.append(mapDiv)
    val map = LeafletObjectFactory.map(mapDiv)
    DefaultTileLayers.OpenStreetMap.addTo(map)
    val posSalzburg = LatLng(47.7994100, 13.0439900)
    map.setView(posSalzburg, 13)
    val line = LeafletObjectFactory.polyline(listOf())
    line.addTo(map)
    val req = XMLHttpRequest()
    req.onload = {
        println(it)
        console.log(req)
    }
    req.open("GET", "http://localhost:8090/api/points")
    req.send()
    val ws = WebSocket("ws://localhost:8090/api/ws")
    ws.onmessage = {
        println(it.data)
        when (val data = it.data) {
            is String -> {
                val test: GpsPoint = Json.decodeFromString(data)
                line.addLatLng(LatLng(test.lat, test.lon))
            }

            else -> {
                println("WebSocket message that was not a String")
            }
        }
    }
}