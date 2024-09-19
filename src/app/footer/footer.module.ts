import { NgModule } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { FlexLayoutModule } from '@angular/flex-layout';
import { Footer } from './footer.component';

@NgModule({
  declarations: [Footer],
  imports: [NzIconModule, MatButtonModule, MatCardModule, FlexLayoutModule],
  exports: [Footer],
})
export class FooterModule {}
