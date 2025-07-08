import { Injectable } from '@angular/core';
import { get, set, update } from 'idb-keyval';
import { Feature } from 'geojson';
import { TrackMetadata } from './tracker/map/trackNoPoints';


@Injectable({
  providedIn: 'root'
})
export class IdbcacheService {
  constructor() { }

  public async getTrackFeature(id: string): Promise<Feature<GeoJSON.LineString> | null> {
    return await get<Track>(id).then((value) => {
      if (value !== undefined) {
        if (value.geoJsonFeature !== undefined) {
          console.log("Successfully retreived feature for Track " + id + " from indexeddb")
          return value.geoJsonFeature
        }
        else {
          return null
        }
      }
      return null
    }).catch(() => {
      console.log("error getting " + id + "from idb")
      return null
    })
  }

  public async getMetadata(id: string): Promise<TrackMetadata | null> {
    return await get<Track>(id).then((value) => {
      if (value !== undefined) {
        if (value.metadata !== undefined) {
          console.log("Successfully retreived metadata for Track " + id + " from indexeddb")
          return value.metadata
        }
        else {
          return null
        }
      }
      return null
    }).catch(() => {
      console.log("error getting " + id + "from idb")
      return null
    })
  }

  

  public storeFeature(id: string, feature: Feature<GeoJSON.LineString>) {
    update<Track>(id, (oldTrack) => {
      const track = oldTrack !== undefined ? oldTrack : new Track()
      track.geoJsonFeature = feature
      return track

    })
  }

  public storeMetadata(id: string, metadata: TrackMetadata) {
    update<Track>(id, (oldTrack) => {
      const track = oldTrack !== undefined ? oldTrack : new Track()
      track.metadata = metadata
      return track
    })
  }
}

class Track {
  metadata?: TrackMetadata;
  geoJsonFeature?: Feature<GeoJSON.LineString>;
}
