import {Routes} from '@angular/router';
import { TrackerComponent } from './tracker/tracker.component';
import { TrackmanagerComponent } from './trackmanager/trackmanager.component';


export const routes: Routes = [
  {
    path: 'map',
    title: 'Tracker',
    component: TrackerComponent,
  },
  {
    path: 'map/:trackId',
    title: 'Tracker',
    component: TrackerComponent,
  },
  {
    path: 'trackmanager',
    title: 'Trackmanager',
    component: TrackmanagerComponent
  },
  {
    path: '**',
    redirectTo: '/map',
  }
];
