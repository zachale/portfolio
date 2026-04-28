import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { FlexLayoutModule } from "@angular/flex-layout";
import { NavBarModule } from "./nav-bar/nav-bar.module";
import { FooterModule } from "./home-page/footer/footer.module";
import { BackgroundTeardropsComponent } from "./background-teardrops/background-teardrops.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    FlexLayoutModule,
    RouterOutlet,
    NavBarModule,
    FooterModule,
    BackgroundTeardropsComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "portfolio-site";
}
