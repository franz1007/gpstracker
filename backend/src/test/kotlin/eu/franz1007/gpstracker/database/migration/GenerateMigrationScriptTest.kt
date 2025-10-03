package eu.franz1007.gpstracker.database.migration

import org.junit.Test
import kotlin.io.path.Path
import kotlin.io.path.createDirectories
import kotlin.io.path.createFile
import kotlin.test.assertEquals
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@OptIn(ExperimentalUuidApi::class)
class GenerateMigrationScriptTest {
    @Test
    fun getNextMigrationName() {
        val tempDir = Path("/tmp/test${Uuid.random()}").createDirectories()
        assertEquals("V1__Migration.sql", getNextMigrationName(tempDir))
        tempDir.let{
            it.resolve("V1__Migration.sql").createFile()
            it.resolve("V1.4__Migration.sql").createFile()
            it.resolve("V2__Somename.sql").createFile()
        }
        assertEquals("V3__Migration.sql", getNextMigrationName(tempDir))
        tempDir.resolve("V2.2__Migration.sql").createFile()
        assertEquals("V3__Migration.sql", getNextMigrationName(tempDir))
        tempDir.resolve("V10__Migration.sql").createFile()
        assertEquals("V11__Migration.sql", getNextMigrationName(tempDir))

    }

}