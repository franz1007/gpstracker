import {
  Component,
  linkedSignal,
  model,
  ModelSignal,
  resource,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { TrackGroup, TrackNoPoints } from '../tracker/map/trackNoPoints';
import { TrackService } from '../services/track.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { SegmentmapComponent } from '../trackdetails/segmentmap/segmentmap.component';
import { Feature, LineString, Position } from 'geojson';
@Component({
  selector: 'app-selector',
  imports: [
    SelectModule,
    FormsModule,
    ButtonModule,
    RouterLink,
    SegmentmapComponent,
  ],
  templateUrl: './selector.component.html',
  styleUrl: './selector.component.css',
})
export class SelectorComponent {
  trackId: ModelSignal<string | undefined> = model();
  selectedSegment: WritableSignal<number> = signal(-1);

  categories = ['CYCLING', 'RUNNING'];
  track = resource({
    params: () => this.trackId(),
    loader: ({ params }): Promise<TrackNoPoints> => {
      console.log('trying to load resource');
      const promise = this.trackService.getTrackNoPoints(params);
      return promise;
    },
  }).asReadonly();

  trackGeoJson = resource({
    params: () => this.track.value(),
    loader: ({ params, abortSignal }): Promise<Feature<LineString>> => {
      console.log('getting TrackGeoJson resource');
      return this.trackService.getTrackGeoJson(params);
    },
  });

  allTracks = resource({
    loader: ({ abortSignal }): Promise<TrackNoPoints[]> => {
      return this.trackService.getAllTracks(abortSignal).then((tracks) => {
        return tracks.sort((a, b) =>
          a.startTimestamp.compareTo(b.startTimestamp),
        );
      });
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
    trackService.getTrackCategories().then((result) => {
      this.categories = result;
    });
    trackService.getAllGroups().then((result) => {
      this.groups.set(result);
    });
  }

  nextTrack() {
    this.trackId.update((current) => {
      const tracks = this.allTracks.value();
      if (tracks) {
        if (current === undefined) {
          return tracks[0].uuid;
        } else {
          const currentIndex = tracks.findIndex(
            (track) => track.uuid === current,
          );
          if (currentIndex === tracks.length - 1) return tracks[0].uuid;
          else return tracks[currentIndex + 1].uuid;
        }
      } else {
        return undefined;
      }
    });
  }
}
