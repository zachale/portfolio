import { NgModule } from "@angular/core";
import { TenThousandCofeesPage } from "./10kc-page.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { RouterModule } from "@angular/router";

@NgModule({
  declarations: [TenThousandCofeesPage],
  imports: [
    FlexLayoutModule,
    RouterModule.forChild([{ path: "", component: TenThousandCofeesPage }]),
  ],
  exports: [TenThousandCofeesPage],
})
export class TenThousandCofeesPageModule {}
