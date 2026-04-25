import { Component, signal, WritableSignal } from '@angular/core';
import {  UIChart } from 'primeng/chart';
import { TrackService } from '../services/track.service';
import { TrackMetadata, TrackNoPoints } from '../tracker/map/trackNoPoints';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-trackdetails',
  imports: [UIChart],
  templateUrl: './trackdetails.component.html',
  styleUrl: './trackdetails.component.css',
})
export class TrackdetailsComponent {

  constructor(private trackService: TrackService) {
    this.setTrack("f0c85ae2-e7ff-401c-a42d-5033ce508ada")
  }

  dataSignal: WritableSignal<any> = signal(null)
  data = {
  };
  options = {
    scales: {
      x: {
        type: "linear"
      }
    }
  };
  private setTrack(trackId: string){
    this.trackService.getTrackNoPoints(trackId).then(track => {
      this.trackService.getTrackGeoJsonPromise(track).then(metadata => {
        console.log(metadata)
        const heights = metadata.geometry.coordinates.map((coord,index) => {
          return {
            x: index,
            y: coord[2]
          }
        })
        console.log(heights)
        const data = {
          datasets: [
          {
            label: 'First Dataset',
            data: heights,
            fill: false,
            tension: 0.4
          }]
        }
        this.data = data
      })
    })
  }

}
