import { Component, signal, WritableSignal, linkedSignal, OnDestroy, OnInit, resource, computed, Signal, effect } from '@angular/core';
import { MapComponent } from './map/map.component';
import { DrawerModule } from 'primeng/drawer'
import { ButtonModule } from 'primeng/button'
import { CommonModule } from '@angular/common';
import { TreeModule } from 'primeng/tree';
import { TreeNode, } from 'primeng/api';
import { TrackNoPoints } from './map/trackNoPoints';
import { TrackService } from './map/services/track.service';
import { DateTimeFormatter, LocalDateTime } from '@js-joda/core';
import { httpResource } from '@angular/common/http';

@Component({
  selector: 'app-tracker',
  imports: [MapComponent, DrawerModule, ButtonModule, CommonModule, TreeModule],
  templateUrl: './tracker.component.html',
  styleUrl: './tracker.component.css'
})

export class TrackerComponent {
  title = 'angular-leaflet-example';
  isExpanding = false;
  selection: WritableSignal<any> = signal(null)
  mapTrackMode: WritableSignal<string | TrackNoPoints[] | null> = linkedSignal<string | TrackNoPoints[] | null>(() => {
    const selection = this.selection()
    console.log("Selection changed: " + selection)
    if (selection !== undefined && selection !== null) {
      const data = selection.data
      if (data !== null && data !== undefined) {
        if (data === 'latest') {
          return 'latest'
        }
        else {
          console.log(data instanceof TrackNoPoints)
          console.log(data instanceof Array)
          if (data instanceof TrackNoPoints) {
            return [data]
          }
          else {
            if (data instanceof Array) {
              return data as Array<TrackNoPoints>
            }
            else {
              return null
            }
          }
        }
      }
      else {
        return null
      }
    }
    else {
      return null
    }
  })
  private first: boolean = true
  constructor(private trackService: TrackService) {
    effect(() => {
      console.log("Effect")
      console.log(this.trackResource.status())
      console.log(this.trackResource.value())
      console.log(this.trackResource.isLoading())
      const value = this.trackResource.value()
      this.trackResource.status
      console.log("Resource value")
      console.log(value)
      if (value !== undefined) {
        const sorted = value.sort((a, b) => {
          a.startTimestamp.compareTo(b.endTimestamp)
          return a.startTimestamp.compareTo(b.startTimestamp)
        });
        console.log("Received Tracks")
        console.log(sorted)
        this.tracks = this.generateTreeNodesData(sorted)
        if(this.first){
          this.first = false;
          this.selection.set(this.tracks[0])
        }
      }
    })

  }

  private trackResource = resource(
    {
      loader: ({ request, abortSignal }): Promise<Array<TrackNoPoints>> => {
        console.log("trying to load resource")
        const promise = this.trackService.getAllTracks(abortSignal);
        return promise
      },
    }
  );
  tracks!: TreeNode[]

  toggleSideBar() {
    this.isExpanding = !this.isExpanding;
  }

  generateTreeNodesData(tracks: TrackNoPoints[]): TreeNode[] {

    const trackMap = new Map<string, Array<TrackNoPoints>>()
    const formatter = DateTimeFormatter.ofPattern('yyyy-MM') // 4/28/2018
    tracks.forEach(track => {
      const month = LocalDateTime.ofInstant(track.startTimestamp).format(formatter)
      const array = trackMap.get(month)
      if (array === undefined) {
        trackMap.set(month, new Array(track))
      }
      else {
        array.push(track)
      }
    })

    const nodes: Array<TreeNode> = new Array()

    var index = 0

    for (const entry of trackMap) {
      const children = entry[1].map((track, j) => {
        return {
          key: '1-' + index.toString() + "-" + j,
          label: track.startTimestamp.toString(),
          data: track,
          icon: 'pi pi-fw pi-cog',
        }
      })
      nodes.push(
        {
          key: '1-' + (index++),
          label: entry[0],
          data: entry[1],
          icon: 'pi pi-fw pi-cog',
          children: children
        }
      )
    }

    return [
      {
        key: '0',
        label: 'Current track',
        data: 'latest',
        icon: 'pi pi-fw pi-cog',
      },
      {
        key: '1',
        label: 'Tracks',
        data: tracks,
        icon: 'pi pi-fw pi-folder-plus',
        children: nodes
      },

    ];
  }
}
