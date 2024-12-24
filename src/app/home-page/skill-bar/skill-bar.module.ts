import { NgModule } from "@angular/core";
import { SkillBarComponent } from "./skill-bar.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { SkillChipModule } from "../skill-chip/skill-chip.module";

@NgModule({
  declarations: [SkillBarComponent],
  imports: [FlexLayoutModule, SkillChipModule],
  exports: [SkillBarComponent],
})
export class SkillBarModule {
}
