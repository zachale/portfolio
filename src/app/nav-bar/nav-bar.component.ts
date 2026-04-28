import { DOCUMENT } from "@angular/common";
import { Component, HostListener, Inject, ViewChild, viewChild } from "@angular/core";
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
  ctaOpacity = 0;
  ctaTranslateY = 8;
  ctaTransform = 'translateX(-50%) translateY(8px)';

  @HostListener('window:scroll')
  onScroll() {
    const heroCta = document.getElementById('hero-cta');
    if (!heroCta) return;
    const rect = heroCta.getBoundingClientRect();
    const navbarH = 100;
    const progress = Math.max(0, Math.min(1, (navbarH - rect.bottom) / navbarH));
    this.ctaOpacity = progress;
    this.ctaTranslateY = 8 * (1 - progress);
    this.ctaTransform = `translateX(-50%) translateY(${this.ctaTranslateY}px)`;
  }

  constructor(
    protected router: Router,
    @Inject(DOCUMENT) private document: Document,
  ) {}
  ngOnInit() {
    this.innerWidth = window.innerWidth;
  }
  downloadResume() {
    const link = document.createElement('a');
    link.href = '/assets/resume/Zach_Legesse_F26_AI.pdf';
    link.download = 'Zach_Legesse_Resume.pdf';
    link.click();
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
