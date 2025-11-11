import { Component, Input, TemplateRef } from "@angular/core";

@Component({
  selector: "app-work-tile",
  templateUrl: "./work-tile.component.html",
  styleUrl: "./work-tile.component.scss",
})
export class WorkTileComponent {
  @Input()
  name: string;
  @Input()
  position: string;
  @Input()
  body: string;
  @Input()
  logo: TemplateRef<Element>;
  @Input()
  skills: string[];
  @Input()
  link?: string;
  @Input()
  dateRange?: string;

  onTileClick() {
    if (this.link) {
      window.open(this.link, '_blank', 'noopener,noreferrer');
    }
  }
}
