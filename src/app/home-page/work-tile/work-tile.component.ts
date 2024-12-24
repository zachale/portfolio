import { Component, Input, OnInit, TemplateRef } from "@angular/core";

type Quote = { body: string; author: string };

@Component({
  selector: "app-work-tile",
  templateUrl: "./work-tile.component.html",
  styleUrl: "./work-tile.component.scss",
})
export class WorkTileComponent implements OnInit {
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
  quotes?: Array<Quote>;
  firstQuote?: Quote;
  quotesAfterFirst?: Array<Quote>;
  shouldShowMoreQuotes = false;
  ngOnInit(): void {
    if (this.quotes?.length) {
      this.firstQuote = this.quotes?.[0];
      this.quotesAfterFirst = this.quotes?.slice(1);
    }
  }
  toggleQuotes() {
    this.shouldShowMoreQuotes = !this.shouldShowMoreQuotes;
  }
}
