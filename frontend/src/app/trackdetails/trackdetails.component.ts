import { Component, effect, input, InputSignal, signal, WritableSignal } from '@angular/core';
import {  UIChart } from 'primeng/chart';
import { TrackService } from '../services/track.service';
import { TrackMetadata, TrackNoPoints } from '../tracker/map/trackNoPoints';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-trackdetails',
  imports: [UIChart, RouterLink],
  templateUrl: './trackdetails.component.html',
  styleUrl: './trackdetails.component.css',
})
export class TrackdetailsComponent {

  trackId : InputSignal<string> = input.required<string>();
  constructor(private trackService: TrackService) {
    effect(() => {
      const id = this.trackId()
      this.setTrack(id)
    })
  }

  dataSignal: WritableSignal<any> = signal(null)
  data = {};
  elevationData = {}
  options = {
    scales: {
      x: {
        type: "linear"
      }
    }
  };
  private setTrack(trackId: string){
    this.trackService.getTrackNoPoints(trackId).then(track => {
      this.trackService.getSegmentMetadata(track.uuid).then(metadata => {
        console.log(metadata)
        const durations = metadata.map((value, index) => {
          return {
            x: index,
            y: value.duration.seconds()
          }
        })
        this.data = {
          datasets: [
          {
            label: 'Duration',
            data: durations,
            fill: false,
            tension: 0.4
          },
          {
            label: 'Distance',
            data: metadata.map((value, index) => {
              return {
                x: index,
                y: value.distance
              }}),
              fill: false,
              tension: 0.4
          }]
        }
      })
      this.trackService.getTrackGeoJsonPromise(track).then(metadata => {
        console.log(metadata)
        const heights = metadata.geometry.coordinates.map((coord,index) => {
          return {
            x: index,
            y: coord[2]
          }
        })
        this.elevationData = {
          datasets: [
          {
            label: 'Elevation',
            data: heights,
            fill: false,
            tension: 0.4
          }]
        }
      })
    })
  }
  selected(ev: Event){
    console.log(ev)
  }
}
