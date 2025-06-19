import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { environment } from '../../../../environments/environment';
import { firstValueFrom, map, Observable } from 'rxjs';
import { GpsPoint } from '../gps-point';
import { Instant } from '@js-joda/core';
import { TrackNoPoints, TrackMetadata } from '../trackNoPoints';
import { JsonPipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class TrackService {
  pointsUrl: string = environment.apiUrl + "/api/points/byTrack"
  geoJsonUrl: string = environment.apiUrl + "/api/tracks/geoJson"
  latestTrackUrl: string = environment.apiUrl + "/api/tracks/latest"
  tracksUrl: string = environment.apiUrl + "/api/tracks"
  trackMetadataUrl: string = environment.apiUrl + "/api/tracks/metadata"
  categoriesUrl: string = environment.apiUrl + "/api/trackCategories"


  constructor(private http: HttpClient) { }

  async getLatestTrackJson(): Promise<string> {
    return firstValueFrom(this.getTrackGeoJsonFromUrl("latest"))
  }

  getTrackGeoJson(track: TrackNoPoints) {
    return this.getTrackGeoJsonFromUrl(track.id.toString())
  }

  getTrackGeoJsonFromUrl(id: string): Observable<string> {
    return this.http.get(this.geoJsonUrl + "/" + id, { responseType: 'text' })
  }

  async getLatestTrack(): Promise<L.LatLng[]> {
    return firstValueFrom(this.getTrackFromUrl("latest"))
  }

  getTrack(track: TrackNoPoints): Observable<L.LatLng[]> {
    return this.getTrackFromUrl(track.id.toString())
  }

  getTrackCategories(): Promise<Array<string>> {
    return firstValueFrom(this.http.get(this.categoriesUrl) as Observable<Array<string>>)
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

  async getAllTracks(abortSignal: AbortSignal): Promise<Array<TrackNoPoints>> {
    const tracksString = await fetch(this.tracksUrl, { signal: abortSignal })
    const text = await tracksString.text()
    const tracks = JSON.parse(text, (key, value) => {
      if (key === "eta" || key === "etfa" || key === "timestamp" || key === "startTimestamp" || key === "endTimestamp") {
        return Instant.parse(value);
      } else {
        return value;
      }
    }) as Array<TrackNoPoints>
    return tracks.map((track) => {
      return new TrackNoPoints(track.id, track.startTimestamp, track.endTimestamp, track.category)
    })
  }

  async getAllTracksWithMetadata(abortSignal: AbortSignal): Promise<Array<TrackMetadata>> {
    const tracksString = await fetch(this.tracksUrl, { signal: abortSignal })
    const text = await tracksString.text()
    const tracks = JSON.parse(text, (key, value) => {
      if (key === "eta" || key === "etfa" || key === "timestamp" || key === "startTimestamp" || key === "endTimestamp") {
        return Instant.parse(value);
      } else {
        return value;
      }
    }) as Array<TrackNoPoints>
    console.log(tracks)
    const sorted = tracks.sort((a, b) => {
      a.startTimestamp.compareTo(b.endTimestamp)
      return a.startTimestamp.compareTo(b.startTimestamp)
    });
    return sorted.map((track) => {
      const trackObject = new TrackMetadata(track.id, track.startTimestamp, track.endTimestamp, track.category)
      fetch(this.trackMetadataUrl + "/" + trackObject.id, { signal: abortSignal }).then(response => {
        response.text().then(text => {
          const track = JSON.parse(text, (key, value) => {
            if (key === "eta" || key === "etfa" || key === "timestamp" || key === "startTimestamp" || key === "endTimestamp") {
              return Instant.parse(value);
            } else {
              return value;
            }
          }) as TrackMetadata
          trackObject.distanceMeters = track.distanceMeters
          trackObject.averageSpeedKph = track.averageSpeedKph
          console.log("received distances")
        })

      })
      return trackObject
    })
  }
}