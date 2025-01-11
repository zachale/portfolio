import { NgModule } from "@angular/core";
import { SecondWorkTermReport } from "./second-work-term-report.component";
import { RouterModule } from "@angular/router";
import { FlexModule } from "@angular/flex-layout";
import { MatExpansionModule } from "@angular/material/expansion";
import { NzDividerModule } from "ng-zorro-antd/divider";

@NgModule({
  declarations: [SecondWorkTermReport],
  imports: [
    FlexModule,
    MatExpansionModule,
    NzDividerModule,
    RouterModule.forChild([{ path: "", component: SecondWorkTermReport }]),
  ],
  exports: [SecondWorkTermReport],
})
export class SecondWorkTermReportModule {}
