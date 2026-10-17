import {
  Component,
  linkedSignal,
  model,
  ModelSignal,
  resource,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { SelectorComponent } from '../selector/selector.component';
@Component({
  selector: 'app-merger',
  imports: [
    SelectModule,
    FormsModule,
    ButtonModule,
    RouterLink,
    SelectorComponent,
  ],
  templateUrl: './merger.component.html',
  styleUrl: './merger.component.css',
})
export class MergerComponent {
  firstTrack: string | undefined = undefined;
  secondTrack: string | undefined = undefined;
  test() {}
}
