import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegration, AstroIntegrationLogger } from "astro";
import getPort from "get-port";
import { serve } from "micro";
import { chromium } from "playwright";
import serveHandler from "serve-handler";
import type { Plugin } from "vite";

import type { Options } from "./options.js";

const name = "@celestio/astro-selfie";

export function createPlugin(options: Options, logger: AstroIntegrationLogger): Plugin {
  const virtualModuleId = `virtual:${name}/config`;
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;
  return {
    name: virtualModuleId,
    resolveId: {
      filter: {
        id: new RegExp(`^${virtualModuleId}$`),
      },
      handler() {
        return resolvedVirtualModuleId;
      },
    },
    load: {
      filter: {
        id: new RegExp(`^${resolvedVirtualModuleId}$`),
      },
      handler() {
        logger.debug("Loading virtual module with options: " + JSON.stringify(options));
        return `export default ${JSON.stringify(options)}`;
      },
    },
  };
}

export function integration(cfg: Options): AstroIntegration {
  if (cfg.screen) {
    if (cfg.screen.width <= 0 || cfg.screen.height <= 0) {
      throw new Error("Screen dimensions must be positive numbers.");
    }
  }

  if (cfg.viewport) {
    if (cfg.viewport.width <= 0 || cfg.viewport.height <= 0) {
      throw new Error("Viewport dimensions must be positive numbers.");
    }
  }
  const screen = cfg.screen ?? { width: 1024, height: 768 };
  const viewport = cfg.viewport ?? { width: 1024, height: 768 };
  const outputDir = cfg.outputDir ?? "og";
  const config: Options = { screen, viewport, outputDir };

  let outDir: URL;
  const componentsEntry = fileURLToPath(new URL("./utils/index.js", import.meta.url));

  const handleConfigDone: AstroIntegration["hooks"]["astro:config:done"] = ({
    config,
    injectTypes,
  }) => {
    outDir = config.outDir;
    injectTypes({
      filename: "utils.d.ts",
      content: `declare module ${JSON.stringify(`${name}:utils`)} {\n  export * from ${JSON.stringify(`${name}/utils`)};\n}\n`,
    });
  };

  const handleConfigSetup: AstroIntegration["hooks"]["astro:config:setup"] = ({
    updateConfig,
    logger,
  }) => {
    updateConfig({
      vite: {
        plugins: [createPlugin(config, logger)],
        resolve: {
          // Cloudflare's workerd dev pipeline can prebundle bare package
          // imports before Vite virtual modules are available.
          alias: {
            "@celestio/astro-selfie:utils": componentsEntry,
          },
        },
      },
    });
  };

  const handleBuildDone: AstroIntegration["hooks"]["astro:build:done"] = async ({
    dir,
    pages,
  }) => {
    const screenshotsDir = new URL(outputDir, outDir);
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

    const context = await browser.newContext({ screen, viewport });

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
  };

  return {
    name,
    hooks: {
      "astro:config:setup": handleConfigSetup,
      "astro:config:done": handleConfigDone,
      "astro:build:done": handleBuildDone,
    },
  };
}
