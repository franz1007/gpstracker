import { Component, effect, resource } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TrackMetadata } from '../tracker/map/trackNoPoints';
import { TrackService } from '../services/track.service';
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
  categories = ["CYCLING", "RUNNING"];


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
      loader: ({ request, abortSignal }): Promise<Array<TrackMetadata>> => {
        console.log("trying to load resource")
        const promise = this.trackService.getAllTracksWithMetadata(abortSignal);
        return promise
      },
    }
  ).asReadonly()
  tracks: Array<TrackMetadata> = new Array<TrackMetadata>()

  constructor(private trackService: TrackService) {
    effect(() => {
      console.log("effect")
      const value = this.tracksResource.value()
      if (value !== undefined) {
        this.tracks = value;
      }
    })
    trackService.getTrackCategories().then(result => this.categories = result)

  }
}
