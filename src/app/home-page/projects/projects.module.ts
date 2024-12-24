import { NgModule } from "@angular/core";
import { Projects } from "./projects.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { ProjectTileModule } from "../project-tile/project-tile.module";

@NgModule({
  declarations: [Projects],
  imports: [
    FlexLayoutModule,
    ProjectTileModule,
  ],
  exports: [Projects],
})
export class ProjectsModule {}
