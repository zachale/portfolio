import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FlexLayoutModule} from "@angular/flex-layout";
import { NavBarModule } from './nav-bar/nav-bar.module';
import { NzButtonModule } from 'ng-zorro-antd/button';


@Component({
  selector: 'app-root',
  standalone: true,
  imports:[FlexLayoutModule, RouterOutlet, NavBarModule, NzButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'portfolio-site';
}
