import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  capitals: string = '/gpstracker-backend/points';

  constructor(private http: HttpClient) { }
  makeCapitalMarkers(map: L.Map): void {
    this.http.get(this.capitals).subscribe((res: any) => {
      console.log(res)
      const points = []
      res.sort((a: any, b: any) => {
        if (a.timestamp < b.timestamp) {
          return 1;
        }
        if (a.timestamp > b.timestamp) {
          return -1;
        }
        return 0;
      })
      let marker = new L.CircleMarker([0, 0])
      for (const c of res) {
        points.push([c.lat, c.lon])
      }
      for (let i = 0; i < points.length && i < 20; i++) {
        marker = new L.CircleMarker([points[i][0], points[i][1]])
        marker.setRadius(20-i)
        marker.addTo(map);
      }
      points.lastIndexOf
      console.log(points)
      const line = L.polyline(points, { color: "red" }).addTo(map)
    });
  }
}