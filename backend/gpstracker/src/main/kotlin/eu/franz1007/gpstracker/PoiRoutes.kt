@file:OptIn(ExperimentalUuidApi::class)

package eu.franz1007.gpstracker

import eu.franz1007.gpstracker.database.Campsite
import eu.franz1007.gpstracker.database.CampsiteVisit
import eu.franz1007.gpstracker.database.PoiService
import eu.franz1007.gpstracker.uitl.getUuidParam
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlin.uuid.ExperimentalUuidApi

fun Application.configureCampsiteRoutes(poiService: PoiService) {
    routing {
        route("/visits") {
            post {
                val visit = call.receive<CampsiteVisit>()
                val campsiteId = getUuidParam("campsite")
                val created = poiService.storeVisit(visit, campsiteId)
                if (created == null) {
                    call.respond(HttpStatusCode.BadRequest, "This campsite does not exist")
                } else {
                    call.respond(HttpStatusCode.Created, created)
                }
            }
            post("/{uuid}") {
                val visit = call.receive<CampsiteVisit>()
                val uuid = getUuidParam("uuid")
                val updated = poiService.updateVisit(visit, uuid)
                if (updated == null) {
                    call.respond(HttpStatusCode.NotFound, "This visit does not exist")
                } else {
                    call.respond(HttpStatusCode.OK, updated)
                }
            }
            get("/{uuid}") {
                val uuid = getUuidParam("uuid")
                val visit = poiService.getVisit(uuid)
                if (visit == null) {
                    call.respond(HttpStatusCode.NotFound, "This visit does not exist")
                } else {
                    call.respond(HttpStatusCode.OK, visit)
                }
            }
        }

        route("/campsites") {
            get {
                call.respond(HttpStatusCode.OK, poiService.getAllCampsites())
            }
            post {
                val campsite = call.receive<Campsite>()
                val created = poiService.storeCampsite(campsite)
                call.respond(HttpStatusCode.Created, created)
            }
            post("/{uuid}") {
                val campsite = call.receive<Campsite>()
                val uuid = getUuidParam("uuid")
                val updated = poiService.updateCampsite(campsite, uuid)
            }
            get("/{uuid}") {
                val uuid = getUuidParam("uuid")
                val campsite = poiService.getCampsite(uuid)
                if (campsite == null) {
                    call.respond(HttpStatusCode.BadRequest, "This campsite does not exist")
                } else {
                    call.respond(HttpStatusCode.OK, campsite)
                }
            }
            get("/{uuid}/visits") {
                val uuid = getUuidParam("uuid")
                val visits = poiService.getVisitsForCampsite(uuid)
                if (visits == null) {
                    call.respond(HttpStatusCode.BadRequest, "This campsite does not exist")
                } else {
                    call.respond(HttpStatusCode.OK, visits)
                }
            }
        }
    }
}