import { Component } from '@angular/core';
import { provideRouter, RouterOutlet } from '@angular/router';
import {FlexLayoutModule} from "@angular/flex-layout";
import { NavBarModule } from './nav-bar/nav-bar.module';
import { routes } from './app.routes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports:[FlexLayoutModule,RouterOutlet, NavBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'portfolio-site';
}
