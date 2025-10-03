package eu.franz1007.gpstracker.database.migration

import eu.franz1007.gpstracker.database.GpsPointService
import org.jetbrains.exposed.v1.core.ExperimentalDatabaseMigrationApi
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.jetbrains.exposed.v1.migration.jdbc.MigrationUtils
import java.io.File
import java.nio.file.Path
import kotlin.io.path.Path
import kotlin.io.path.name
import kotlin.io.path.useDirectoryEntries

const val URL = "jdbc:postgresql://localhost:5432/gpstracker"
const val USER = "gpsuser"
const val PASSWORD = "myPassword"
const val MIGRATIONS_DIRECTORY = "src/main/resources/db/migration"

val database = Database.connect(
    url = URL, user = USER, password = PASSWORD
)

fun main() {
    transaction(database) {
        generateMigrationScript()
    }
}

@OptIn(ExperimentalDatabaseMigrationApi::class)
fun generateMigrationScript() {
    File(MIGRATIONS_DIRECTORY).mkdirs()
    MigrationUtils.generateMigrationScript(
        GpsPointService.GpsPositions, GpsPointService.Tracks, GpsPointService.GpsPoints,
        scriptDirectory = MIGRATIONS_DIRECTORY,
        scriptName = getNextMigrationName(Path(MIGRATIONS_DIRECTORY)),
    )
}

fun getNextMigrationName(path: Path): String {
    val version = path.useDirectoryEntries("V*__*.sql") { sequence ->
        sequence.map { it.name.removePrefix("V").substringBefore("__").substringBefore(".").toInt() }.sorted()
            .lastOrNull()?.let {
                it + 1
            } ?: 1
    }

    return "V${version}__Migration"
}