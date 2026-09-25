# astro-selfie [![test](https://github.com/celest-io/astro-selfie/actions/workflows/test.yml/badge.svg)](https://github.com/celest-io/astro-selfie/actions/workflows/test.yml)

> [Astro](https://astro.build) integration to generate page screenshots to show as Open Graph images.

Maintained fork of [astro-selfie](https://github.com/vadimdemedes/astro-selfie), originally created by [Vadim Demedes](https://github.com/vadimdemedes). Thanks to Vadim for the original work.

Link previews generated with this integration look like this:

<img src="example.png" width="600">

Inspired by [Simon Willison's](https://simonwillison.net) website.

## Requirements

- Astro 7 (`astro@^7.0.0`)
- Node.js 22 or later
- A platform that can run headless Chromium (via [Playwright](https://playwright.dev)) during `astro build`
- Static output; screenshots are taken of the built pages

## Install

```console
npx astro add @celestio/astro-selfie
```

Or install it manually:

```console
npm install --save-dev @celestio/astro-selfie
```

Chromium is downloaded by the `@playwright/browser-chromium` install script. pnpm 10+ skips dependency install scripts by default, so approve it with `pnpm approve-builds`, or install the browser directly:

```console
npx playwright install chromium
```

## Usage

### 1. Set up integration

Add the integration to `astro.config.mjs` (`astro add` does this for you). Set `site`, since screenshot URLs are absolute:

```diff
import {defineConfig} from 'astro/config';
+ import selfie from '@celestio/astro-selfie';

export default defineConfig({
+    site: 'https://example.com',
+    integrations: [selfie()],
});
```

### 2. Add meta tags

Then, add a `<meta>` tag to each page that points to a screenshot of itself.

```astro
---
import {selfieUrl} from '@celestio/astro-selfie:utils';

const screenshotUrl = selfieUrl(Astro);
---

<meta property="og:image" content={screenshotUrl.href} />
```

### 3. Customize styles (optional)

Selfie adds a `data-astro-selfie` attribute to `body` when taking a screenshot. You can use that data attribute to change any styles in CSS to make sure page looks good.

For example:

```css
body[data-astro-selfie] .container {
  padding: 32px 64px;
}
```

### 4. Generate screenshots

Screenshots are taken at the end of `astro build` and written to `og/` inside the build output (`dist/og` by default), so they are deployed with the site.

```console
npx astro build
```

The integration must therefore run in the build you deploy. Each page waits 3 seconds before its screenshot, so builds of large sites take longer.

## API

### selfie(options?)

Returns an Astro integration that takes page screenshots.

#### options

##### screen

Type: `{width: number; height: number}`\
Default: `{width: 1024, height: 768}`

Screen size of the browser.

##### viewport

Type: `{width: number; height: number}`\
Default: `{width: 1024, height: 768}`

Viewport size, which is also the screenshot size.

##### outputDir

Type: `string`\
Default: `'og'`

Directory for screenshots, relative to the build output directory.

### selfieUrl(astro): URL

Import from `@celestio/astro-selfie:utils`. Returns the URL of the screenshot of the current page.

#### astro

Type: `AstroGlobal`

Global `Astro` object.
