import { Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
})
export class HomePage {
  shareData = {
    title: 'MDN',
    text: 'Learn web development on MDN!',
    url: 'https://developer.mozilla.org',
  };
  err: any;
  click() {
    try {
      navigator.share(this.shareData);
    } catch (err) {
      this.err = err;
    }
  }
}
