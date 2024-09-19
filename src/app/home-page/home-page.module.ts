import { NgModule } from '@angular/core';
import { HomePage } from './home-page.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { NzIconModule } from 'ng-zorro-antd/icon';

@NgModule({
  declarations: [HomePage],
  imports: [
    FlexLayoutModule,
    MatChipsModule,
    NzIconModule,
    RouterModule.forChild([{ path: '', component: HomePage }]),
  ],
  exports: [HomePage],
})
export class HomePageModule {}
