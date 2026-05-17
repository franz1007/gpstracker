import { Injectable } from '@angular/core';
import { Feature } from 'geojson';
import { TrackMetadata } from './tracker/map/trackNoPoints';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Duration, Instant } from '@js-joda/core';

@Injectable({
  providedIn: 'root',
})
export class IdbcacheService {
  constructor() {}

  //TODO better type
  public async getTrackFeature(id: string): Promise<{
    feature: Feature<GeoJSON.LineString> | null;
    startTimestampMillis: number | null;
    endTimestampMillis: number | null;
  }> {
    const db = await this.initDB();
    return db
      .get('features', id)
      .then((value) => {
        if (value !== undefined) {
          console.log('Retreived feature for Track ' + id + ' from indexeddb');
          return {
            feature: value.feature,
            startTimestampMillis: value.startTimestamp,
            endTimestampMillis: value.endTimestamp,
          };
        } else {
          return {
            feature: null,
            startTimestampMillis: null,
            endTimestampMillis: null,
          };
        }
      })
      .catch(() => {
        console.log('error getting ' + id + 'from idb');
        return {
          feature: null,
          startTimestampMillis: null,
          endTimestampMillis: null,
        };
      });
  }

  public async getMetadata(id: string): Promise<TrackMetadata | null> {
    const db = await this.initDB();
    return db
      .get('metadata', id)
      .then((value) => {
        if (value !== undefined) {
          console.log(
            'Successfully retreived metadata for Track ' +
              id +
              ' from indexeddb',
          );
          return new TrackMetadata(
            value.metadata.uuid,
            Instant.parse(value.startTimestamp),
            Instant.parse(value.endTimestamp),
            value.metadata.category,
            value.metadata.distanceMeters,
            value.metadata.averageSpeedKph,
            value.metadata.group,
          );
        } else {
          console.log(
            'Did not find metadata for Track ' + id + ' in indexeddb',
          );
        }
        return null;
      })
      .catch((reason) => {
        console.log('error getting ' + id + 'from idb');
        console.log(reason);
        return null;
      });
  }

  public storeFeature(
    id: string,
    feature: Feature<GeoJSON.LineString>,
    startTimestamp: Instant,
    endTimestamp: Instant,
  ) {
    this.initDB().then((db) => {
      db.put(
        'features',
        {
          feature: feature,
          startTimestamp: startTimestamp.toEpochMilli(),
          endTimestamp: endTimestamp.toEpochMilli(),
        },
        id,
      );
    });
  }

  public async storeMetadata(id: string, metadata: TrackMetadata) {
    this.initDB().then((db) => {
      db.put(
        'metadata',
        {
          metadata: metadata,
          startTimestamp: metadata.startTimestamp.toString(),
          endTimestamp: metadata.endTimestamp.toString(),
        },
        id,
      );
    });
  }

  public async updateTrack(
    oldId: string,
    newId: string,
    metadataFun: (oldTrack: TrackMetadata) => TrackMetadata,
    featureFun: (
      oldFeature: Feature<GeoJSON.LineString>,
      startTimestampMillis: number,
      endTimestampMillis: number,
    ) => [Feature<GeoJSON.LineString>, number, number],
  ) {
    this.initDB().then((db) => {
      this.getMetadata(oldId).then((metadata) => {
        if (metadata != null) {
          const newMetadata = metadataFun(metadata);
          newMetadata.uuid = newId;
          db.put(
            'metadata',
            {
              metadata: newMetadata,
              startTimestamp: newMetadata.startTimestamp.toString(),
              endTimestamp: newMetadata.endTimestamp.toString(),
            },
            newId,
          );
          db.delete('metadata', oldId);
        }
      });
      this.getTrackFeature(oldId).then((data) => {
        if (
          data.feature != null &&
          data.endTimestampMillis != null &&
          data.startTimestampMillis != null
        ) {
          const [newFeature, newStart, newEnd] = featureFun(
            data.feature,
            data.startTimestampMillis,
            data.endTimestampMillis,
          );
          db.put(
            'features',
            {
              feature: newFeature,
              startTimestamp: newStart,
              endTimestamp: newEnd,
            },
            newId,
          );
          db.delete('features', oldId);
        }
      });
    });
  }

  async initDB() {
    return await openDB<MyDB>('my-db', 7, {
      upgrade(db, oldVersion, newVersion, transaction, event) {
        console.log('IDB Versions: ' + oldVersion + '; ' + newVersion);
        if (oldVersion !== newVersion) {
          console.log('Features: ' + db.objectStoreNames.contains('features'));
          console.log('Metadata: ' + db.objectStoreNames.contains('metadata'));
          if (db.objectStoreNames.contains('features')) {
            console.log('Deleting IDB Object Stores');
            db.deleteObjectStore('features');
            console.log('Deleted IDB Object Stores');
          }
          if (db.objectStoreNames.contains('metadata')) {
            console.log('Deleting IDB Object Stores');
            db.deleteObjectStore('metadata');
            console.log('Deleted IDB Object Stores');
          }
        }
        db.createObjectStore('features');
        db.createObjectStore('metadata');
      },
    });
  }
}

interface MyDB extends DBSchema {
  features: {
    key: string;
    value: {
      feature: Feature<GeoJSON.LineString>;
      startTimestamp: number;
      endTimestamp: number;
    };
  };
  metadata: {
    key: string;
    value: {
      metadata: TrackMetadata;
      startTimestamp: string;
      endTimestamp: string;
    };
  };
}
