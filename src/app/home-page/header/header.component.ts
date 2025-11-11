import { Component } from "@angular/core";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
})
export class Header {
  downloadResume() {
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = '/assets/resume/Zach_Legesse_S26_2.pdf';
    link.download = 'Zach_Legesse_Resume.pdf';
    link.click();
  }
}
