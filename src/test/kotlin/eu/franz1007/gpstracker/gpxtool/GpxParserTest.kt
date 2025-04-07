package eu.franz1007.gpstracker.gpxtool

import java.io.File
import java.nio.file.Files
import kotlin.io.path.Path
import kotlin.io.path.inputStream
import kotlin.io.path.isRegularFile
import kotlin.io.path.listDirectoryEntries
import kotlin.test.Test

class GpxParserTest {

    @Test
    fun parseGpx() {
        val parser = GpxParser()
        Path("September2024").listDirectoryEntries().filter { it.isRegularFile() }.forEach {
            println(it)
            val gpx = parser.parseGpx(it.inputStream())
            println(gpx)
        }
    }

    @Test
    fun parseAll(){
        val parser = GpxParser()
        Files.walk(Path("tracks")).filter { it.isRegularFile() }.forEach{
            println(it)
            val gpx = parser.parseGpx(it.inputStream())
            println(gpx)
        }
    }

}