// API pública — próximos sociales + sus mesas desde Airtable
// GET /api/sociales → JSON { sociales: [{ nombre, fecha, lugar, mesas: [...] }] }
// Cache: 60 segundos (disponibilidad de mesas)

const BASE_ID = 'appWwCQxALdMMV4MA';
const TABLA_SOCIALES = 'SOCIALES';
const TABLA_MESAS = 'MESAS POR EVENTO';

// "25JUL-VIP CENTRAL A1" → "VIP CENTRAL A1" (saca el prefijo de fecha)
function nombreMesa(clave) {
  const i = (clave || '').indexOf('-');
  return i >= 0 ? clave.slice(i + 1).trim() : (clave || '').trim();
}

// Precio escalonado de la entrada de Havana Night (8/08, La Casona Lafuente).
// Fuente de verdad: agent/social_entradas.py (whatsapp-agentkit) — mismo criterio
// espejado acá, igual que el precio de mesas vive en Airtable y se lee en los dos lados.
function fechaHoyAsuncion() {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion', year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date()); // "YYYY-MM-DD"
}
function precioEntradaSocial() {
  const hoy = fechaHoyAsuncion();
  if (hoy <= '2026-07-31') return 50000;
  if (hoy <= '2026-08-04') return 60000;
  return 80000;
}

export async function onRequestGet(context) {
  const apiKey = context.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'AIRTABLE_API_KEY no configurada' }, { status: 500 });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1) Sociales ACTIVOS con fecha futura, ordenados por fecha
    const hoy = new Date().toISOString();
    const socialesParams = new URLSearchParams({
      filterByFormula: `AND({ESTADO}='ACTIVO', IS_AFTER({FECHA}, '${hoy}'))`,
      'sort[0][field]': 'FECHA',
      'sort[0][direction]': 'asc',
      pageSize: '100',
    });
    const socialesRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLA_SOCIALES)}?${socialesParams}`,
      { headers }
    );
    if (!socialesRes.ok) {
      const t = await socialesRes.text().catch(() => '');
      return Response.json({ error: `Airtable SOCIALES ${socialesRes.status}: ${t.slice(0, 200)}` }, { status: 502 });
    }
    const socialesData = await socialesRes.json();
    const sociales = (socialesData.records || []).map((rec) => {
      const tipoVenta = rec.fields?.TIPO_VENTA || 'MESA';
      return {
        record_id: rec.id,
        nombre: rec.fields?.NOMBRE || '',
        fecha: rec.fields?.FECHA || '',
        lugar: rec.fields?.LUGAR || '',
        tipo_venta: tipoVenta,
        precio_entrada: tipoVenta === 'ENTRADA' ? precioEntradaSocial() : null,
        mesas: [],
      };
    });
    if (!sociales.length) {
      return new Response(JSON.stringify({ sociales: [] }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    const porId = Object.fromEntries(sociales.map((s) => [s.record_id, s]));

    // 2) Mesas HABILITADAS (de todos los sociales activos), agrupadas por evento
    let offset = null;
    do {
      const mesasParams = new URLSearchParams({
        filterByFormula: '{HABILITADA}=TRUE()',
        pageSize: '100',
      });
      if (offset) mesasParams.set('offset', offset);
      const mesasRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLA_MESAS)}?${mesasParams}`,
        { headers }
      );
      if (!mesasRes.ok) {
        const t = await mesasRes.text().catch(() => '');
        return Response.json({ error: `Airtable MESAS ${mesasRes.status}: ${t.slice(0, 200)}` }, { status: 502 });
      }
      const mesasData = await mesasRes.json();
      for (const rec of mesasData.records || []) {
        const f = rec.fields || {};
        const eventoId = (f.EVENTO || [])[0]; // link → array de record IDs
        const social = porId[eventoId];
        if (!social) continue; // mesa de un social no activo / pasado
        const disponibles = f['LUGARES DISPONIBLES'] ?? 0;
        const estado = f.ESTADO || '';
        social.mesas.push({
          nombre: nombreMesa(f.CLAVE),
          precio: f.PRECIO || 0,
          capacidad: f.CAPACIDAD || 0,
          disponibles,
          agotada: estado !== 'LIBRE' || disponibles <= 0,
        });
      }
      offset = mesasData.offset;
    } while (offset);

    // 3) Ordenar mesas de cada social: por precio asc, luego nombre
    for (const s of sociales) {
      s.mesas.sort((a, b) => a.precio - b.precio || a.nombre.localeCompare(b.nombre));
    }

    return new Response(JSON.stringify({ sociales }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return Response.json({ error: 'Error: ' + e.message }, { status: 502 });
  }
}
