package eu.franz1007.gpstracker.plugins

import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*

fun Application.configureCors(){
    install(CORS){
        anyHost()
    }
}