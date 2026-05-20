// API pública — lista servicios profesionales desde Airtable
// GET /api/comunidad → JSON con todos los servicios activos
// Cache: 5 minutos

const BASE_ID = 'appWwCQxALdMMV4MA';
const TABLE = 'SERVICIOS';

export async function onRequestGet(context) {
  const apiKey = context.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'AIRTABLE_API_KEY no configurada' }, { status: 500 });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const servicios = [];
  let offset = null;

  try {
    while (true) {
      const params = new URLSearchParams({
        filterByFormula: '{ACTIVO}=1',
        pageSize: '100',
        'sort[0][field]': 'NOMBRE',
        'sort[0][direction]': 'asc',
      });
      if (offset) params.set('offset', offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE}?${params}`,
        { headers }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return Response.json(
          { error: `Airtable respondió ${res.status}: ${errText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      // Recoger record IDs de alumnos para traer niveles
      const records = data.records || [];
      const alumnoIds = new Set();
      for (const rec of records) {
        const alumnoArr = rec.fields?.ALUMNO;
        if (alumnoArr && alumnoArr[0]) alumnoIds.add(alumnoArr[0]);
      }

      // Traer niveles de alumnos en batch
      const niveles = {};
      if (alumnoIds.size > 0) {
        const idsArr = [...alumnoIds];
        // Airtable permite max 100 por request, usar OR de RECORD_ID()
        const formula = 'OR(' + idsArr.map(id => `RECORD_ID()="${id}"`).join(',') + ')';
        const alumnoParams = new URLSearchParams({
          filterByFormula: formula,
          'fields[]': 'NIVEL',
        });
        const alumnoRes = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/ALUMNOS?${alumnoParams}`,
          { headers }
        );
        if (alumnoRes.ok) {
          const alumnoData = await alumnoRes.json();
          for (const ar of alumnoData.records || []) {
            niveles[ar.id] = ar.fields?.NIVEL || '';
          }
        }
      }

      for (const rec of records) {
        const f = rec.fields || {};
        const alumnoId = f.ALUMNO?.[0] || '';
        // FOTO es attachment array: [{url, thumbnails: {small: {url}, large: {url}}}]
        const fotoArr = f.FOTO || [];
        const fotoUrl = fotoArr[0]?.thumbnails?.large?.url || fotoArr[0]?.url || '';
        servicios.push({
          nombre: f.NOMBRE || '',
          categoria: f.CATEGORIA || 'Otro',
          servicio: f.SERVICIO || '',
          descripcion: f.DESCRIPCION || '',
          whatsapp: f.WHATSAPP || '',
          redes: f.REDES || '',
          nivel: niveles[alumnoId] || '',
          foto: fotoUrl,
        });
      }

      offset = data.offset;
      if (!offset) break;
    }

    return new Response(JSON.stringify({ servicios }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return Response.json({ error: 'Error: ' + e.message }, { status: 502 });
  }
}
