import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
@Component({
  selector: 'app-campsites',
  imports: [FormsModule, RouterLink, ButtonDirective],
  templateUrl: './campsites.component.html',
  styleUrl: './campsites.component.css',
})
export class CampsitesComponent {}
