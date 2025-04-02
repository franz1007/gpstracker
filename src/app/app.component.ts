import { Component, signal, WritableSignal, InputSignal, input, effect, computed, Signal, linkedSignal } from '@angular/core';
import { MapComponent } from './map/map.component';
import { DrawerModule } from 'primeng/drawer'
import { ButtonModule } from 'primeng/button'
import { CommonModule } from '@angular/common';
import { TreeModule, TreeNodeSelectEvent } from 'primeng/tree';
import { TreeNode, } from 'primeng/api';
import { TrackNoPoints } from './map/trackNoPoints';
import { TrackService } from './map/services/track.service';
import { DateTimeFormatter, LocalDateTime, YearMonth } from '@js-joda/core';



@Component({
  selector: 'app-root',
  imports: [MapComponent, DrawerModule, ButtonModule, CommonModule, TreeModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angular-leaflet-example';
  files!: TreeNode[];
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
  private tracks!: Array<TrackNoPoints>

  constructor(private trackService: TrackService) {

  }

  toggleSideBar() {
    this.isExpanding = !this.isExpanding;
  }
  ngOnInit() {
    this.trackService.getAllTracks().then(tracks => {

      this.tracks = tracks.sort((a, b) => {
        a.startTimestamp.compareTo(b.endTimestamp)
        return a.startTimestamp.compareTo(b.startTimestamp)
      });
      console.log("Received Tracks")
      console.log(this.tracks)
    }).then(() => {
      this.files = this.getTreeNodesData()
      this.selection.set(this.files[0])
    })
  }

  getTreeNodesData() {

    const trackMap = new Map<string, Array<TrackNoPoints>>()
    const formatter = DateTimeFormatter.ofPattern('yyyy-MM') // 4/28/2018
    this.tracks.forEach(track => {
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
        data: this.tracks,
        icon: 'pi pi-fw pi-folder-plus',
        children: nodes
      },

    ];
  }
}
