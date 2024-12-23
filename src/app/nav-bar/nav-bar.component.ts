import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  selector: "app-nav-bar",
  templateUrl: "./nav-bar.component.html",
  styleUrl: "./nav-bar.component.scss",
})
export class NavBar {
  public innerWidth: any;
  constructor(private location: Location, private router: Router) {}
  ngOnInit() {
    this.innerWidth = window.innerWidth;
  }
  navigateTo(route: string) {
    if (this.router.url === route) {
      window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } else {
      this.location.replaceState(route);
    }
  }
}
