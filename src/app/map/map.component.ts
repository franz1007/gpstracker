import { Component, AfterViewInit, Signal, signal, input, Input, InputSignal, effect, model, ModelSignal } from '@angular/core';
import * as L from 'leaflet';
import { TrackService } from './services/track.service';
import { SsePointService } from './services/ssePoint.service';
import { TrackNoPoints } from './trackNoPoints';
import { first, Subscription } from 'rxjs';
import { GpsPoint } from './gps-point';


@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})

export class MapComponent {
  showTrackMode: ModelSignal<string | TrackNoPoints[] | null> = model.required<string | TrackNoPoints[] | null>();

  private map: L.Map = L.map('map', {
    center: [49.65254208294224, 10.635266687654777],
    zoom: 7,
    zoomControl: false,
  });
  private tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    minZoom: 3,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });
  private lines: L.Polyline[] = new Array<L.Polyline>()
  private marker: L.CircleMarker = L.circleMarker(new L.LatLng(1, 1))

  private pointsSubscription: Subscription | null = null

  constructor(private trackService: TrackService, private sseService: SsePointService) {
    L.control.zoom({ position: 'topright' }).addTo(this.map)
    this.tiles.addTo(this.map)
    this.lines.forEach(line => {
      line.removeFrom(this.map)
    })
    this.marker.addTo(this.map)

    effect(() => {
      const mode = this.showTrackMode()
      console.log(`showTrackMode changed: ${mode}`);
      if (typeof (mode) === "string") {
        if (mode === "latest") {
          this.subscribeLatestTrack()
        }
        else {
          console.log("Invalid value for showTrackMode")
          console.log(mode)
        }
      }
      else {
        if (mode === null) {
          this.showNoTrack()
        }
        else {
          this.showTracks(mode)
        }
      }
    });
  }

  subscribeLatestTrack() {
    this.showNoTrack()
    const line = L.polyline([], { color: "red" })
    this.trackService.getLatestTrack().then(points => {
      const line = L.polyline([], { color: "red" })
      this.lines.push(line)
      line.setLatLngs(points)
      this.marker.setLatLng(line.getLatLngs()[line.getLatLngs().length - 1] as L.LatLng)
      this.marker.setRadius(20)
      if (!this.map.hasLayer(line)) {
        line.addTo(this.map)
      }
      if (!this.map.hasLayer(this.marker)) {
        this.marker.addTo(this.map)
      }
    }).finally(() => {
      this.pointsSubscription = this.sseService.createEventSource().pipe(first()).subscribe(data => {
        console.log(data)
        line.addLatLng(new L.LatLng(data.lat, data.lon))
        this.marker.setLatLng(line.getLatLngs()[line.getLatLngs().length - 1] as L.LatLng)
        line.setLatLngs
      })
    })
  }

  showTracks(tracks: TrackNoPoints[]) {
    this.showNoTrack()
    if (this.pointsSubscription != null) {
      this.pointsSubscription.unsubscribe()
    }
    tracks.forEach(track => {
      this.trackService.getTrack(track).subscribe(points => {
        const line = L.polyline([], { color: "red" })
        this.lines.push(line)
        line.setLatLngs(points)
        line.addTo(this.map)
        this.marker.setLatLng(line.getLatLngs()[line.getLatLngs().length - 1] as L.LatLng)
        this.marker.setRadius(20)
      })
    })
  }

  showNoTrack() {
    this.lines.forEach(line => {
      line.removeFrom(this.map)
    })
    this.lines = new Array<L.Polyline>()
    this.marker.removeFrom(this.map)
  }

}