import { Routes } from "@angular/router";
import { FirstWorkTermReport } from "../app/work-term-report-1/first-work-term-report.component";
import { FirstWorkTermReportModule } from "./work-term-report-1/first-work-term-report.module";

export const routes: Routes = [
  {
    path: "",
    loadChildren: () =>
      import("./home-page/home-page.module").then((m) => m.HomePageModule),
  },
  {
    path: "about",
    loadChildren: () =>
      import("./about/about-page.module").then((m) => m.AboutPageModule),
  },
  {
    path: "blog",
    children: [{
      path: "work-term-1",
      loadChildren: () =>
        import("./work-term-report-1/first-work-term-report.module").then((m) =>
          m.FirstWorkTermReportModule
        ),
    }],
  },
];
