import { Component, signal, WritableSignal } from '@angular/core';
import { MapComponent } from './map/map.component';
import { DrawerModule } from 'primeng/drawer'
import { ButtonModule } from 'primeng/button'
import { CommonModule } from '@angular/common';
import { TreeModule } from 'primeng/tree';
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
  mapTrackMode : string|TrackNoPoints= "latest"
  private tracks!: Array<TrackNoPoints>

  constructor(private trackService: TrackService){

  }

  toggleSideBar() {
    this.isExpanding = !this.isExpanding;
  }
  ngOnInit() {
    this.files = this.getTreeNodesData()
    this.trackService.getAllTracks().then(tracks => {
      this.tracks = tracks;
      console.log("Received Tracks")
      console.log(tracks)
    }).then(()=>{
      setTimeout(()=>{
        console.log("Showing single track")
        this.mapTrackMode = this.tracks[0]
        //this.mapTrackMode.set(this.tracks[0])
        setTimeout(() =>{
          console.log("subscribing to latest track")
          this.mapTrackMode = "latest"
          //this.mapTrackMode.set("latest")
        },20000)
      }, 20000)
    })
  }

  getTreeNodesData() {
    return [
      {
        key: '0',
        label: 'Tracks',
        data: 'Documents Folder',
        icon: 'pi pi-fw pi-folder-plus',
        children: [
          {
            key: '0-0',
            label: 'Work',
            data: 'Work Folder',
            icon: 'pi pi-fw pi-cog',
            children: [
              { key: '0-0-0', label: 'Expenses.doc', icon: 'pi pi-fw pi-file', data: 'Expenses Document' },
              { key: '0-0-1', label: 'Resume.doc', icon: 'pi pi-fw pi-file', data: 'Resume Document' }
            ]
          },
          {
            key: '0-1',
            label: 'Home',
            data: 'Home Folder',
            icon: 'pi pi-fw pi-home',
            children: [{ key: '0-1-0', label: 'Invoices.txt', icon: 'pi pi-fw pi-file', data: 'Invoices for this month' }]
          }
        ]
      },

    ];
  }
}
