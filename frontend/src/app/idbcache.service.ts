import { Injectable } from '@angular/core';
import { Feature } from 'geojson';
import { TrackMetadata } from './tracker/map/trackNoPoints';
import { openDB, DBSchema, IDBPDatabase } from 'idb';



@Injectable({
  providedIn: 'root'
})
export class IdbcacheService {
  constructor() {
  }

  public async getTrackFeature(id: number): Promise<Feature<GeoJSON.LineString> | null> {
    const db = await this.initDB()
    return db.get("features", id).then((value) => {
      if (value !== undefined) {
        console.log("Successfully retreived feature for Track " + id + " from indexeddb")
        return value.feature
      }
      else {
        return null
      }
    }).catch(() => {
      console.log("error getting " + id + "from idb")
      return null
    })
  }

  public async getMetadata(id: number): Promise<TrackMetadata | null> {
    const db = await this.initDB()
    return db.get("metadata", id).then((value) => {
      if (value !== undefined) {
        console.log("Successfully retreived metadata for Track " + id + " from indexeddb")
        return value.metadata
      }
      return null
    }).catch(() => {
      console.log("error getting " + id + "from idb")
      return null
    })
  }



  public storeFeature(id: number, feature: Feature<GeoJSON.LineString>) {
    this.initDB().then(db => {
      db.put("features", { feature: feature }, id)
      const transaction = db.transaction("features", "readwrite")
    })
  }

  public storeMetadata(id: number, metadata: TrackMetadata) {
    this.initDB().then(db => {
      db.put("metadata", { metadata: metadata }, id)
    })
  }

  async initDB() {
    return await openDB<MyDB>('my-db', 2, {
      upgrade(db) {
        db.createObjectStore("features")
        db.createObjectStore("metadata")
      },
    });
  }
}

interface MyDB extends DBSchema {
  features: {
    key: number,
    value: {
      feature: Feature<GeoJSON.LineString>
    };
  };
  metadata: {
    key: number,
    value: {
      metadata: TrackMetadata
    };
  };
}