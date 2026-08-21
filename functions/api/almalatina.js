// API pública — proxy del formulario de Alma Latina Boutique hacia Dorita (Railway)
// POST /api/almalatina {nombre, telefono, producto, color, talle} → POST Railway /almalatina/reserva
// Existe para no exponer el dominio de Railway en el HTML y evitar CORS.
// La validación real (talles, colores, duplicados) vive en Dorita — acá solo
// se chequea la forma del body y se reenvía tal cual.

const DORITA_URL = 'https://salsa-soul-dorita-production.up.railway.app/almalatina/reserva';

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }

  const nombre = String(body?.nombre || '').slice(0, 80);
  const telefono = String(body?.telefono || '').slice(0, 30);
  const producto = String(body?.producto || '').slice(0, 10);
  const color = String(body?.color || '').slice(0, 15);
  const talle = String(body?.talle || '').slice(0, 5);
  if (!nombre || !telefono || !producto || !color || !talle) {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }

  try {
    const r = await fetch(DORITA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono, producto, color, talle }),
    });
    const data = await r.json().catch(() => ({ ok: false, motivo: 'error' }));
    return Response.json(data, { status: r.status });
  } catch (e) {
    return Response.json({ ok: false, motivo: 'error' }, { status: 502 });
  }
}
