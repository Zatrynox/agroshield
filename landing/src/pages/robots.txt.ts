import type { APIRoute } from 'astro';
import { landingUrl } from '../lib/site';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(landingUrl);
  const sitemap = new URL('/sitemap-index.xml', base).href;
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /gracias',
    'Disallow: /api/',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
