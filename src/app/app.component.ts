import { Component } from '@angular/core';
import { MapComponent } from './map/map.component';
@Component({
    selector: 'app-root',
    imports: [MapComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angular-leaflet-example';
}
