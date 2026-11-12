// API pública — proxy de la remera «Mi 2do hogar» (tienda Alma Latina) hacia Dorita (Railway)
// GET  /api/remera-sss → GET Railway /remera-sss/precio (precio y planes: viven solo en Dorita)
// POST /api/remera-sss {nombre, telefono, color, talle, plan} → POST Railway /remera-sss/pedido
//      → {ok, monto, link_tarjeta, remera} (el link de tarjeta lo firma Dorita)
// Existe para no exponer el dominio de Railway en el HTML y evitar CORS. La validación real
// vive en Dorita: acá solo se chequea la forma del body y se reenvía.

const DORITA = 'https://salsa-soul-dorita-production.up.railway.app/remera-sss';

export async function onRequestGet() {
  try {
    const r = await fetch(`${DORITA}/precio`);
    const data = await r.json().catch(() => ({ ok: false, motivo: 'error' }));
    return Response.json(data, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ ok: false, motivo: 'error' }, { status: 502 });
  }
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }
  const nombre = String(body?.nombre || '').slice(0, 80);
  const telefono = String(body?.telefono || '').slice(0, 30);
  const color = String(body?.color || '').slice(0, 10);
  const talle = String(body?.talle || '').slice(0, 5);
  const plan = String(body?.plan || '1').slice(0, 5);
  if (!nombre || !telefono || !color || !talle) {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }
  try {
    const r = await fetch(`${DORITA}/pedido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono, color, talle, plan }),
    });
    const data = await r.json().catch(() => ({ ok: false, motivo: 'error' }));
    return Response.json(data, { status: r.status });
  } catch (e) {
    return Response.json({ ok: false, motivo: 'error' }, { status: 502 });
  }
}
