import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { FlexLayoutModule } from "@angular/flex-layout";
import { NavBarModule } from "./nav-bar/nav-bar.module";
import { FooterModule } from "./home-page/footer/footer.module";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [FlexLayoutModule, RouterOutlet, NavBarModule, FooterModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "portfolio-site";
}
