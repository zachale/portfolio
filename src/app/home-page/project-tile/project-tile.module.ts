import { NgModule } from "@angular/core";
import { ProjectTileComponent } from "./project-tile.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatChipsModule } from "@angular/material/chips";
import { NzIconModule } from "ng-zorro-antd/icon";
import { CommonModule } from "@angular/common";
import { SkillBarModule } from "../skill-bar/skill-bar.module"; // <-- Import CommonModule
import { NzDividerModule } from "ng-zorro-antd/divider";

@NgModule({
  declarations: [ProjectTileComponent],
  imports: [
    SkillBarModule,
    CommonModule,
    FlexLayoutModule,
    MatChipsModule,
    NzIconModule,
    SkillBarModule,
    NzDividerModule,
  ],
  exports: [ProjectTileComponent],
})
export class ProjectTileModule {}
