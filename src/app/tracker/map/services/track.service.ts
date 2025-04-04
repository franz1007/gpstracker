import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { environment } from '../../../../environments/environment';
import { firstValueFrom, map, Observable } from 'rxjs';
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
    return firstValueFrom(this.getTrackFromUrl("latest"))
  }

  getTrack(track: TrackNoPoints): Observable<L.LatLng[]> {
    return this.getTrackFromUrl(track.id.toString())
  }

  getTrackFromUrl(id: string): Observable<L.LatLng[]> {
    return this.http.get(this.pointsUrl + "/" + id, { responseType: 'text' }).pipe(map((res) => {
      const points = JSON.parse(res, (key, value) => {
        if (key === "eta" || key === "etfa" || key === "timestamp") {
          return Instant.parse(value);
        } else {
          return value;
        }
      }) as Array<GpsPoint>;
      return points.map(point => {
        return new L.LatLng(point.lat, point.lon)
      })
    }))
  }

  async getAllTracks(): Promise<Array<TrackNoPoints>> {
    const tracksString = await firstValueFrom(this.http.get(this.tracksUrl, { responseType: 'text' }))
    const tracks = JSON.parse(tracksString, (key, value) => {
      if (key === "eta" || key === "etfa" || key === "timestamp" || key === "startTimestamp" || key === "endTimestamp") {
        return Instant.parse(value);
      } else {
        return value;
      }
    }) as Array<TrackNoPoints>
    return tracks.map((track) => {
      return new TrackNoPoints(track.id, track.startTimestamp, track.endTimestamp)
    })
  }
}