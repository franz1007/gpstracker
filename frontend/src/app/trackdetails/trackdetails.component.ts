import {
  Component,
  effect,
  input,
  InputSignal,
  linkedSignal,
  model,
  ModelSignal,
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
import { ButtonModule } from 'primeng/button';
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
import {
  PointMetadata,
  SegmentMetadata,
  TrackMetadata,
  TrackNoPoints,
} from '../tracker/map/trackNoPoints';
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
    ButtonModule,
  ],
  templateUrl: './trackdetails.component.html',
  styleUrl: './trackdetails.component.css',
})
export class TrackdetailsComponent {
  trackId: ModelSignal<string> = model.required<string>();

  constructor(private trackService: TrackService) {
    Chart.register(this.myPlugin);
    Chart.register(zoomPlugin);
    effect(() => {
      console.log('TrackId effect');
      const id = this.trackId();
      this.selectedSegment.set(-1);
      this.clickedSegment.set(-1);
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
  elevationData: Signal<ChartData> = linkedSignal(() => {
    const metadata = this.pointMetadata.value();
    const geoJson = this.trackGeoJson.value();
    if (metadata && geoJson) {
      const heights = geoJson.geometry.coordinates.map((coord, index) => {
        return {
          x: metadata[index].distance,
          y: coord[2],
        };
      });
      const speeds = metadata
        .filter((m) => m.speed > 0)
        .map((metadata) => {
          return {
            x: metadata.distance,
            y: metadata.speed * 3.6,
          };
        });
      return {
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
    } else {
      return {
        datasets: [],
      };
    }
  });
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
    interaction: {
      mode: 'index',
      axis: 'x',
      intersect: false,
    },
    plugins: {
      zoom: this.zoomOptions,
    },
    // Does not quite work. These datasets have points instead of segments.
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
      console.log('getting TrackGeoJson resource');
      return this.trackService.getTrackGeoJson(params.track!);
    },
  });
  pointMetadata = resource({
    params: () => ({ track: this.trackNoPoints.value() }),
    loader: ({ params, abortSignal }): Promise<PointMetadata[]> => {
      console.log('getting pointMetadata resource');
      return this.trackService.getPointMetadata(params.track!.uuid);
    },
  });
  trackMetadata = resource({
    params: () => ({ id: this.trackId() }),
    loader: ({ params, abortSignal }): Promise<TrackMetadata | null> => {
      const metadata = this.trackService.getTrackMetadata(
        params.id,
        abortSignal,
      );
      return metadata.then((metadata) => {
        console.log('metadata:');
        console.log(metadata);
        return metadata;
      });
    },
  });
  naviTracks = resource({
    params: () => ({ id: this.trackId() }),
    loader: ({
      params,
      abortSignal,
    }): Promise<[TrackNoPoints, TrackNoPoints]> => {
      return this.trackService.getAllTracks(abortSignal).then((tracks) => {
        const sorted = tracks.sort((t1, t2) => {
          const g1 = t1.group?.name;
          const g2 = t2.group?.name;
          if (g1 === g2) {
            return t1.startTimestamp.compareTo(t2.startTimestamp);
          } else {
            if (g1 === undefined) {
              return 1;
            } else if (g2 === undefined) {
              return -1;
            } else {
              return g1.localeCompare(g2);
            }
          }
        });
        console.log('sorted');
        console.log(params.id);
        console.log(sorted);
        const currentIndex = tracks.findIndex((value) => {
          return value.uuid === params.id;
        });
        console.log(currentIndex);
        if (currentIndex === tracks.length - 1) {
          return [tracks[currentIndex - 1], tracks[0]];
        } else {
          if (currentIndex === 0) {
            return [tracks[tracks.length - 1], tracks[currentIndex + 1]];
          } else {
            return [tracks[currentIndex - 1], tracks[currentIndex + 1]];
          }
        }
      });
    },
  }).asReadonly();
  nextTrack = linkedSignal(() => {
    const tracks = this.naviTracks.value();
    if (tracks) {
      const [_, track] = tracks;
      return new TrackTodo(track.uuid, 'Next', ['/details', track.uuid]);
    } else {
      return null;
    }
  });
  previousTrack = linkedSignal(() => {
    const tracks = this.naviTracks.value();
    if (tracks) {
      const [track, _] = tracks;
      return new TrackTodo(track.uuid, 'Previous', ['/details', track.uuid]);
    } else {
      return null;
    }
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

  onSplitTrack() {
    console.log('Should split');
    const segment = this.clickedSegment();
    if (segment >= 0) {
      this.trackService
        .splitTrack(this.trackId(), segment + 1)
        .then((result) => {
          this.trackId.set(result[0].uuid);
          history.replaceState(
            null,
            '',
            new URL(result[0].uuid, window.location.href).href,
          );
          console.log('new Trackid: ' + this.trackId());
        });
    }
  }
}
class TrackTodo {
  uuid: string;
  text: string;
  link: string[];
  constructor(uuid: string, text: string, link: string[]) {
    this.uuid = uuid;
    this.text = text;
    this.link = link;
  }
}
