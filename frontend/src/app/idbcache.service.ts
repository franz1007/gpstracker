import { Injectable } from '@angular/core';
import { get, set } from 'idb-keyval';
import { Feature } from 'geojson';


@Injectable({
  providedIn: 'root'
})
export class IdbcacheService {
  constructor() { }

  public async getTrack(id: string): Promise<Feature<GeoJSON.LineString> | null> {
    return await get(id).then((value) => {
      if (value !== undefined) {
        console.log("Successfully retreived track " + id + " Cfrom indexeddb")
        return value as Feature<GeoJSON.LineString>
      }
      return null
    }).catch(() => {
      console.log("error getting " + id + "from idb")
      return null
    })
  }

  public storeTrack(id: string, track: Feature<GeoJSON.LineString>) {
    set(id, track).then(() => console.log("Saved track in indexeddb: " + id))
  }
}
