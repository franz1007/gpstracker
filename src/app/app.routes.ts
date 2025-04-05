import {Routes} from '@angular/router';
import { TrackerComponent } from './tracker/tracker.component';
import { TrackmanagerComponent } from './trackmanager/trackmanager.component';


export const routes: Routes = [
  {
    path: 'tracker',
    title: 'Tracker',
    component: TrackerComponent,
  },
  {
    path: 'trackmanager',
    title: 'Trackmanager',
    component: TrackmanagerComponent
  }
];
