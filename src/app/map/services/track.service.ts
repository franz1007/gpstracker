import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { GpsPoint } from '../gps-point';
import { Instant } from '@js-joda/core';
import { TrackNoPoints } from '../trackNoPoints';

@Injectable({
  providedIn: 'root'
})
export class TrackService {
  pointsUrl: string = environment.apiUrl + "/api/points/byTrack"
  latestTrackUrl: string = environment.apiUrl + "/api/tracks/latest"
  tracksUrl: string = environment.apiUrl + "/api/tracks"


  constructor(private http: HttpClient) { }

  async getLatestTrack(): Promise<L.LatLng[]> {
    const latestTrackString = await firstValueFrom(this.http.get(this.latestTrackUrl, { responseType: 'text' }))
    const latestTrack = JSON.parse(latestTrackString, (key, value) =>{
      if (key === "eta" || key === "etfa" || key === "timestamp") {
        return Instant.parse(value);
      } else {
        return value;
      }
    }) as TrackNoPoints
    return this.getTrack(latestTrack)
  }

  async getTrack(track: TrackNoPoints): Promise<L.LatLng[]>{
    const res = await firstValueFrom(this.http.get(this.pointsUrl + "/" + track.id, { responseType: 'text' }))
    const points = JSON.parse(res, (key, value) => {
      if (key === "eta" || key === "etfa" || key === "timestamp") {
        return Instant.parse(value);
      } else {
        return value;
      }
    }) as Array<GpsPoint>;
    console.log(points);
    const latLngs = Array<L.LatLng>()
    points.sort((a: GpsPoint, b: GpsPoint) => {
      if (a.timestamp.isBefore(b.timestamp)) {
        return -1;
      }
      if (a.timestamp.isAfter(b.timestamp)) {
        return 1;
      }
      return 0;
    })
    for (const c of points) {
      latLngs.push(new L.LatLng(c.lat, c.lon))
    }
    return latLngs
  }

  async getAllTracks(): Promise<Array<TrackNoPoints>>{
    const tracksString = await firstValueFrom(this.http.get(this.tracksUrl, { responseType: 'text' }))
    const tracks = JSON.parse(tracksString, (key, value) =>{
      if (key === "eta" || key === "etfa" || key === "timestamp") {
        return Instant.parse(value);
      } else {
        return value;
      }
    }) as Array<TrackNoPoints>
    return tracks
  }
}