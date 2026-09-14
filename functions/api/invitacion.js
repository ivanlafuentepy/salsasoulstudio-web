// API de la landing /invitacion/ — proxy hacia Dorita (Railway)
// POST /api/invitacion → formulario de la clase gratis por invitación de Iván
// Mismo criterio que functions/api/promo.js: no exponer el dominio de Railway
// en el HTML y evitar CORS. La validación real vive en Dorita.

const BASE = 'https://salsa-soul-dorita-production.up.railway.app';

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }

  // Se reenvía solo lo que el endpoint espera, recortado: nada de campos libres.
  const s = (v, n = 60) => String(v ?? '').slice(0, n);
  const arr = (v) => (Array.isArray(v) ? v.slice(0, 12).map((x) => s(x, 30)) : []);
  const payload = {
    telefono: s(body.telefono, 30),
    nombre: s(body.nombre, 40),
    apellido: s(body.apellido, 40),
    ci: s(body.ci, 15),
    fecha_nacimiento: s(body.fecha_nacimiento, 10),
    motivos: arr(body.motivos),
    experiencia: s(body.experiencia, 30),
    ubicacion: s(body.ubicacion, 30),
    horarios: arr(body.horarios),
    edad: s(body.edad, 10),
    presupuesto: s(body.presupuesto, 30),
    identificacion: arr(body.identificacion),
  };

  if (!payload.telefono || !payload.nombre) {
    return Response.json({ ok: false, motivo: 'datos_invalidos' }, { status: 400 });
  }

  try {
    const r = await fetch(`${BASE}/invitacion/formulario`, {
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
