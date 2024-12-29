import { DOCUMENT } from "@angular/common";
import { Component, Inject, ViewChild, viewChild } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { concatMap, EMPTY, filter, of, take, tap } from "rxjs";

@Component({
  selector: "app-nav-bar",
  templateUrl: "./nav-bar.component.html",
  styleUrl: "./nav-bar.component.scss",
})
export class NavBar {
  public innerWidth: any;
  lastId: string;
  constructor(
    protected router: Router,
    @Inject(DOCUMENT) private document: Document,
  ) {}
  ngOnInit() {
    this.innerWidth = window.innerWidth;
  }
  protected navigateTo(route: string, id?: string) {
    if (this.router.url === route) {
      this.scrollToId(id);
    } else {
      of(this.router.navigateByUrl(route)).pipe(
        concatMap(() =>
          this.router.events.pipe(
            filter((event) => event instanceof NavigationEnd),
            concatMap(() => this.scrollToId(id)),
          )
        ),
        take(1),
      ).subscribe();
    }
  }

  private scrollToId(id?: string) {
    if (id) {
      const element = this.document.getElementById(id);
      if (element) {
        const position = element.getBoundingClientRect();
        return of(
          window.scrollTo({ top: position.top - 128 + globalThis.scrollY }),
        );
      }
    } else {
      return of(window.scroll({
        top: 0,
      }));
    }
    return EMPTY;
  }
}
