// API pública — la lista del cumple de Don Ramón (página /cumple-ramon)
// GET /api/cumple-ramon → { nombres: [...], total, cantidad }  (cantidad = personas: una pareja cuenta 2)
//
// Lee la tabla CUMPLE RAMON (base de Dorita), donde Iván carga cada aporte desde el
// Centro de Comando (🎂 Cumple Don Ramón). Devuelve SOLO los nombres y el total:
// el monto de cada uno y los teléfonos no salen nunca de acá (el monto lo ve Iván en
// el Centro de Comando y cada persona en su WhatsApp).

const BASE_ID = 'appWwCQxALdMMV4MA';
const TABLA = 'CUMPLE RAMON';
const EVENTO = 'CUMPLE RAMON 2026';

export async function onRequestGet(context) {
  const apiKey = context.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'AIRTABLE_API_KEY no configurada' }, { status: 500 });
  }
  const headers = { Authorization: `Bearer ${apiKey}` };

  try {
    const registros = [];
    let offset = '';
    do {
      const params = new URLSearchParams({
        filterByFormula: `{EVENTO}='${EVENTO}'`,
        pageSize: '100',
      });
      params.append('fields[]', 'NOMBRE');
      params.append('fields[]', 'MONTO');
      params.append('fields[]', 'PAREJA');
      if (offset) params.set('offset', offset);
      const r = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLA)}?${params}`,
        { headers }
      );
      if (!r.ok) {
        return Response.json({ error: `Airtable ${r.status}` }, { status: 502 });
      }
      const j = await r.json();
      registros.push(...(j.records || []));
      offset = j.offset || '';
    } while (offset);

    let total = 0;
    let personas = 0;
    const vistos = new Set();
    const nombres = [];
    for (const rec of registros) {
      const f = rec.fields || {};
      total += Number(f.MONTO) || 0;
      // Aporte en pareja: paga uno y vale por los dos → «Luis Pérez y Rocío Gómez», cuenta 2.
      const pareja = String(f.PAREJA || '').trim();
      const nombre = [String(f.NOMBRE || '').trim(), pareja].filter(Boolean).join(' y ');
      // El que aportó dos veces sale una sola vez en la lista (el total suma las dos).
      const clave = nombre.toLowerCase();
      if (nombre && !vistos.has(clave)) {
        vistos.add(clave);
        nombres.push(nombre);
        personas += pareja ? 2 : 1;
      }
    }
    nombres.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    return Response.json(
      { nombres, total, cantidad: personas },
      { headers: { 'Cache-Control': 'public, max-age=20' } }
    );
  } catch (e) {
    return Response.json({ error: 'error' }, { status: 502 });
  }
}
