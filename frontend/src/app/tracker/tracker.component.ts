import {
  Component,
  signal,
  WritableSignal,
  linkedSignal,
  resource,
  effect,
  input,
  Signal,
} from '@angular/core';
import { MapComponent } from './map/map.component';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { TrackNoPoints } from './map/trackNoPoints';
import { TrackService } from '../services/track.service';
import { DateTimeFormatter, LocalDateTime } from '@js-joda/core';

@Component({
  selector: 'app-tracker',
  imports: [MapComponent, DrawerModule, ButtonModule, CommonModule, TreeModule],
  templateUrl: './tracker.component.html',
  styleUrl: './tracker.component.css',
})
export class TrackerComponent {
  trackId = input.required({
    transform: (id: string | undefined) => id ?? 'latest',
  });

  groupMode: WritableSignal<boolean> = signal(false);
  modeswitchText: Signal<string> = linkedSignal(() => {
    if (this.groupMode()) {
      return 'Show Categories';
    } else {
      return 'Show Groups';
    }
  });
  title = 'angular-leaflet-example';
  isExpanding = false;
  selection: WritableSignal<any> = signal(null);
  mapTrackMode: WritableSignal<string | TrackNoPoints[] | null> = linkedSignal<
    string | TrackNoPoints[] | null
  >(() => {
    const selection = this.selection();
    console.log('Selection changed: ' + selection);
    if (selection) {
      const data = selection.data;
      if (data) {
        if (data === 'latest') {
          return 'latest';
        } else {
          console.log(data instanceof TrackNoPoints);
          console.log(data instanceof Array);
          if (data instanceof TrackNoPoints) {
            return [data];
          } else {
            if (data instanceof Array) {
              return data as Array<TrackNoPoints>;
            } else {
              return null;
            }
          }
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  });
  private first: boolean = true;
  constructor(private trackService: TrackService) {
    effect(() => {
      if (this.tracksSignal().length > 0)
        if (this.first) {
          this.first = false;
          const found = this.findTreeNode(this.trackId());
          found === undefined
            ? this.selection.set(this.tracksSignal()[0])
            : this.selection.set(found);
        }
    });
  }

  private findTreeNode(searchData: string): TreeNode<any> | undefined {
    return this.flattenTreeNodes(this.tracksSignal()).find((treeNode) =>
      treeNode.data instanceof TrackNoPoints
        ? treeNode.data.uuid === searchData
        : treeNode.data === searchData,
    );
  }

  private flattenTreeNodes(treeNodes: TreeNode[]): TreeNode[] {
    return treeNodes
      .flatMap((treeNode) => [
        treeNode,
        treeNode.children === undefined
          ? []
          : this.flattenTreeNodes(treeNode.children),
      ])
      .flat();
  }

  private trackResource = resource({
    loader: ({ abortSignal }): Promise<Array<TrackNoPoints>> => {
      console.log('trying to load resource');
      const promise = this.trackService.getAllTracks(abortSignal);
      return promise;
    },
  });

  tracksSignal: Signal<TreeNode[]> = linkedSignal(() => {
    const value = this.trackResource.value();
    if (value !== undefined) {
      const sorted = value.sort((a, b) => {
        return b.startTimestamp.compareTo(a.startTimestamp);
      });
      if (this.groupMode()) {
        return this.generateGroupsTreeNodeData(sorted);
      } else {
        return this.generateTreeNodesData(sorted);
      }
    } else {
      return [];
    }
  });

  toggleSideBar() {
    this.isExpanding = !this.isExpanding;
  }

  generateTreeNodesData(tracks: TrackNoPoints[]): TreeNode[] {
    const categoryMap = new Map<string, Map<string, Array<TrackNoPoints>>>();
    const formatter = DateTimeFormatter.ofPattern('yyyy-MM'); // 4/28/2018

    tracks.forEach((track) => {
      const month = LocalDateTime.ofInstant(track.startTimestamp).format(
        formatter,
      );
      const trackMap = categoryMap.get(track.category);
      if (trackMap === undefined) {
        const map = new Map<string, Array<TrackNoPoints>>();
        map.set(month, new Array(track));
        categoryMap.set(track.category, map);
      } else {
        const array = trackMap.get(month);
        if (array === undefined) {
          trackMap.set(month, new Array(track));
        } else {
          array.push(track);
        }
      }
    });

    const categoryNodes = new Array<TreeNode>();
    let categoryIndex = 1;
    for (const categoryEntry of categoryMap) {
      const category = categoryEntry[0];
      const monthMap = categoryEntry[1];
      const monthNodes = new Array<TreeNode>();
      let monthIndex = 1;
      for (const monthEntry of monthMap) {
        const trackNodes = monthEntry[1].map((track, trackIndex) => {
          return {
            key: '1-' + categoryIndex + '-' + monthIndex + '-' + trackIndex,
            label: track.startTimestamp.toString(),
            data: track,
            icon: 'pi pi-fw pi-cog',
          };
        });
        monthNodes.push({
          key: '1-' + categoryIndex + '-' + monthIndex++,
          label: monthEntry[0],
          data: monthEntry[1],
          icon: 'pi pi-fw pi-cog',
          children: trackNodes,
        });
      }
      categoryNodes.push({
        key: '1-' + categoryIndex++,
        label: category,
        data: Array.from(categoryEntry[1].values()).flat(),
        icon: 'pi pi-fw pi-cog',
        children: monthNodes,
      });
    }

    return [
      {
        key: '0',
        label: 'Current track',
        data: 'latest',
        icon: 'pi pi-fw pi-cog',
      },
      {
        key: '1',
        label: 'Tracks',
        data: tracks,
        icon: 'pi pi-fw pi-folder-plus',
        children: categoryNodes,
      },
    ];
  }

  generateGroupsTreeNodeData(tracks: TrackNoPoints[]): TreeNode[] {
    const trackMap = new Map<string, Array<TrackNoPoints>>();
    tracks.forEach((track) => {
      const group = track.group?.name ?? 'No Group';
      const array = trackMap.get(group);
      if (array === undefined) {
        trackMap.set(group, new Array(track));
      } else {
        array.push(track);
      }
    });

    let categoryIndex = 1;
    const monthMap = trackMap;
    const groupNodes = new Array<TreeNode>();
    let monthIndex = 1;
    for (const monthEntry of monthMap) {
      const trackNodes = monthEntry[1].map((track, trackIndex) => {
        return {
          key: '1-' + categoryIndex + '-' + monthIndex + '-' + trackIndex,
          label: track.startTimestamp.toString(),
          data: track,
          icon: 'pi pi-fw pi-cog',
        };
      });
      groupNodes.push({
        key: '1-' + categoryIndex + '-' + monthIndex++,
        label: monthEntry[0],
        data: monthEntry[1],
        icon: 'pi pi-fw pi-cog',
        children: trackNodes,
      });
    }

    return [
      {
        key: '0',
        label: 'Current track',
        data: 'latest',
        icon: 'pi pi-fw pi-cog',
      },
      {
        key: '1',
        label: 'Tracks',
        data: tracks,
        icon: 'pi pi-fw pi-folder-plus',
        children: groupNodes,
      },
    ];
  }

  switchGroupMode() {
    this.groupMode.update((oldValue) => !oldValue);
  }
}
