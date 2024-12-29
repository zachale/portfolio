import { Component } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
})
export class Header {
  emailCopied = false;
  constructor(protected router: Router) {}
  copyEmail() {
    try {
      navigator.clipboard.writeText("zachlegesse@gmail.com");
    } catch (e) {
      return;
    }
    this.emailCopied = true;
  }
}
