import { NgModule } from '@angular/core';
import { FirstWorkTermReport } from './first-work-term-report.component';
import { RouterModule } from '@angular/router';
import { FlexModule } from '@angular/flex-layout';
import { MatExpansionModule } from '@angular/material/expansion';
import { NzDividerModule  } from 'ng-zorro-antd/divider'

@NgModule({
  declarations: [FirstWorkTermReport],
  imports: [
    FlexModule,
    MatExpansionModule,
    NzDividerModule ,
    RouterModule.forChild([{ path: '', component: FirstWorkTermReport }]),
  ],
  exports: [FirstWorkTermReport],
})
export class FirstWorkTermReportModule {}
