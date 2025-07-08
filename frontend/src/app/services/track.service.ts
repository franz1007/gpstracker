import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { environment } from '../../environments/environment';
import { firstValueFrom, from, map, Observable } from 'rxjs';
import { GpsPoint } from '../tracker/map/gps-point';
import { Instant } from '@js-joda/core';
import { TrackNoPoints, TrackMetadata } from '../tracker/map/trackNoPoints';
import { JsonPipe } from '@angular/common';
import { Feature } from 'geojson';
import { IdbcacheService } from '../idbcache.service';

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


  constructor(private http: HttpClient, private idbService: IdbcacheService) { }

  async getLatestTrackJson(): Promise<Feature<GeoJSON.LineString>> {
    return firstValueFrom(this.getTrackGeoJsonFromUrl("latest"))
  }

  getTrackGeoJson(track: TrackNoPoints): Observable<Feature<GeoJSON.LineString>> {
    return this.getTrackGeoJsonFromUrl(track.id.toString())
  }

  getTrackGeoJsonFromUrl(id: string): Observable<Feature<GeoJSON.LineString>> {
    if (id !== "latest") {
      const track = from(this.idbService.getTrack(id).then(result => {
        if (result === null) {
          const res = this.http.get<Feature<GeoJSON.LineString>>(this.geoJsonUrl + "/" + id)
          return firstValueFrom(res.pipe(observable => {
            observable.subscribe(trackFromNetwork => {
              this.idbService.storeTrack(id, trackFromNetwork)
              console.log("stored track")
            })
            return observable
          }))
        }
        else {
          return result
        }
      }))
      return track
    }
    else {
      return this.http.get<Feature<GeoJSON.LineString>>(this.geoJsonUrl + "/" + id)
    }
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