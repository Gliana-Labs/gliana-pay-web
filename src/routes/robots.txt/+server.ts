const robots = `User-agent: *
Allow: /

Sitemap: https://glianapay.com/sitemap.xml
`;

export function GET() {
  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'max-age=86400'
    }
  });
}
