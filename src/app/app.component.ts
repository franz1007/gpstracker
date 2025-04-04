import { Component } from '@angular/core';
import { TrackerComponent } from "./tracker/tracker.component";

@Component({
  selector: 'app-root',
  template: `
    <app-tracker>
  `,
  imports: [TrackerComponent],
})
export class AppComponent { }
