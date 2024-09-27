import { NgModule } from '@angular/core';
import { HomePage } from './home-page.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ProjectTileModule } from '../tiles/project-tile.module';
import { SkillChipModule } from '../skill-chip/skill-chip.module';
import { NzDividerModule } from 'ng-zorro-antd/divider';

@NgModule({
  declarations: [HomePage],
  imports: [
    NzDividerModule,
    SkillChipModule,
    FlexLayoutModule,
    MatChipsModule,
    NzIconModule,
    RouterModule.forChild([{ path: '', component: HomePage }]),
    ProjectTileModule,
  ],
  exports: [HomePage],
})
export class HomePageModule {}
