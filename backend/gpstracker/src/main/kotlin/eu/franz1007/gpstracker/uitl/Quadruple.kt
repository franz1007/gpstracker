package eu.franz1007.gpstracker.uitl

data class Quintuple<out A, out B, out C, out D, out E>(
    val first: A, val second: B, val third: C, val fourth: D, val fifth: E
) {

    /**
     * Returns string representation of the [Triple] including its [first], [second] and [third] values.
     */
    override fun toString(): String = "($first, $second, $third, $fourth, $fifth)"
}
