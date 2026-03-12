import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-discount-section',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './discount-section.component.html',
  styleUrl: './discount-section.component.scss'
})
export class DiscountSectionComponent {

  isOpen = false;

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

}
