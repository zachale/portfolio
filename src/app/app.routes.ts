import { Routes } from '@angular/router';
import { FirstWorkTermReport } from '../app/work-term-report-1/first-work-term-report.component'

export const routes: Routes = [{path:'', loadChildren: () => import('./home-page/home-page.module').then(m => m.HomePageModule)},{path:'firstWorkTermReport', component: FirstWorkTermReport}];
