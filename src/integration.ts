import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {HookParameters} from 'astro';
import {defineIntegration} from 'astro-integration-kit';
import {z} from 'astro/zod';
import getPort from 'get-port';
import {serve} from 'micro';
import {chromium} from 'playwright';
import serveHandler from 'serve-handler';

const name = '@celestio/astro-selfie';

export const integration = defineIntegration({
  name,
  optionsSchema: z
    .object({
      /**
       * Options for the screenshot functionality.
       */
      screen: z
        .object({
          width: z.number().default(1024),
          height: z.number().default(768),
        })
        .optional(),

      /**
       * Options for the viewport functionality.
       */
      viewport: z
        .object({
          width: z.number().default(1024),
          height: z.number().default(768),
        })
        .optional(),
    })
    .optional(),

  setup({options}) {
    const screen = options?.screen ?? {width: 1024, height: 768};
    const viewport = options?.viewport ?? {width: 1024, height: 768};
    let outDir: URL;

    return {
      hooks: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'astro:config:done'({config}: HookParameters<'astro:config:done'>) {
          outDir = config.outDir;
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        async 'astro:build:done'({
          dir,
          pages,
        }: HookParameters<'astro:build:done'>) {
          const screenshotsDir = new URL('og', outDir);
          await fs.mkdir(fileURLToPath(screenshotsDir), {recursive: true});

          const port = await getPort();
          const baseUrl = new URL(`http://localhost:${port}`);

          const server = new http.Server(
            serve(async (request, response) => {
              await serveHandler(request, response, {
                public: fileURLToPath(dir),
              });
            }),
          );

          server.listen(port);

          const browser = await chromium.launch();

          const context = await browser.newContext({
            screen,
            viewport,
          });

          for (const {pathname} of pages) {
            const url = new URL(pathname, baseUrl);
            const page = await context.newPage();
            await page.goto(url.href);

            // Wait for 3 seconds
            await page.waitForTimeout(3000);
            await page.evaluate('document.body.dataset.astroSelfie = true;');
            const screenshot = await page.screenshot({type: 'png'});

            const screenshotPath = path.join(
              fileURLToPath(screenshotsDir),
              pathname === '' ? 'index.png' : `${pathname}.png`,
            );

            await fs.mkdir(path.dirname(screenshotPath), {recursive: true});
            await fs.writeFile(screenshotPath, screenshot);
          }

          await browser.close();
          server.close();
        },
      },
    };
  },
});
