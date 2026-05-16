import {
  Component,
  effect,
  input,
  InputSignal,
  linkedSignal,
  OnDestroy,
  OnInit,
  resource,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { UIChart } from 'primeng/chart';
import { TrackService } from '../services/track.service';
import { RouterLink } from '@angular/router';
import { Feature, LineString, Position } from 'geojson';
import {
  ActiveElement,
  Chart,
  ChartData,
  ChartEvent,
  ChartOptions,
  plugins,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionModule,
  AccordionPanel,
} from 'primeng/accordion';
import { ZoomPluginOptions } from 'chartjs-plugin-zoom/types/options';
import { SegmentMetadata, TrackNoPoints } from '../tracker/map/trackNoPoints';
import * as L from 'leaflet';

@Component({
  selector: 'app-trackdetails',
  imports: [
    UIChart,
    RouterLink,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    Accordion,
  ],
  templateUrl: './trackdetails.component.html',
  styleUrl: './trackdetails.component.css',
})
export class TrackdetailsComponent implements OnInit, OnDestroy {
  trackId: InputSignal<string> = input.required<string>();
  constructor(private trackService: TrackService) {
    Chart.register(zoomPlugin);
    effect(() => {
      const id = this.trackId();
      this.setTrack(id);
    });
  }
  private map!: L.Map;
  private tiles = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 20,
      minZoom: 3,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  );
  ngOnInit() {
    this.map = L.map('map', {
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
  }

  ngOnDestroy() {
    // If this directive is destroyed, the map is too
    if (null != this.map) {
      this.map.remove();
    }
  }

  private zoomOptions: ZoomPluginOptions = {
    zoom: {
      wheel: {
        enabled: true,
      },
      pinch: {
        enabled: true,
      },
      mode: 'x',
    },
    pan: {
      enabled: true,
      mode: 'x',
    },
    limits: {
      x: { min: 'original', max: 'original' },
    },
  };
  elevationData: ChartData = {
    datasets: [],
  };
  elevationOptions: ChartOptions = {
    scales: {
      x: {
        type: 'linear',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',

        // grid line settings
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      },
    },
    plugins: {
      zoom: this.zoomOptions,
    },
  };

  trackSegments = resource({
    params: () => ({ id: this.trackId() }),
    loader: ({ params, abortSignal }): Promise<SegmentMetadata[] | null> => {
      return this.trackService.getSegmentMetadata(params.id, abortSignal);
    },
  });

  trackNoPoints = resource({
    params: () => ({ id: this.trackId() }),
    loader: ({ params, abortSignal }): Promise<TrackNoPoints | null> => {
      return this.trackService.getTrackNoPoints(params.id);
    },
  });
  trackGeoJson = resource({
    params: () => ({ track: this.trackNoPoints.value() }),
    loader: ({ params, abortSignal }): Promise<Feature<LineString>> => {
      console.log('resource');
      return this.trackService.getTrackGeoJson(params.track!);
    },
  });

  segmentDataset: Signal<ChartData> = linkedSignal(() => {
    console.log('LinkedSignal:');
    console.log(this.trackSegments);
    const segmentData = this.trackSegments.value();
    if (segmentData) {
      return {
        datasets: [
          {
            label: 'Duration',
            data: segmentData.map((value, index) => {
              return {
                x: index,
                y: value.duration.seconds(),
              };
            }),
            fill: false,
            tension: 0.4,
          },
          {
            label: 'Distance',
            data: segmentData.map((value, index) => {
              return {
                x: index,
                y: value.distance,
              };
            }),
            fill: false,
            tension: 0.4,
          },
        ],
      };
    } else {
      return {
        datasets: [],
      };
    }
  });

  selectedSegment: WritableSignal<number> = signal(-1);

  linearOptions: ChartOptions = {
    scales: {
      x: {
        type: 'linear',
      },
    },
    interaction: {
      mode: 'index',
      axis: 'x',
      intersect: false,
    },
    plugins: {
      zoom: this.zoomOptions,
    },
    onHover: (event: ChartEvent, elements: ActiveElement[], chart: Chart) => {
      if (elements.length > 0) {
        // Assumes that both datasets have the same amount of points
        this.selectedSegment.set(elements[0].index);
      }
    },
  };
  private setTrack(trackId: string) {
    this.trackService.getTrackNoPoints(trackId).then((track) => {
      const distancePromise = this.trackService.getPointMetadata(track.uuid);
      const geoJsonPromise = this.trackService.getTrackGeoJson(track);
      Promise.all([distancePromise, geoJsonPromise]).then((result) => {
        const pointMedatada = result[0];
        const heights = result[1].geometry.coordinates.map((coord, index) => {
          return {
            x: pointMedatada[index].distance,
            y: coord[2],
          };
        });
        const speeds = pointMedatada
          .filter((metadata) => metadata.speed > 0)
          .map((metadata) => {
            return {
              x: metadata.distance,
              y: metadata.speed * 3.6,
            };
          });
        this.elevationData = {
          datasets: [
            {
              label: 'Elevation',
              data: heights,
              fill: false,
              tension: 0.4,
              yAxisID: 'y',
            },
            {
              label: 'Speed',
              data: speeds,
              fill: false,
              tension: 0.4,
              yAxisID: 'y1',
            },
          ],
        };
      });
    });
  }
  onDistanceChartHover(
    event: ChartEvent,
    elements: ActiveElement[],
    chart: Chart,
  ) {
    if (elements.length > 0) {
      console.log(this.trackSegments);
      if (this.trackSegments) {
        const segment = elements[0].index;
        const segmentData = this.trackSegments.value();
        if (segmentData) {
          console.log(segmentData[segment]);
        }
      }
      // Assumes that both datasets have the same amount of points
    }
  }
}
