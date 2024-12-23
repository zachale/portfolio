import { NgModule } from '@angular/core';
import { ProjectTileComponent } from './project-tile.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatChipsModule } from '@angular/material/chips';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SkillChipModule } from '../skill-chip/skill-chip.module';
import { CommonModule } from '@angular/common'; // <-- Import CommonModule

@NgModule({
  declarations: [ProjectTileComponent],
  imports: [
    SkillChipModule,
    CommonModule,
    FlexLayoutModule,
    MatChipsModule,
    NzIconModule,
  ],
  exports: [ProjectTileComponent],
})
export class ProjectTileModule {}
