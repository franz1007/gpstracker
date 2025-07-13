import { Injectable } from '@angular/core';
import { Feature } from 'geojson';
import { TrackMetadata } from './tracker/map/trackNoPoints';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Instant } from '@js-joda/core';



@Injectable({
  providedIn: 'root'
})
export class IdbcacheService {
  constructor() {
  }

  public async getTrackFeature(id: number): Promise<{
    feature: Feature<GeoJSON.LineString> | null,
    startTimestampMillis: number | null;
    endTimestampMillis: number | null
  }> {
    const db = await this.initDB()
    return db.get("features", id).then((value) => {
      if (value !== undefined) {
        console.log("Retreived feature for Track " + id + " from indexeddb")
        return { feature: value.feature, startTimestampMillis: value.startTimestamp, endTimestampMillis: value.endTimestamp }
      }
      else {
        return { feature: null, startTimestampMillis: null, endTimestampMillis: null }
      }
    }).catch(() => {
      console.log("error getting " + id + "from idb")
      return { feature: null, startTimestampMillis: null, endTimestampMillis: null }
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



  public storeFeature(id: number, feature: Feature<GeoJSON.LineString>, startTimestamp: Instant, endTimestamp: Instant) {
    this.initDB().then(db => {
      db.put("features", { feature: feature, startTimestamp: startTimestamp.toEpochMilli(), endTimestamp: endTimestamp.toEpochMilli() }, id)
      const transaction = db.transaction("features", "readwrite")
    })
  }

  public storeMetadata(id: number, metadata: TrackMetadata) {
    this.initDB().then(db => {
      db.put("metadata", { metadata: metadata }, id)
    })
  }

  async initDB() {
    return await openDB<MyDB>('my-db', 3, {
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
      feature: Feature<GeoJSON.LineString>,
      startTimestamp: number,
      endTimestamp: number
    };
  };
  metadata: {
    key: number,
    value: {
      metadata: TrackMetadata
    };
  };
}