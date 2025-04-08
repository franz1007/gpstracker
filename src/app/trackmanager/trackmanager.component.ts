import { Component, computed, effect, linkedSignal, resource, Signal, WritableSignal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TrackNoPoints, TrackWithMetadata } from '../tracker/map/trackNoPoints';
import { TrackService } from '../tracker/map/services/track.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';


@Component({
  selector: 'app-trackmanager',
  imports: [TableModule, SelectModule, FormsModule, TagModule],
  templateUrl: './trackmanager.component.html',
  styleUrl: './trackmanager.component.css'
})
export class TrackmanagerComponent {
  categories = [
    { label: 'CYCLING', value: 'CYCLING' },
    { label: 'RUNNING', value: 'RUNNING' },
];
  

getSeverity(status: string) {
  switch (status) {
      case 'CYCLING':
          return 'CYCLING';

      case 'RUNNING':
          return 'RUNNING';
          default: return "test"
  }
}

  tracksResource = resource(
    {
      loader: ({ request, abortSignal }): Promise<Array<TrackWithMetadata>> => {
        console.log("trying to load resource")
        const promise = this.trackService.getAllTracksWithMetadata(abortSignal);
        return promise
      },
    }
  ).asReadonly()
  tracks: Array<TrackWithMetadata> = new Array<TrackWithMetadata>()

  constructor(private trackService: TrackService) {
    effect(() => {
      console.log("effect")
      const value = this.tracksResource.value()
      if (value !== undefined) {
        this.tracks = value;
      }
    })
    
  }
}
