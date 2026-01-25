import { Component, effect, resource } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TrackMetadata } from '../tracker/map/trackNoPoints';
import { TrackService } from '../services/track.service';
import { SelectChangeEvent, SelectModule } from 'primeng/select';
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


  tracksResource = resource(
    {
      loader: ({ abortSignal }): Promise<Array<TrackMetadata>> => {
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
    trackService.getTrackCategories().then(result => {
      this.categories = result;
    })

  }
  onCategoryChange(value: string, trackUuid: string) {
    console.log("category of track changed")
    console.log(value)
    console.log(trackUuid)
    const track = this.tracks.find(track => track.uuid == trackUuid)
    if (track != null) {
      if (this.categories.includes(value)) {
        this.trackService.updateCategory(trackUuid, value).then(result => {
          if (result != null) {
            console.log("new category: " + result.category)
            track.category = result.category
            track.uuid = result.uuid
          }
        })
      }
      else {
        //TODO invalid values
      }
    }
    else {
      console.error("Changed track with " + trackUuid + " not found in array")
    }
  }
}
