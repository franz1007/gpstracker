import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  updateCategoriesUrl: string = environment.apiUrl + "/api/tracks/updateCategory"


  constructor(private http: HttpClient, private idbService: IdbcacheService) { }

  async getLatestTrackJson(): Promise<Feature<GeoJSON.LineString>> {
    return firstValueFrom(this.getTrackGeoJsonFromUrl("latest"))
  }

  getTrackGeoJson(track: TrackNoPoints): Observable<Feature<GeoJSON.LineString>> {
    const trackResult = from(this.idbService.getTrackFeature(track.uuid).then(result => {
      if (result.feature === null || result.startTimestampMillis !== track.startTimestamp.toEpochMilli() || result.endTimestampMillis !== track.endTimestamp.toEpochMilli()) {
        console.log("Track "+ track.uuid + " not yet in indexeddb, retreiving")
        const res = this.getTrackGeoJsonFromUrl(track.uuid)
        return firstValueFrom(res.pipe(map((feature, index) => {
          this.storeGeoJson(feature, track.uuid, track.startTimestamp, track.endTimestamp)
          return feature
        })))
      }
      else {
        console.log("Successfully retreived feature for Track " + track.uuid + " from indexeddb")
        return result.feature
      }
    }))
    return trackResult
  }

  async storeGeoJson(track: Feature<GeoJSON.LineString>, uuid: string, startTimestamp: Instant, endTimestamp: Instant) {
    this.idbService.storeFeature(uuid, track, startTimestamp, endTimestamp)
    console.log("stored track")
  }

  getTrackGeoJsonFromUrl(id: string): Observable<Feature<GeoJSON.LineString>> {
    console.log("getting track " + id)
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
      return new TrackNoPoints(track.uuid, track.startTimestamp, track.endTimestamp, track.category)
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
      const metadata = await this.idbService.getMetadata(track.uuid)
      if (metadata === null) {
        const trackObject = new TrackMetadata(track.uuid, track.startTimestamp, track.endTimestamp, track.category)

        fetch(this.trackMetadataUrl + "/" + trackObject.uuid, { signal: abortSignal }).then(response => {
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
            this.idbService.storeMetadata(track.uuid, trackObject)
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

  async updateCategory(trackUuid: string, newCategory: string): Promise<null | TrackNoPoints> {
    const params = new HttpParams()
      .set('trackid', trackUuid)
      .set('category', newCategory);
    return await firstValueFrom(this.http.post(this.updateCategoriesUrl, null, { params: params , responseType: "text"})).then((text => {
      const track = JSON.parse(text, (key, value) => {
        if (key === "eta" || key === "etfa" || key === "timestamp" || key === "startTimestamp" || key === "endTimestamp") {
          return Instant.parse(value);
        } else {
          return value;
        }
      }) as TrackNoPoints
      // TODO update idb (uuid and category is changed)
      return track;
    })).catch(reason => {
      console.log("CategorizeTrack failed: " + reason);
      return null;
    })
  }


}