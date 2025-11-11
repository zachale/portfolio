import { Routes } from "@angular/router";

export const routes: Routes = [
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
  ],
  },
];
