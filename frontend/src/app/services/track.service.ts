import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom, from, map, Observable } from 'rxjs';
import { Instant } from '@js-joda/core';
import { TrackNoPoints, TrackMetadata } from '../tracker/map/trackNoPoints';
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
    const trackResult = from(this.idbService.getTrackFeature(track.id).then(result => {
      if (result.feature === null || result.startTimestampMillis !== track.startTimestamp.toEpochMilli() || result.endTimestampMillis !== track.endTimestamp.toEpochMilli()) {
        const res = this.getTrackGeoJsonFromUrl(track.id.toString())
        return firstValueFrom(res.pipe(observable => {
          observable.subscribe(trackFromNetwork => {
            this.idbService.storeFeature(track.id, trackFromNetwork, track.startTimestamp, track.endTimestamp)
            console.log("stored track")
          })
          return observable
        }))
      }
      else {
        console.log("Successfully retreived feature for Track " + track.id + " from indexeddb")
        return result.feature
      }
    }))
    return trackResult
  }


  getTrackGeoJsonFromUrl(id: string): Observable<Feature<GeoJSON.LineString>> {
    return this.http.get<Feature<GeoJSON.LineString>>(this.geoJsonUrl + "/" + id)
  }


  getTrackCategories(): Promise<Array<string>> {
    return firstValueFrom(this.http.get(this.categoriesUrl) as Observable<Array<string>>)
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

    const test = sorted.map(async (track) => {
      const metadata = await this.idbService.getMetadata(track.id)
      if (metadata === null) {
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
            this.idbService.storeMetadata(track.id, trackObject)
          })
        })
        return trackObject
      }
      else {
        return metadata
      }
    })
    return await Promise.all(test)
  }
}