import { NgModule } from '@angular/core';
import { SkillChipComponent } from './skill-chip.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [SkillChipComponent],
  imports: [FlexLayoutModule],
  exports: [SkillChipComponent],
})
export class SkillChipModule {}
