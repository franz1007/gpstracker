import {
  Component,
  effect,
  model,
  ModelSignal,
  OnDestroy,
  OnInit,
} from '@angular/core';

import * as L from 'leaflet';
import { Feature, LineString, Position } from 'geojson';
@Component({
  selector: 'app-segmentmap',
  imports: [],
  templateUrl: './segmentmap.component.html',
  styleUrl: './segmentmap.component.css',
})
export class SegmentmapComponent implements OnInit, OnDestroy {
  trackGeoJson: ModelSignal<Feature<LineString> | undefined> = model.required<
    Feature<LineString> | undefined
  >();

  selectedSegment: ModelSignal<number> = model.required();

  private tiles = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 20,
      minZoom: 3,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  );
  private highlightLine = L.polyline([], { color: 'red' });
  private map!: L.Map;
  private currentMapFeature: L.GeoJSON = L.geoJSON(null, {
    style: { color: 'blue' },
  });

  constructor() {
    effect(() => {
      const feature = this.trackGeoJson();
      console.log('Segmentmap: new geoJson');
      if (feature) {
        if (this.map.hasLayer(this.currentMapFeature)) {
          console.log('Map already had Feature, removing');
          this.currentMapFeature.removeFrom(this.map);
        }
        this.currentMapFeature = L.geoJSON(null, {
          style: { color: 'blue' },
        });
        this.currentMapFeature.addData(feature);
        this.map.addLayer(this.currentMapFeature);
        this.map.fitBounds(this.currentMapFeature.getBounds());
        console.log('Added feature to map');
      }
    });

    effect(() => {
      console.log('Segmentmap new Track or selectedSegment');
      const index = this.selectedSegment();
      const json = this.trackGeoJson();
      if (json && index > -1) {
        this.highlightLine.setLatLngs(
          json.geometry.coordinates
            .slice(index, index + 2)
            .map((position) => [position[1], position[0]]),
        );
        this.highlightLine.bringToFront();
        this.map.setView(this.highlightLine.getCenter());
      }
    });
  }

  ngOnInit() {
    this.map = L.map('segment-map', {
      center: [49.45421, 11.07752], //Nuremberg
      zoom: 5,
      zoomControl: false,
    });
    L.control.zoom({ position: 'topright' }).addTo(this.map);
    const control = L.control
      .layers(undefined, undefined, {
        collapsed: true,
      })
      .addTo(this.map);
    const OpenTopoMap = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 17,
        attribution:
          'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        opacity: 0.9,
      },
    );
    const HikingTrails = L.tileLayer(
      'https://tile.waymarkedtrails.org/{id}/{z}/{x}/{y}.png',
      {
        id: 'hiking',
        attribution:
          '&copy; <a href="http://waymarkedtrails.org">Sarah Hoffmann</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      },
    );
    const CyclingTrails = L.tileLayer(
      'https://tile.waymarkedtrails.org/{id}/{z}/{x}/{y}.png',
      {
        id: 'cycling',
        attribution:
          '&copy; <a href="http://waymarkedtrails.org">Sarah Hoffmann</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      },
    );
    //const contoursDe = L.tileLayer('https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/tiles/v1/bm_web_de_3857/{z}/{x}/{y}.pbf')
    control.addBaseLayer(this.tiles, 'OpenStreetMap');
    control.addBaseLayer(OpenTopoMap, 'OpenTopoMap');
    control.addOverlay(HikingTrails, 'Hiking Routes');
    control.addOverlay(CyclingTrails, 'Cycling Routes');

    //control.addOverlay(contoursDe, "Contours Germany")
    this.tiles.addTo(this.map);
    this.currentMapFeature.addTo(this.map);
    this.highlightLine.addTo(this.map);
  }

  ngOnDestroy() {
    // If this directive is destroyed, the map is too
    if (null != this.map) {
      this.map.remove();
    }
  }
}
