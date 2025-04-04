import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-root',
  template: `
    <p-menubar [model]="items">
        <ng-template  #item let-item>
            <ng-container *ngIf="item.route; else urlRef">
                <a [routerLink]="item.route" class="p-menubar-item-link">
                    <span [class]="item.icon"></span>
                    <span class="ml-2">{{ item.label }}</span>
                </a>
            </ng-container>
            <ng-template #urlRef>
                <a *ngIf="item.url; else noLink" [href]="item.url" class="p-menubar-item-link">
                    <span [class]="item.icon"></span>
                    <span class="ml-2">{{ item.label }}</span>
                </a>
            </ng-template>
            <ng-template #noLink>
                <div class="p-menubar-item-link">
                    <span [class]="item.icon"></span>
                    <span class="ml-2">{{ item.label }}</span>
                    <span class="pi pi-fw pi-angle-down ml-2"></span>
                </div>
            </ng-template>
        </ng-template>
    </p-menubar>
    <router-outlet />
  `,
  styleUrl: './app.component.css',
  imports: [RouterOutlet, RouterLink, Menubar, CommonModule],
})
export class AppComponent {
  constructor(private router: Router) { }
  items = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      route: '/'
    },
    {
      label: 'Map',
      icon: 'pi pi-palette',
      route: '/tracker'
    },
  ];
}
