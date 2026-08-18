export function GET() {
  return Response.json({
    ok: true,
    game: 'Prismfall',
    version: '2.3.0',
    runtime: 'nodejs',
    timestamp: new Date().toISOString()
  });
}
