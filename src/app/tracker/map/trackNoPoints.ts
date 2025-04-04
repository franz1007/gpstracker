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