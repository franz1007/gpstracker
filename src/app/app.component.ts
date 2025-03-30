import { Component, signal, WritableSignal, InputSignal, input, effect, computed, Signal, linkedSignal } from '@angular/core';
import { MapComponent } from './map/map.component';
import { DrawerModule } from 'primeng/drawer'
import { ButtonModule } from 'primeng/button'
import { CommonModule } from '@angular/common';
import { TreeModule, TreeNodeSelectEvent } from 'primeng/tree';
import { TreeNode, } from 'primeng/api';
import { TrackNoPoints } from './map/trackNoPoints';
import { TrackService } from './map/services/track.service';



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
  mapTrackMode: WritableSignal<string | TrackNoPoints> = linkedSignal<string | TrackNoPoints>(() => {
    const selection = this.selection()
    if (selection !== undefined && selection !== null) {
      const data = selection.data
      console.log("effect")
      console.log(selection)
      if (data !== null && data !== undefined) {
        if (data === 'latest') {
          return 'latest'
        }
        else {
          if (typeof (data.id) === 'number') {
            return data
          }
          else{
            return "latest"
          }
        }
      }
      else {
        return "latest"
      }
    }
    else {
      return "latest"
    }
  })
  private tracks!: Array<TrackNoPoints>
  selection: WritableSignal<any> = signal("test")

  constructor(private trackService: TrackService) {

  }

  toggleSideBar() {
    this.isExpanding = !this.isExpanding;
  }
  ngOnInit() {
    this.trackService.getAllTracks().then(tracks => {
      this.tracks = tracks;
      console.log("Received Tracks")
      console.log(tracks)
    }).then(() => {
      this.files = this.getTreeNodesData()
    })
  }

  getTreeNodesData() {
    const trackNodes: Array<TreeNode> = this.tracks.map((track, index) => {
      return {
        key: '0-' + (index + 1),
        label: track.startTimestamp.toString(),
        data: track,
        icon: 'pi pi-fw pi-cog',
      }
    })
    const latestNode: Array<TreeNode> = [{
      key: '0-0',
      label: 'Current track',
      data: 'latest',
      icon: 'pi pi-fw pi-cog',
    }]
    const nodes = latestNode.concat(trackNodes)
    return [

      {
        key: '1',
        label: 'Tracks',
        data: 'Tracks Folder',
        icon: 'pi pi-fw pi-folder-plus',
        children: nodes
      },

    ];
  }
}
