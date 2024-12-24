import { NgModule } from "@angular/core";
import { WorkExperience } from "./work-experience.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { ProjectTileModule } from "../project-tile/project-tile.module";
import { WorkTileModule } from "../work-tile/work-tile.module";

@NgModule({
  declarations: [WorkExperience],
  imports: [
    FlexLayoutModule,
    ProjectTileModule,
    WorkTileModule,
  ],
  exports: [WorkExperience],
})
export class WorkExperienceModule {}
