import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { posthog } from 'posthog-js';
import { captureLinkKey, withoutLinkKey } from './app/tracker/link-key';

// Before analytics starts: a solar tracker sign-in link must never reach PostHog with its key.
captureLinkKey();
window.addEventListener('hashchange', captureLinkKey);

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);

posthog.init('phc_jP728LsaPTymnxkXfXgM0YBR93LcNtL2KmLiyoUfSVS', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'always',
  // Belt and braces for the above: strip a sign-in key from any address PostHog records.
  sanitize_properties: (properties) => {
    for (const [name, value] of Object.entries(properties)) {
      if (typeof value === 'string' && value.includes('key=')) properties[name] = withoutLinkKey(value);
    }
    return properties;
  },
});
