
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-root',
  template: `
    <p-menubar [model]="items">
      <ng-template  #item let-item>
        @if (item.route) {
          <a [routerLink]="item.route" class="p-menubar-item-link">
            <span [class]="item.icon"></span>
            <span class="ml-2">{{ item.label }}</span>
          </a>
        } @else {
          @if (item.url) {
            <a [href]="item.url" class="p-menubar-item-link">
              <span [class]="item.icon"></span>
              <span class="ml-2">{{ item.label }}</span>
            </a>
          } @else {
            <div class="p-menubar-item-link">
              <span [class]="item.icon"></span>
              <span class="ml-2">{{ item.label }}</span>
              <span class="pi pi-fw pi-angle-down ml-2"></span>
            </div>
          }
        }
      </ng-template>
    </p-menubar>
    <router-outlet />
    `,
  styleUrl: './app.component.css',
  imports: [RouterOutlet, RouterLink, Menubar],
})
export class AppComponent {
  constructor(private router: Router) { }
  items = [
    {
      label: 'Map',
      icon: 'pi pi-home',
      route: '/map'
    },
    {
      label: 'Trackmanager',
      icon: 'pi pi-palette',
      route: '/trackmanager'
    },
  ];
}
