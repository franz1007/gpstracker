package eu.franz1007.gpstracker.uitl

import io.ktor.server.plugins.ParameterConversionException
import io.ktor.server.routing.RoutingContext
import io.ktor.server.util.getOrFail
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

/**
 * Works like original Parameters.getOrFailImpl. Throws if parameter does not exist or can not be converted
 */
@OptIn(ExperimentalUuidApi::class)
fun RoutingContext.getUuidParam(paramName: String): Uuid {
    return call.parameters.getOrFail(paramName).let { str ->
        try {
            Uuid.parse(str)
        } catch (cause: Exception) {
            throw ParameterConversionException(paramName, Uuid::class.simpleName ?: Uuid::class.toString(), cause)
        }
    }
}