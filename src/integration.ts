import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { HookParameters } from "astro";
import { addVirtualImports, defineIntegration } from "astro-integration-kit";
import getPort from "get-port";
import { serve } from "micro";
import { chromium } from "playwright";
import serveHandler from "serve-handler";
import { optionsSchema } from "./options.js";

const name = "@celestio/astro-selfie";

export const integration = defineIntegration({
  name,
  optionsSchema,
  setup({ options }) {
    const screen = options?.screen ?? { width: 1024, height: 768 };
    const viewport = options?.viewport ?? { width: 1024, height: 768 };
    let outDir: URL;

    return {
      hooks: {
        "astro:config:setup": (params: HookParameters<"astro:config:setup">) => {
          addVirtualImports(params, {
            name,
            imports: [
              {
                id: `virtual:${name}/config`,
                content: `export default ${JSON.stringify(options)}`,
              },
              {
                id: `${name}:utils`,
                content: `export * from "@celestio/astro-selfie/utils";`,
              },
            ],
          });
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "astro:config:done"({ config }: HookParameters<"astro:config:done">) {
          outDir = config.outDir;
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        async "astro:build:done"({ dir, pages }: HookParameters<"astro:build:done">) {
          const screenshotsDir = new URL(options?.outputDir ?? "og", outDir);
          await fs.mkdir(fileURLToPath(screenshotsDir), { recursive: true });

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

          for (const { pathname } of pages) {
            const url = new URL(pathname, baseUrl);
            const page = await context.newPage();
            await page.goto(url.href);

            // Wait for 3 seconds
            await page.waitForTimeout(3000);
            await page.evaluate("document.body.dataset.astroSelfie = true;");
            const screenshot = await page.screenshot({ type: "png" });

            const screenshotPath = path.join(
              fileURLToPath(screenshotsDir),
              pathname === "" ? "index.png" : `${pathname}.png`,
            );

            await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
            await fs.writeFile(screenshotPath, screenshot);
          }

          await browser.close();
          server.close();
        },
      },
    };
  },
});
