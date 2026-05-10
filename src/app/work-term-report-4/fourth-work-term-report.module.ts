import { NgModule } from "@angular/core";
import { FourthWorkTermReport } from "./fourth-work-term-report.component";
import { RouterModule } from "@angular/router";
import { FlexModule } from "@angular/flex-layout";
import { MatExpansionModule } from "@angular/material/expansion";
import { NzDividerModule } from "ng-zorro-antd/divider";

@NgModule({
  declarations: [FourthWorkTermReport],
  imports: [
    FlexModule,
    MatExpansionModule,
    NzDividerModule,
    RouterModule.forChild([{ path: "", component: FourthWorkTermReport }]),
  ],
  exports: [FourthWorkTermReport],
})
export class FourthWorkTermReportModule {}
