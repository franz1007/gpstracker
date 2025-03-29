import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { MarkerService } from './services/marker.service';
import { SsePointService } from './services/ssePoint.service';


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
      zoom: 7
    });
    this.tiles.addTo(this.map)
    //this.markerService.makeCapitalMarkers(this.map);
    this.line = L.polyline([], { color: "red" }).addTo(this.map)
    this.marker = L.circleMarker(new L.LatLng(1, 1)).addTo(this.map)
    this.markerService.getInitialPoints().then(points => {
      points.forEach(point=>{
        this.line.addLatLng(point)
      })
      const pos = this.line.getLatLngs()[this.line.getLatLngs().length - 1] as L.LatLng
      this.marker.setLatLng(this.line.getLatLngs()[this.line.getLatLngs().length - 1] as L.LatLng)
      this.marker.setRadius(20)
      
    })
    this.sseService.createEventSource().subscribe(data => {
      console.log(data)
      this.line.addLatLng(new L.LatLng(data.lat, data.lon))
      this.marker.setLatLng(this.line.getLatLngs()[this.line.getLatLngs().length - 1] as L.LatLng)
      this.line.setLatLngs
    })
      
    
    
  }
}