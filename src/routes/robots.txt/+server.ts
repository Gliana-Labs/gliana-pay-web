import { PUBLIC_URL } from "$lib/config";

const robots = `User-agent: *
Allow: /

Sitemap: ${PUBLIC_URL}/sitemap.xml
`;

export function GET() {
  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'max-age=86400'
    }
  });
}