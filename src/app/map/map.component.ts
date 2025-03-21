import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { MarkerService } from '../marker.service';
import { SsePointService } from '../ssePoint.service';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})

export class MapComponent implements AfterViewInit {
  private map!: L.Map;

  private tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    minZoom: 3,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });
  private line!: L.Polyline
  private marker!: L.CircleMarker

  constructor(private markerService: MarkerService, private sseService: SsePointService) { }

  ngAfterViewInit(): void {
    this.map = L.map('map', {
      center: [49.65254208294224, 10.635266687654777],
      zoom: 10
    });
    this.tiles.addTo(this.map)
    //this.markerService.makeCapitalMarkers(this.map);
    this.markerService.getInitialPoints().then(points => {
      this.line = L.polyline(points, { color: "red" }).addTo(this.map)
      const pos = this.line.getLatLngs()[this.line.getLatLngs().length - 1] as L.LatLng
      this.marker = L.circleMarker(pos)
      this.marker.setRadius(20)
      this.marker.addTo(this.map)
      this.sseService.createEventSource().subscribe(data => {
        console.log(data)
        const obj = JSON.parse(data)
        console.log(obj.lat)
        console.log(obj.lon)
        this.line.addLatLng(new L.LatLng(obj.lat, obj.lon))
        this.marker.setLatLng(this.line.getLatLngs()[this.line.getLatLngs().length - 1] as L.LatLng)
      })
    })
    
    
  }
}