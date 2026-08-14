// API pública — proxy del formulario de remeras del festival hacia Dorita (Railway)
// POST /api/remera {telefono, color, talle} → POST Railway /festival/remera-incluida
// Existe para no exponer el dominio de Railway en el HTML y evitar CORS.
// La validación real (inscripto, duplicado, talles) vive en Dorita — acá solo
// se chequea la forma del body y se reenvía tal cual.

const DORITA_URL = 'https://salsa-soul-dorita-production.up.railway.app/festival/remera-incluida';

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }

  const telefono = String(body?.telefono || '').slice(0, 30);
  const color = String(body?.color || '').slice(0, 10);
  const talle = String(body?.talle || '').slice(0, 5);
  if (!telefono || !color || !talle) {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }

  try {
    const r = await fetch(DORITA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono, color, talle }),
    });
    const data = await r.json().catch(() => ({ ok: false, motivo: 'error' }));
    return Response.json(data, { status: r.status });
  } catch (e) {
    return Response.json({ ok: false, motivo: 'error' }, { status: 502 });
  }
}
