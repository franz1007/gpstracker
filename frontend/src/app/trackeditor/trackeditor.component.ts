import {
  Component,
  input,
  InputSignal,
  linkedSignal,
  model,
  ModelSignal,
  resource,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import {
  SegmentMetadata,
  TrackGroup,
  TrackMetadata,
  TrackNoPoints,
} from '../tracker/map/trackNoPoints';
import { TrackService } from '../services/track.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { SegmentmapComponent } from '../trackdetails/segmentmap/segmentmap.component';
import { Feature, LineString, Position } from 'geojson';
import { UIChart } from 'primeng/chart';
import zoomPlugin from 'chartjs-plugin-zoom';
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
import { ZoomPluginOptions } from 'chartjs-plugin-zoom/types/options';
@Component({
  selector: 'app-trackeditor',
  imports: [
    UIChart,
    SelectModule,
    FormsModule,
    ButtonModule,
    RouterLink,
    SegmentmapComponent,
  ],
  templateUrl: './trackeditor.component.html',
  styleUrl: './trackeditor.component.css',
})
export class TrackeditorComponent {
  trackId: ModelSignal<string> = model.required<string>();

  categories = ['CYCLING', 'RUNNING'];
  track = resource({
    params: () => ({ id: this.trackId() }),
    loader: ({ params }): Promise<TrackNoPoints> => {
      console.log('trying to load resource');
      const promise = this.trackService.getTrackNoPoints(params.id);
      return promise;
    },
  }).asReadonly();

  trackGeoJson = resource({
    params: () => ({ track: this.track.value() }),
    loader: ({ params, abortSignal }): Promise<Feature<LineString>> => {
      console.log('getting TrackGeoJson resource');
      return this.trackService.getTrackGeoJson(params.track!);
    },
  });

  trackSegments = resource({
    params: () => ({ id: this.trackId() }),
    loader: ({ params, abortSignal }): Promise<SegmentMetadata[] | null> => {
      return this.trackService.getSegmentMetadata(params.id, abortSignal);
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

  nextTodo = resource({
    params: () => ({ id: this.trackId() }),
    loader: ({ params, abortSignal }): Promise<TrackTodo | null> => {
      const next = this.trackService
        .getAllTracks(abortSignal)
        .then((tracks) => {
          const todo = tracks.filter(
            (item) =>
              item.uuid !== this.trackId() &&
              (item.category === 'UNCATEGORIZED' || item.group === null),
          );
          console.log(tracks);
          console.log(todo);
          tracks.forEach((t) => console.log(t.group));
          if (todo.length > 0) {
            return new TrackTodo(
              todo[0].uuid,
              'Next Todo (' + todo.length + ' left)',
              ['/edit', todo[0].uuid],
            );
          } else {
            return null;
          }
        });
      return next;
    },
  }).asReadonly();

  groups: WritableSignal<Array<TrackGroup>> = signal([]);
  groupNames: Signal<Array<String>> = linkedSignal(() => {
    return this.groups().map((group) => group.name);
  });

  mapTrack = linkedSignal(() => {
    const t = this.track.value();
    if (t) {
      return [t];
    } else {
      return null;
    }
  });

  constructor(private trackService: TrackService) {
    Chart.register(this.myPlugin);
    Chart.register(zoomPlugin);
    trackService.getTrackCategories().then((result) => {
      this.categories = result;
    });
    trackService.getAllGroups().then((result) => {
      this.groups.set(result);
    });
  }

  //todo force refresh
  //todo group creation
  //todo update (uuid changed) for resource
  onCategoryChange(value: string) {
    console.log('category of track changed');
    console.log(value);
    const t = this.track.value();
    if (t) {
      if (this.categories.includes(value)) {
        this.trackService.updateCategory(t.uuid, value).then((result) => {
          if (result != null) {
            this.trackId.set(result.uuid);
            console.log('new category: ' + result.category);
            history.replaceState(
              null,
              '',
              new URL(result.uuid, window.location.href).href,
            );
          }
        });
      } else {
        //TODO invalid values
      }
    } else {
      console.error('error: Track not set, is required resource');
    }
  }
  onGroupChange(value: string) {
    console.log('group of track changed');
    console.log(value);
    const t = this.track.value();
    if (t) {
      const newGroup = this.groups().find((group) => group.name === value);
      if (newGroup) {
        this.trackService.setGroup(t.uuid, newGroup.uuid).then((result) => {
          if (result !== null) {
            this.trackId.set(result.uuid);
            console.log('new group: ' + result.category);
            history.replaceState(
              null,
              '',
              new URL(result.uuid, window.location.href).href,
            );
          }
        });
      } else {
        //TODO invalid values
      }
    } else {
      console.error('error: Track not set, is required resource');
    }
  }

  newGroupName: Signal<string> = signal('');
  onGroupCreate() {
    const newName = this.newGroupName();
    if (
      this.groups()
        .map((group) => group.name)
        .includes(newName)
    ) {
      alert('A group with this name already exists');
    } else {
      this.trackService.createGroup(newName).then((result) => {
        this.groups.update((oldValue) => [result, ...oldValue]);
      });
    }
  }

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
