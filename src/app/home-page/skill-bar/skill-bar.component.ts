import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-skill-bar",
  templateUrl: "./skill-bar.component.html",
})
export class SkillBarComponent {
  @Input()
  skills: string[];
  @Input()
  skillsWip: string[];
}
