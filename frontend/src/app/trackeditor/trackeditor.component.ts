import {
  Component,
  input,
  InputSignal,
  linkedSignal,
  model,
  ModelSignal,
  resource,
  Signal,
  WritableSignal,
} from '@angular/core';
import { TrackMetadata, TrackNoPoints } from '../tracker/map/trackNoPoints';
import { TrackService } from '../services/track.service';
import { MapComponent } from '../tracker/map/map.component';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trackeditor',
  imports: [MapComponent, SelectModule, FormsModule],
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
}
