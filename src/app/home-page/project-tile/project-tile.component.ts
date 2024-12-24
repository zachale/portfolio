import { Component, Input, input, TemplateRef } from "@angular/core";

@Component({
  selector: "app-project-tile",
  templateUrl: "./project-tile.component.html",
  styleUrl: "./project-tile.component.scss",
})
export class ProjectTileComponent {
  @Input()
  name: string;
  @Input()
  repositoryLink: string;
  @Input()
  demoLink: string;
  @Input()
  body: string;
  @Input()
  logo: TemplateRef<Element>;
  @Input()
  skills: string[];
  @Input()
  skillsWip: string[];
}
