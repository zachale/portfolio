import { NgModule } from "@angular/core";
import { AboutPage } from "./about-page.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { RouterModule } from "@angular/router";
import { NzDividerModule } from "ng-zorro-antd/divider";

@NgModule({
  declarations: [AboutPage],
  imports: [
    FlexLayoutModule,
    NzDividerModule,
    RouterModule.forChild([{ path: "", component: AboutPage }]),
  ],
  exports: [AboutPage],
})
export class AboutPageModule {}
