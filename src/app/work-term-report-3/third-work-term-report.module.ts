import { NgModule } from "@angular/core";
import { ThirdWorkTermReport } from "./thirdwork-term-report.component";
import { RouterModule } from "@angular/router";
import { FlexModule } from "@angular/flex-layout";
import { MatExpansionModule } from "@angular/material/expansion";
import { NzDividerModule } from "ng-zorro-antd/divider";

@NgModule({
  declarations: [ThirdWorkTermReport],
  imports: [
    FlexModule,
    MatExpansionModule,
    NzDividerModule,
    RouterModule.forChild([{ path: "", component: ThirdWorkTermReport }]),
  ],
  exports: [ThirdWorkTermReport],
})
export class ThirdWorkTermReportModule {}
