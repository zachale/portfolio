# Repository Context: portfolio-site

## Overview

This repository is a personal portfolio site for Zach Legesse, built with Angular. It showcases professional experience, personal projects, and work term reports, and is designed to be visually modern, modular, and easily extensible. The site is intended to highlight both technical and product-focused achievements, with a strong emphasis on user experience and clean, maintainable code.

## Main Focus

- **Personal Branding:** Presents Zach's background, mindset, and motivators.
- **Project Showcase:** Highlights a curated set of technical projects, each with descriptions, tech stacks, and links to demos or repositories.
- **Professional Experience:** Details work terms, including in-depth reports on contributions, learning goals, and outcomes.
- **Modern UI/UX:** Uses Angular Material, ng-zorro-antd, and Tailwind CSS for a polished, responsive, and accessible interface.

## Technical Stack

- **Framework:** Angular 18 (standalone components, modular architecture)
- **Styling:** Tailwind CSS, Angular Material, SCSS, ng-zorro-antd
- **Layout:** Angular Flex Layout for responsive design
- **Build Tools:** Angular CLI, TypeScript 5, PostCSS, Autoprefixer
- **Testing:** Karma, Jasmine (unit tests), with configuration for high coverage
- **Analytics:** posthog-js (for user analytics)
- **Deployment:** Static build output to `docs/` for GitHub Pages, with CI/CD via GitHub Actions
- **Icons:** Ant Design Icons (inline SVGs, organized by style)

## Directory Structure

```
portfolio-1/
├── angular.json           # Angular CLI project configuration
├── package.json           # Project dependencies and scripts
├── README.md              # Project overview and usage
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig*.json         # TypeScript configuration files
├── src/
│   ├── _redirects         # Netlify-style redirect rules for SPA routing
│   ├── index.html         # HTML entry point
│   ├── main.ts            # Angular bootstrap
│   ├── styles.scss        # Global styles (Tailwind, Material, custom SCSS)
│   ├── assets/            # Static assets (images, logos, icons)
│   │   ├── 10kc/          # Work term images/logos
│   │   ├── content-creation/ # Social/content logos
│   │   ├── imaginate/     # Project-specific assets
│   │   ├── neural-network/# Project-specific assets
│   │   ├── personal/      # Personal images (profile photo)
│   │   └── solar-tracker/ # Project-specific assets
│   └── app/
│       ├── app.component.*      # Root Angular component
│       ├── app.config.ts        # Angular providers/config
│       ├── app.routes.ts        # Route definitions (lazy loaded)
│       ├── about/               # About page (background, mindset)
│       ├── home-page/           # Home page (header, experience, projects)
│       │   ├── header/          # Hero section with intro and actions
│       │   ├── footer/          # Footer with site status
│       │   ├── projects/        # Project list and tiles
│       │   ├── project-tile/    # Individual project display
│       │   ├── skill-bar/       # Skill bar for project/experience
│       │   ├── skill-chip/      # Skill chip component
│       │   ├── work-experience/ # Work experience summary
│       │   └── work-tile/       # Individual work experience display
│       ├── nav-bar/             # Top navigation bar
│       ├── work/                # Work-specific pages (e.g., 10KC)
│       ├── work-term-report-1/  # First work term report (detailed)
│       └── work-term-report-2/  # Second work term report (detailed)
├── docs/                  # Static build output for GitHub Pages
│   ├── browser/           # Main static site output
│   │   └── assets/        # Copied static assets and icon sets
│   └── 3rdpartylicenses.txt # License info for dependencies
```

## Routing & Navigation

- **Angular Router** is used with lazy-loaded modules for each main section (home, about, blog/work-term-reports).
- **NavBar** provides top-level navigation, with responsive dropdown for mobile.
- **SPA Routing:** `_redirects` ensures client-side routing works on static hosts.

## Build, Test, and Deploy

- **Build:** `ng build` (output to `dist/portfolio-site` or `docs/` for deploy)
- **Dev Server:** `ng serve` (hot reload, local dev)
- **Testing:** `ng test` (Karma/Jasmine)
- **Deploy:** `npm run deploy` builds to `docs/` for GitHub Pages; CI/CD via `.github/workflows/static.yml`.
- **TypeScript:** Strict mode enabled, modern ES2022 target, strict template/type checks.

## Notable Design Patterns & Architecture

- **Modular Structure:** Each feature/page is a self-contained Angular module, often with its own components and styles.
- **Standalone Components:** Used for root and some feature components for improved tree-shaking and simplicity.
- **Reusable UI Components:** ProjectTile, WorkTile, SkillBar, SkillChip, etc., are designed for composability and reuse.
- **Responsive Design:** Flex Layout and Tailwind ensure mobile-friendly layouts.
- **Theming:** Uses SCSS variables and Tailwind for consistent color and style theming.
- **Icon System:** Ant Design icons are imported as inline SVGs, organized by style (fill, outline, twotone, animal).
- **Content Organization:**
  - **About:** Personal background, mindset, motivators.
  - **Home:** Header, experience, projects.
  - **Projects:** Each project has a tile with description, tech stack, and links.
  - **Work Experience:** Summarized in tiles, with detailed reports in blog routes.
  - **Work Term Reports:** In-depth, long-form HTML pages with goals, outcomes, and acknowledgements.

## Additional Notes

- **Analytics:** posthog-js is included for user analytics.
- **Accessibility:** Uses Angular Material and semantic HTML for accessible UI.
- **CI/CD:** GitHub Actions workflow for static deployment.
- **Licensing:** All major dependencies are MIT or Apache-2.0 licensed (see `docs/3rdpartylicenses.txt`).

---
This context file provides a comprehensive overview for contributors, code reviewers, or AI tools to understand the structure, focus, and technical details of the portfolio-site repository. 