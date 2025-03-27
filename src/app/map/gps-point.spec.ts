import { GpsPoint } from "./gps-point";
import { Instant } from '@js-joda/core'

describe("GpsPoint should be parsable from ApiResponse", function () {
    let a;

    it("Parsing should work", function () {
        const jsonString = '{"id":447,"timestamp":"2025-03-25T20:03:32.421933850Z","lat":47.82171000000074,"lon":13.088489999999897,"hdop":1.0,"altitude":520.0,"speed":0.0,"bearing":0.0,"eta":"1970-01-01T00:00:00Z","etfa":"1970-01-01T00:00:00Z","eda":0,"edfa":0}'
        'hdop":1.0,"altitude":520.0,"speed":0.0,"bearing":0.0,"eta":"1970-01-01T00:00:00Z","etfa":"1970-01-01T00:00:00Z","eda":0,"edfa":0}'
        const point = GpsPoint.fromJson(jsonString)
        console.log(point)
        expect(point.id).toBe(447)
        expect(point.lon).toBe(13.088489999999897)
        expect(point.lat).toBe(47.82171000000074)
        expect(point.hdop).toBe(1)
        expect(point.altitude).toBe(520)
        expect(point.eda).toBe(0)
        expect(point.edfa).toBe(0)
        expect(point.timestamp).toBeInstanceOf(Instant)
        expect(point.eta).toBeInstanceOf(Instant)
        expect(point.etfa).toBeInstanceOf(Instant)
    });
});