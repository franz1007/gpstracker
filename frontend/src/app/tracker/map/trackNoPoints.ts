import { ChronoUnit, DateTimeFormatter, Duration, Instant, ZoneId } from '@js-joda/core'
export class TrackNoPoints {
    uuid: string;
    startTimestamp: Instant;
    endTimestamp: Instant;
    category: string;
    constructor(uuid: string, startTimestamp: Instant, endTimestamp: Instant, category: string) {
        this.uuid = uuid;
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
        this.category = category;
    }
}
export class TrackMetadata {
    uuid: string;
    startTimestamp: Instant;
    endTimestamp: Instant;
    duration: Duration;
    durationString: string;
    distanceMeters?: number;
    category: string;
    averageSpeedKph?: number;
    startTimestampString: string;
    constructor(uuid: string, startTimestamp: Instant, endTimestamp: Instant, category: string, distanceMeters?: number, averageSpeedKph?: number) {
        this.uuid = uuid;
        this.startTimestamp = startTimestamp;
        this.startTimestampString = startTimestamp.atZone(ZoneId.SYSTEM).format(DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm')) + " Uhr"
        this.endTimestamp = endTimestamp;
        this.distanceMeters = distanceMeters;
        this.averageSpeedKph = averageSpeedKph;
        this.category = category
        this.duration = Duration.between(startTimestamp, endTimestamp)
        this.duration.toHours()
        const hours = this.duration.toHours()
        const minutes = this.duration.minusHours(hours).toMinutes()
        this.durationString = hours + ":" + minutes.toString().padStart(2, "0") + " h"
        console.log(startTimestamp.toString())
        console.log(this.startTimestampString)
    }
}
