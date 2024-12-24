import { NgModule } from "@angular/core";
import { WorkTileComponent } from "./work-tile.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatChipsModule } from "@angular/material/chips";
import { NzIconModule } from "ng-zorro-antd/icon";
import { SkillChipModule } from "../skill-chip/skill-chip.module";
import { CommonModule } from "@angular/common";
import { SkillBarModule } from "../skill-bar/skill-bar.module"; // <-- Import CommonModule

@NgModule({
  declarations: [WorkTileComponent],
  imports: [
    SkillChipModule,
    CommonModule,
    FlexLayoutModule,
    MatChipsModule,
    NzIconModule,
    SkillBarModule,
  ],
  exports: [WorkTileComponent],
})
export class WorkTileModule {}
