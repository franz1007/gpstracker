import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { TrackService } from './services/track.service';
import { SsePointService } from './services/ssePoint.service';
import { TrackNoPoints } from './trackNoPoints';
import { Subscription } from 'rxjs';


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
  private tracks!: Array<TrackNoPoints>

  private pointsSubscription: Subscription | null = null

  constructor(private trackService: TrackService, private sseService: SsePointService) { }

  ngAfterViewInit(): void {
    this.map = L.map('map', {
      center: [49.65254208294224, 10.635266687654777],
      zoom: 7
    });
    this.tiles.addTo(this.map)
    //this.markerService.makeCapitalMarkers(this.map);
    this.line = L.polyline([], { color: "red" }).addTo(this.map)
    this.marker = L.circleMarker(new L.LatLng(1, 1)).addTo(this.map)
    this.subscribeLatestTrack()
    this.trackService.getAllTracks().then(tracks => {
      this.tracks = tracks;
      console.log("Received Tracks")
      console.log(tracks)
    }).then(()=>{
      setTimeout(()=>{
        console.log("Showing single track")
        this.showTrack(this.tracks[0])
        setTimeout(() =>{
          console.log("subscribing to latest track")
          this.subscribeLatestTrack()
        },20000)
      }, 20000)
    })
  }

  subscribeLatestTrack() {
    this.trackService.getLatestTrack().then(points => {
      this.line.setLatLngs(points)
      this.marker.setLatLng(this.line.getLatLngs()[this.line.getLatLngs().length - 1] as L.LatLng)
      this.marker.setRadius(20)

    }).finally(() => {
      this.pointsSubscription = this.sseService.createEventSource().subscribe(data => {
        console.log(data)
        this.line.addLatLng(new L.LatLng(data.lat, data.lon))
        this.marker.setLatLng(this.line.getLatLngs()[this.line.getLatLngs().length - 1] as L.LatLng)
        this.line.setLatLngs
      })
    })
  }

  showTrack(track: TrackNoPoints) {
    if (this.pointsSubscription != null) {
      this.pointsSubscription.unsubscribe()
    }
    this.trackService.getTrack(track).then(points => {
      this.line.setLatLngs(points)
      this.marker.setLatLng(this.line.getLatLngs()[this.line.getLatLngs().length - 1] as L.LatLng)
      this.marker.setRadius(20)
    })
  }

}