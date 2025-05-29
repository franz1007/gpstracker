import { Component, AfterViewInit, Signal, signal, input, Input, InputSignal, effect, model, ModelSignal, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { TrackService } from './services/track.service';
import { SsePointService } from './services/ssePoint.service';
import { TrackNoPoints } from './trackNoPoints';
import { first, Subscription } from 'rxjs';


@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})

export class MapComponent implements OnDestroy, OnInit {
  showTrackMode: ModelSignal<string | TrackNoPoints[] | null> = model.required<string | TrackNoPoints[] | null>();

  private map!: L.Map
  private tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    minZoom: 3,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });
  private lines: Map<number, L.Polyline> = new Map<number, L.Polyline>()
  private latestLine: L.Polyline = L.polyline([], { color: "red" })
  private marker: L.CircleMarker = L.circleMarker(new L.LatLng(1, 1))

  private pointsSubscription: Subscription | null = null

  constructor(private trackService: TrackService, private sseService: SsePointService) {
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

  ngOnInit() {
    this.map = L.map('map', {
      center: [49.65254208294224, 10.635266687654777],
      zoom: 7,
      zoomControl: false,
    });
    L.control.zoom({ position: 'topright' }).addTo(this.map)
    const control = L.control.layers(undefined, undefined, {
      collapsed: true
    }).addTo(this.map);
    const OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      opacity: 0.90
    });
    const HikingTrails = L.tileLayer('https://tile.waymarkedtrails.org/{id}/{z}/{x}/{y}.png', {
      id: 'hiking',
      attribution: '&copy; <a href="http://waymarkedtrails.org">Sarah Hoffmann</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    });
    const CyclingTrails = L.tileLayer('https://tile.waymarkedtrails.org/{id}/{z}/{x}/{y}.png', {
      id: 'cycling',
      attribution: '&copy; <a href="http://waymarkedtrails.org">Sarah Hoffmann</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    });
    //const contoursDe = L.tileLayer('https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/tiles/v1/bm_web_de_3857/{z}/{x}/{y}.pbf')
    control.addBaseLayer(this.tiles, "OpenStreetMap")
    control.addBaseLayer(OpenTopoMap, "OpenTopoMap");
    control.addOverlay(HikingTrails, "Hiking Routes");
    control.addOverlay(CyclingTrails, "Cycling Routes");
    
    //control.addOverlay(contoursDe, "Contours Germany")
    this.tiles.addTo(this.map)
    this.lines.forEach(line => {
      line.removeFrom(this.map)
    })
    this.marker.addTo(this.map)
  }

  ngOnDestroy() {
    // If this directive is destroyed, the map is too
    if (null != this.map) {
      this.map.remove();
    }
  }



  subscribeLatestTrack() {
    this.showNoTrack()
    this.trackService.getLatestTrack().then(points => {
      this.latestLine.setLatLngs(points)
      this.marker.setLatLng(this.latestLine.getLatLngs()[this.latestLine.getLatLngs().length - 1] as L.LatLng)
      this.marker.setRadius(20)
      if (!this.map.hasLayer(this.latestLine)) {
        this.latestLine.addTo(this.map)
      }
      if (!this.map.hasLayer(this.marker)) {
        this.marker.addTo(this.map)
      }
    }).finally(() => {
      this.pointsSubscription = this.sseService.createEventSource().subscribe(data => {
        console.log(data)
        this.latestLine.addLatLng(new L.LatLng(data.lat, data.lon))
        this.marker.setLatLng(this.latestLine.getLatLngs()[this.latestLine.getLatLngs().length - 1] as L.LatLng)
        this.latestLine.setLatLngs
      })
    })
  }

  showTracks(tracks: TrackNoPoints[]) {
    this.showNoTrack()
    if (this.pointsSubscription != null) {
      this.pointsSubscription.unsubscribe()
    }
    tracks.forEach(track => {
      const line = this.lines.get(track.id)
      if (line === undefined) {
        const line = L.polyline([], { color: "red" })
        this.lines.set(track.id, line)
        this.trackService.getTrack(track).pipe(first()).subscribe(points => {
          line.setLatLngs(points)
          line.addTo(this.map)
        })
      }
      else {
        line.addTo(this.map)
      }
    })
  }

  showNoTrack() {
    this.lines.forEach(line => {
      line.removeFrom(this.map)
    })
    this.latestLine.removeFrom(this.map)
    this.marker.removeFrom(this.map)
  }

}