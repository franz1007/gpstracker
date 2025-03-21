import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { environment } from '../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  pointsUrl: string = environment.apiUrl + "/api/points"

  constructor(private http: HttpClient) { }

  async getInitialPoints(): Promise<L.LatLng[]> {
    const res = await firstValueFrom(this.http.get(this.pointsUrl)) as Array<any>
    const points = Array<L.LatLng>()
    res.sort((a: any, b: any) => {
      if (a.timestamp < b.timestamp) {
        return -1;
      }
      if (a.timestamp > b.timestamp) {
        return 1;
      }
      return 0;
    })
    for (const c of res) {
      points.push(new L.LatLng(c.lat, c.lon))
    }
    console.log("test123")
    console.log(res)
    return points
  }
}