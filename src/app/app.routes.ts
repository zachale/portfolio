import { Routes } from "@angular/router";

/** tracker.zachlegesse.ca serves the solar tracker portal at its root. */
export const onTrackerHost = () => location.hostname.startsWith("tracker.");

const trackerPage = () =>
  import("./tracker/tracker-page.component").then((m) => m.TrackerPageComponent);

export const routes: Routes = [
  { path: "", canMatch: [onTrackerHost], loadComponent: trackerPage },
  { path: "tracker", loadComponent: trackerPage },
  {
    path: "",
    loadChildren: () =>
      import("./home-page/home-page.module").then((m) => m.HomePageModule),
  },
  {
    path: "blog",
    children: [{
      path: "work-term-1",
      loadChildren: () =>
        import("./work-term-report-1/first-work-term-report.module").then((m) =>
          m.FirstWorkTermReportModule
        ),
    }, {
      path: "work-term-2",
      loadChildren: () =>
        import("./work-term-report-2/second-work-term-report.module").then((
          m,
        ) => m.SecondWorkTermReportModule),
    },
    {
      path: "work-term-3",
      loadChildren: () =>
        import("./work-term-report-3/third-work-term-report.module").then((
          m,
        ) => m.ThirdWorkTermReportModule),
    },
    {
      path: "work-term-4",
      loadChildren: () =>
        import("./work-term-report-4/fourth-work-term-report.module").then((
          m,
        ) => m.FourthWorkTermReportModule),
    },
  ],
  },
];
