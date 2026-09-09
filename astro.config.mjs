// @ts-check
import { defineConfig } from 'astro/config';

/**
 * GitHub Pages configuration.
 *
 * Project page (default):  https://iamjason.github.io/hyrule-compendium-site/
 *   SITE=https://iamjason.github.io  BASE=/hyrule-compendium-site
 *
 * Custom domain or user page:
 *   SITE=https://tools.example.com   BASE=/
 *
 * Both are overridable from the environment so the Actions workflow can set
 * them without editing this file.
 */
const SITE = process.env.SITE ?? 'https://iamjason.github.io';
const BASE = process.env.BASE ?? '/hyrule-compendium-site';

export default defineConfig({
  site: SITE,
  base: BASE,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
