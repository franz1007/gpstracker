import { Instant } from '@js-joda/core'
export class TrackNoPoints {
    id: number;
    startTimestamp: Instant;
    endTimestamp: Instant;
    category: string;
    constructor(id: number, startTimestamp: Instant, endTimestamp: Instant, category: string) {
        this.id = id;
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
        this.category = category;
    }
}
export class TrackWithMetadata {
    id: number;
    startTimestamp: Instant;
    endTimestamp: Instant;
    distanceMeters?: number;
    category: string;
    averageSpeedKph?: number;
    constructor(id: number, startTimestamp: Instant, endTimestamp: Instant, category: string, distanceMeters?: number, averageSpeedKph?: number) {
        this.id = id;
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
        this.distanceMeters = distanceMeters;
        this.averageSpeedKph = averageSpeedKph;
        this.category = category
    }
}