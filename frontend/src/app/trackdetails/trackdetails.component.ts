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
  ChartType,
  Plugin,
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
import { SegmentmapComponent } from './segmentmap/segmentmap.component';

@Component({
  selector: 'app-trackdetails',
  imports: [
    UIChart,
    RouterLink,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    Accordion,
    SegmentmapComponent,
  ],
  templateUrl: './trackdetails.component.html',
  styleUrl: './trackdetails.component.css',
})
export class TrackdetailsComponent {
  trackId: InputSignal<string> = input.required<string>();

  constructor(private trackService: TrackService) {
    Chart.register(this.myPlugin);
    Chart.register(zoomPlugin);
    effect(() => {
      const id = this.trackId();
      this.selectedSegment.set(-1);
      this.clickedSegment.set(-1);
      this.setTrack(id);
    });
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
            yAxisID: 'y1',
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
            yAxisID: 'y',
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

  clickedSegment: WritableSignal<number> = signal(-1);

  linearOptions: ChartOptions = {
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
    onClick: (event: ChartEvent, elements: ActiveElement[], chart: Chart) => {
      console.log(elements[0].index);
      if (elements.length > 0) {
        this.clickedSegment.set(elements[0].index);
      }
    },
  };

  myPlugin: Plugin = {
    id: 'leaveinterceptor',
    beforeEvent: (chart, args, pluginOptions) => {
      const event = args.event;
      if (event.type === 'mouseout') {
        console.log('mouseout');
        const clicked = this.clickedSegment();
        if (clicked !== -1) this.selectedSegment.set(clicked);
        // process the event
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
}
