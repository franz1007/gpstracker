import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { TextareaModule } from 'primeng/textarea';
import { Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
@Component({
  selector: 'app-creator',
  imports: [
    StepperModule,
    ButtonModule,
    TextareaModule,
    ReactiveFormsModule,
    InputTextModule,
  ],
  templateUrl: './creator.component.html',
  styleUrl: './creator.component.css',
})
export class CreatorComponent {
  campsiteForm = new FormGroup({
    siteName: new FormControl('', Validators.required),
    siteDescription: new FormControl('', Validators.required),
  });
  onSubmit() {
    console.log(this.campsiteForm.value);
  }
}
