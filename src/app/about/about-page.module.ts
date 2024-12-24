import { NgModule } from "@angular/core";
import { AboutPage } from "./about-page.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { RouterModule } from "@angular/router";

@NgModule({
  declarations: [AboutPage],
  imports: [
    FlexLayoutModule,
    RouterModule.forChild([{ path: "", component: AboutPage }]),
  ],
  exports: [AboutPage],
})
export class AboutPageModule {}
