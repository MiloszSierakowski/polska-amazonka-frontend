import { Component } from '@angular/core';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { CategoriesComponent } from '../../components/categories/categories.component';
import { DiscountSectionComponent } from '../../components/discount-section/discount-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    SearchBarComponent,
    DiscountSectionComponent,
    CategoriesComponent
  ]
})
export class HomeComponent {}
