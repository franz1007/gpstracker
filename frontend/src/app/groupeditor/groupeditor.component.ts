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
import { TrackService } from '../services/track.service';
import { TrackGroup } from '../tracker/map/trackNoPoints';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
@Component({
  selector: 'app-groupeditor',
  imports: [SelectModule, FormsModule, ButtonModule],
  templateUrl: './groupeditor.component.html',
  styleUrl: './groupeditor.component.css',
})
export class GroupeditorComponent {
  constructor(private trackService: TrackService) {
    trackService.getAllGroups().then((result) => {
      this.groups.set(result);
    });
  }

  groupId: ModelSignal<string> = model.required<string>();
  groups: WritableSignal<Array<TrackGroup>> = signal([]);
  newGroupName: Signal<string> = signal('');
  onGroupCreate() {
    const newName = this.newGroupName();
    if (
      this.groups()
        .map((group) => group.name)
        .includes(newName)
    ) {
      alert('A group with this name already exists');
    } else {
      this.trackService.createGroup(newName).then((result) => {
        this.groups.update((oldValue) => [result, ...oldValue]);
      });
    }
  }

  group: Signal<TrackGroup | null> = linkedSignal(() => {
    console.log('groupSignal: ' + this.groupId());
    console.log('groupSignal: ' + this.groups());
    const g = this.groups().find((group) => group.uuid === this.groupId());
    if (g) return g;
    else return null;
  });

  groupName: Signal<string> = linkedSignal(() => {
    console.log('groupNameSIgnal: ' + this.group());
    return this.group()?.name ?? '';
  });

  onGroupRename() {
    const newName = this.groupName();
    console.log('Rename clicked: ' + newName);
    const id = this.group()?.uuid;
    if (id)
      if (
        this.groups()
          .map((group) => group.name)
          .includes(newName)
      ) {
        alert('A group with this name already exists');
      } else {
        this.trackService.renameGroup(id, newName).then((result) => {
          this.groups.update((oldValue) => {
            const filtered = oldValue.filter((g) => g.uuid !== id);
            return [result, ...filtered];
          });
        });
      }
  }
}
