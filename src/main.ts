import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { posthog } from 'posthog-js';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);

posthog.init('phc_jP728LsaPTymnxkXfXgM0YBR93LcNtL2KmLiyoUfSVS', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'always',
});
