import { Component } from "@angular/core";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
})
export class Header {
  emailCopied = false;
  copyEmail() {
    try {
      navigator.clipboard.writeText("zachlegesse@gmail.com");
    } catch (e) {
      return;
    }
    this.emailCopied = true;
  }
}
