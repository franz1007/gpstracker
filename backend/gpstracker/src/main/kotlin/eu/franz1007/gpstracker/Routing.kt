package eu.franz1007.gpstracker

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.logError
import io.ktor.server.plugins.autohead.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.sse.*

fun Application.configureRouting() {
    install(AutoHeadResponse)
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respondText(text = "500: $cause" , status = HttpStatusCode.InternalServerError)
            logError(call, cause)
        }
    }
    install(SSE)
}