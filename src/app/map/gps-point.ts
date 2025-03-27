import { Instant } from '@js-joda/core'
export class GpsPoint {
    id: number;
    timestamp: Instant;
    lat: number;
    lon: number;
    hdop: number;
    altitude: number;
    speed: number;
    bearing: number;
    eta: Instant;
    etfa: Instant;
    eda: number;
    edfa: number;
    constructor(id: number, timestamp: Instant, lat: number, lon: number, hdop: number, altitude: number, speed: number, bearing: number, eta: Instant, etfa: Instant, eda: number, edfa: number) {
        this.id = id;
        this.lat = lat;
        this.lon = lon;
        this.hdop = hdop;
        this.altitude = altitude
        this.speed = speed
        this.bearing = bearing
        this.eta = eta
        this.etfa = etfa
        this.eda = eda
        this.edfa = edfa
        this.timestamp = timestamp
    }

    static fromJson(jsonString: string): GpsPoint {
        const parsed = JSON.parse(jsonString)
        const timestamp = Instant.parse(parsed.timestamp)
        const eta = Instant.parse(parsed.eta)
        const etfa = Instant.parse(parsed.etfa)
        return new GpsPoint(parsed.id, timestamp, parsed.lat, parsed.lon, parsed.hdop, parsed.altitude, parsed.speed, parsed.bearing, eta, etfa, parsed.eda, parsed.edfa)
    }
}
