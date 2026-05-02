import {
  Component,
  input,
  InputSignal,
  linkedSignal,
  resource,
  WritableSignal,
} from '@angular/core';
import { TrackMetadata, TrackNoPoints } from '../tracker/map/trackNoPoints';
import { TrackService } from '../services/track.service';
import { MapComponent } from '../tracker/map/map.component';

@Component({
  selector: 'app-trackeditor',
  imports: [MapComponent],
  templateUrl: './trackeditor.component.html',
  styleUrl: './trackeditor.component.css',
})
export class TrackeditorComponent {
  trackId: InputSignal<string> = input.required<string>();

  track = resource({
    loader: (): Promise<TrackNoPoints> => {
      const id = this.trackId();
      console.log('trying to load resource');
      const promise = this.trackService.getTrackNoPoints(id);
      return promise;
    },
  }).asReadonly();

  mapTrack = linkedSignal(() => {
    const t = this.track.value();
    if (t) {
      return [t];
    } else {
      return null;
    }
  });

  constructor(private trackService: TrackService) {}
}
