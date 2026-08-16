export function GET() {
  return Response.json({
    ok: true,
    game: 'Prismfall',
    runtime: 'nodejs',
    timestamp: new Date().toISOString()
  });
}
