import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { FlexLayoutModule } from "@angular/flex-layout";
import { filter, map } from "rxjs";
import { NavBarModule } from "./nav-bar/nav-bar.module";
import { FooterModule } from "./home-page/footer/footer.module";
import { onTrackerHost } from "./app.routes";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [FlexLayoutModule, RouterOutlet, NavBarModule, FooterModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "portfolio-site";

  // The tracker portal is a full-screen app of its own, without the portfolio's nav and footer.
  private readonly router = inject(Router);
  readonly bare = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => onTrackerHost() || this.router.url.startsWith("/tracker")),
    ),
    { initialValue: onTrackerHost() || location.pathname.startsWith("/tracker") },
  );
}
