// API de la landing /promo/ — proxy hacia Dorita (Railway)
// GET  /api/promo?dias=1 → los días del ciclo en curso (Dorita los calcula solo)
// POST /api/promo        → formulario de la promo, o el acompañante si trae acompanante:1
// Existe para no exponer el dominio de Railway en el HTML y evitar CORS, igual
// que functions/api/almalatina.js. La validación real vive en Dorita.

const BASE = 'https://salsa-soul-dorita-production.up.railway.app';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  if (!url.searchParams.has('dias')) {
    return Response.json({ ok: false, motivo: 'no_encontrado' }, { status: 404 });
  }
  try {
    const r = await fetch(`${BASE}/promo/dias`);
    return new Response(await r.text(), {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return Response.json({ ok: false, motivo: 'sin_conexion' }, { status: 502 });
  }
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }

  const esAcomp = Boolean(body?.acompanante);
  const destino = esAcomp ? `${BASE}/promo/acompanante` : `${BASE}/promo/formulario`;

  // Se reenvía solo lo que el endpoint espera, recortado: nada de campos libres.
  const s = (v, n = 60) => String(v ?? '').slice(0, n);
  const arr = (v) => (Array.isArray(v) ? v.slice(0, 12).map((x) => s(x, 30)) : []);
  const payload = esAcomp
    ? {
        telefono: s(body.telefono, 30),
        nombre_pareja: s(body.nombre_pareja, 40),
        apellido_pareja: s(body.apellido_pareja, 40),
        telefono_pareja: s(body.telefono_pareja, 30),
        ci_pareja: s(body.ci_pareja, 15),
        fecha_nacimiento_pareja: s(body.fecha_nacimiento_pareja, 10),
      }
    : {
        telefono: s(body.telefono, 30),
        nombre: s(body.nombre, 40),
        apellido: s(body.apellido, 40),
        ci: s(body.ci, 15),
        fecha_nacimiento: s(body.fecha_nacimiento, 10),
        dia: s(body.dia, 30),
        motivos: arr(body.motivos),
        experiencia: s(body.experiencia, 30),
        ubicacion: s(body.ubicacion, 30),
        horarios: arr(body.horarios),
        edad: s(body.edad, 10),
        presupuesto: s(body.presupuesto, 30),
        identificacion: arr(body.identificacion),
      };

  if (!payload.telefono || (!esAcomp && (!payload.nombre || !payload.dia))) {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }

  try {
    const r = await fetch(destino, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return new Response(await r.text(), {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return Response.json({ ok: false, motivo: 'sin_conexion' }, { status: 502 });
  }
}
