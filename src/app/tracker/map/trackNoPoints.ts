import { Instant } from '@js-joda/core'
export class TrackNoPoints {
    id: number;
    startTimestamp: Instant;
    endTimestamp: Instant;
    constructor(id: number, startTimestamp: Instant, endTimestamp: Instant) {
        this.id = id;
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
    }
}
export class TrackWithMetadata {
    id: number;
    startTimestamp: Instant;
    endTimestamp: Instant;
    distanceMeters?: number;
    averageSpeedKph?: number
    constructor(id: number, startTimestamp: Instant, endTimestamp: Instant, distanceMeters?: number, averageSpeedKph?: number) {
        this.id = id;
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
        this.distanceMeters = distanceMeters;
        this.averageSpeedKph = averageSpeedKph;
    }
}