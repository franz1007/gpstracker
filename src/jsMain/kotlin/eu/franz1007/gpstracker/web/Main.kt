package eu.franz1007.gpstracker.web

import kotlinx.browser.document
import kotlinx.browser.window
import kotlinx.html.a
import kotlinx.html.div
import kotlinx.html.dom.append
import kotlinx.html.dom.create
import kotlinx.html.p
import org.w3c.dom.WebSocket
import org.w3c.xhr.XMLHttpRequest

fun main() {
    val body = document.body ?: error("No body")
    body.append {
        div {
            p {
                +"Here is "
                a("https://kotlinlang.org") { +"official Kotlin site" }
            }
        }
    }
    val timeP = document.create.p {
        +"Time: 0"
    }
    val pointsP = document.create.p{
        +"test"
    }

    body.append(timeP, pointsP)

    val req = XMLHttpRequest()
    req.onload =  {
        println(it)
        pointsP.textContent = req.responseText
        console.log(req)
    }
    req.open("GET", "http://localhost:8090/api/points")
    req.send()

    val ws = WebSocket("ws://localhost:8090/api/ws")
    ws.onmessage = {
        println(it.data)
        pointsP.textContent += it.data.toString()
        when (val data = it.data){
            is String -> pointsP.textContent+=data
            else -> println("Could not find type")
        }
    }
    var time = 0
    window.setInterval({
        time++
        timeP.textContent = "Test: $time"

        return@setInterval null
    }, 1000)

}