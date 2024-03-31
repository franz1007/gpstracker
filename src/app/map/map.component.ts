import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { MarkerService } from '../marker.service';


@Component({
  selector: 'app-map',
  standalone: true,
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

  constructor(private markerService: MarkerService) { }

  ngAfterViewInit(): void {
    this.map = L.map('map', {
      center: [49.65254208294224, 10.635266687654777],
      zoom: 10
    });
    this.tiles.addTo(this.map)
    this.markerService.makeCapitalMarkers(this.map);
  }
}