import { Component } from '@angular/core';
import { MapComponent } from './map/map.component';
import { DrawerModule } from 'primeng/drawer'
import { ButtonModule } from 'primeng/button'
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  imports: [MapComponent, DrawerModule, ButtonModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angular-leaflet-example';
  isExpanding = false;
  toggleSideBar() {
    this.isExpanding = !this.isExpanding;
  }
}
