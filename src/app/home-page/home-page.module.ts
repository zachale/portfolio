import { NgModule } from "@angular/core";
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { HomePage } from "./home-page.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatCardModule } from "@angular/material/card";
import { RouterModule } from "@angular/router";



@NgModule ({
  declarations:[ HomePage ],
  imports: [ NzTimelineModule, FlexLayoutModule, MatCardModule, RouterModule.forChild([{path:'',component:HomePage}])],
  exports: [ HomePage ]
}) 
export class HomePageModule{}
