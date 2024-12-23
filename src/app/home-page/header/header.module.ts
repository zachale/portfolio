import { NgModule } from "@angular/core";
import { NzIconModule } from "ng-zorro-antd/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { FlexLayoutModule } from "@angular/flex-layout";
import { Header } from "./header.component";

@NgModule({
  declarations: [Header],
  imports: [
    NzIconModule,
    MatButtonModule,
    MatCardModule,
    FlexLayoutModule,
    MatIconModule,
  ],
  exports: [Header],
})
export class HeaderModule {}
