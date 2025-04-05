import { Component, computed, effect, linkedSignal, resource, Signal, WritableSignal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TrackNoPoints } from '../tracker/map/trackNoPoints';
import { TrackService } from '../tracker/map/services/track.service';

@Component({
  selector: 'app-trackmanager',
  imports: [TableModule],
  templateUrl: './trackmanager.component.html',
  styleUrl: './trackmanager.component.css'
})
export class TrackmanagerComponent {
  tracksResource = resource(
    {
      loader: ({ request, abortSignal }): Promise<Array<TrackNoPoints>> => {
        console.log("trying to load resource")
        const promise = this.trackService.getAllTracks(abortSignal);
        return promise
      },
    }
  ).asReadonly()
  tracks: Array<TrackNoPoints> = new Array<TrackNoPoints>()

  constructor(private trackService: TrackService) {
    effect(() => {
      const value = this.tracksResource.value()
      if (value !== undefined) {
        this.tracks = value;
      }
    })
  }
}
