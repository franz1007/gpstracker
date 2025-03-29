import { Component } from '@angular/core';
import { MapComponent } from './map/map.component';
import { DrawerModule } from 'primeng/drawer'
import { ButtonModule } from 'primeng/button'
@Component({
    selector: 'app-root',
    imports: [MapComponent, DrawerModule, ButtonModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  visible = true
  title = 'angular-leaflet-example';
}
