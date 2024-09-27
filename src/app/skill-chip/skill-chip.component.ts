import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-skill-chip',
  templateUrl: './skill-chip.component.html',
})
export class SkillChipComponent implements OnInit {
  @Input() type: 'dashed' | 'default' = 'default';
  @Input() message: string;
  dashed: boolean = false;
  ngOnInit() {
    this.dashed = this.type == 'dashed';
  }
}
