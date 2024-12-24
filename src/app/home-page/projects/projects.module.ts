import { NgModule } from "@angular/core";
import { Projects } from "./projects.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { ProjectTileModule } from "../project-tile/project-tile.module";
import { NzIconModule } from "ng-zorro-antd/icon";

@NgModule({
  declarations: [Projects],
  imports: [
    FlexLayoutModule,
    NzIconModule,
    ProjectTileModule,
  ],
  exports: [Projects],
})
export class ProjectsModule {}
