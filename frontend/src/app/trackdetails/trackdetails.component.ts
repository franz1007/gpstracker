import {
  Component,
  effect,
  input,
  InputSignal,
  signal,
  WritableSignal,
} from '@angular/core';
import { UIChart } from 'primeng/chart';
import { TrackService } from '../services/track.service';
import { RouterLink } from '@angular/router';
import { Chart, ChartEvent, plugins } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionModule,
  AccordionPanel,
} from 'primeng/accordion';

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
export class TrackdetailsComponent {
  trackId: InputSignal<string> = input.required<string>();
  constructor(private trackService: TrackService) {
    Chart.register(zoomPlugin);
    effect(() => {
      const id = this.trackId();
      this.setTrack(id);
    });
  }

  private zoomOptions = {
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

  data = {};
  elevationData = {};
  linearOptions = {
    scales: {
      x: {
        type: 'linear',
      },
    },
    plugins: {
      zoom: this.zoomOptions,
    },
  };
  elevationOptions = {
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
  private setTrack(trackId: string) {
    this.trackService.getTrackNoPoints(trackId).then((track) => {
      this.trackService.getSegmentMetadata(track.uuid).then((metadata) => {
        console.log(metadata);
        const durations = metadata.map((value, index) => {
          return {
            x: index,
            y: value.duration.seconds(),
          };
        });
        this.data = {
          datasets: [
            {
              label: 'Duration',
              data: durations,
              fill: false,
              tension: 0.4,
            },
            {
              label: 'Distance',
              data: metadata.map((value, index) => {
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
      });
      const distancePromise = this.trackService.getPointMetadata(track.uuid);
      const geoJsonPromise = this.trackService.getTrackGeoJsonPromise(track);
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
