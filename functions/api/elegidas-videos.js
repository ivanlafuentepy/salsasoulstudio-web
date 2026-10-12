// GET /api/elegidas-videos — los videos de las coreos de Las Elegidas, para las páginas de
// /las-elegidas/ (y para la pestaña Las Elegidas de la app del elenco, que las muestra adentro).
//
// Lee en vivo VIDEOS FESTIVAL (los suben los profes desde la app o Iván con
// scripts/festival_subir_material.py) y COREOS FESTIVAL (para saber de qué número es cada uno),
// así un video nuevo aparece en la web sin regenerar ninguna página. Los archivos están en R2
// público; acá solo viaja la lista. Caché de 60 s para no pegarle a Airtable en cada visita.

const BASE_ID = 'appWwCQxALdMMV4MA';
const TTL = 60;

async function todos(tabla, apiKey, params = {}) {
  const out = [];
  let offset = '';
  do {
    const qs = new URLSearchParams({ pageSize: '100', ...params });
    if (offset) qs.set('offset', offset);
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tabla)}?${qs}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) throw new Error(`${tabla} ${r.status}`);
    const d = await r.json();
    out.push(...d.records);
    offset = d.offset || '';
  } while (offset);
  return out;
}

export async function onRequestGet(context) {
  const apiKey = context.env.AIRTABLE_API_KEY;
  if (!apiKey) return json({ ok: false, error: 'AIRTABLE_API_KEY no configurada' }, 500);

  const cache = caches.default;
  const clave = new Request(new URL('/api/elegidas-videos', context.request.url).toString());
  const guardada = await cache.match(clave);
  if (guardada) return guardada;

  try {
    const [coreos, videos] = await Promise.all([
      todos('COREOS FESTIVAL', apiKey),
      todos('VIDEOS FESTIVAL', apiKey, { filterByFormula: 'NOT({OCULTO})' }),
    ]);
    const porId = {};
    for (const c of coreos) {
      const f = c.fields;
      if (f.CODIGO && f.PUBLICADA) porId[c.id] = { codigo: f.CODIGO, orden: f.ORDEN || 999, nombre: f.NOMBRE || f.CODIGO };
    }
    const lista = videos
      .filter(v => v.fields.URL)
      .map(v => {
        const f = v.fields;
        const c = porId[(f.COREO || [])[0]] || null;
        return {
          titulo: f.TITULO || 'Video',
          url: f.URL,
          notas: f.NOTAS || '',
          subido_por: f['SUBIDO POR'] || '',
          fecha: f.FECHA || '',
          coreo: c ? c.codigo : '',
          orden: c ? c.orden : 999,
          numero: c ? c.nombre : 'Otros',
        };
      })
      .sort((a, b) => a.orden - b.orden || a.titulo.localeCompare(b.titulo, 'es'));
    const resp = json({ ok: true, videos: lista });
    resp.headers.set('Cache-Control', `public, max-age=${TTL}`);
    context.waitUntil(cache.put(clave, resp.clone()));
    return resp;
  } catch (e) {
    return json({ ok: false, error: String(e.message || e) }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
