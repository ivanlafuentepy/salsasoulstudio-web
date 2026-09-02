// API — aportes de los alumnos al guion del festival ("Las Elegidas")
// POST /api/guion  { escena, nombre, aporte }
// Guarda en Airtable (GUION APORTES) y avisa a Ivan por Telegram.
// Los aportes NO se publican en la pagina: solo los ve Ivan.

const BASE_ID = 'appWwCQxALdMMV4MA';
const TABLE = 'GUION APORTES';

export async function onRequestPost(context) {
  const apiKey = context.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    return json({ ok: false, error: 'AIRTABLE_API_KEY no configurada' }, 500);
  }

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return json({ ok: false, error: 'Body invalido' }, 400);
  }

  const escena = String(body.escena || 'General').trim().slice(0, 120);
  const nombre = String(body.nombre || '').trim().slice(0, 60);
  const aporte = String(body.aporte || '').trim().slice(0, 1500);

  if (!nombre) return json({ ok: false, error: 'Falta el nombre' }, 400);
  if (aporte.length < 5) return json({ ok: false, error: 'El aporte esta vacio' }, 400);

  // Fecha en hora de Asuncion — nunca UTC ni offset hardcodeado
  const fecha = new Date().toLocaleString('es-PY', {
    timeZone: 'America/Asuncion',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            ESCENA: escena,
            NOMBRE: nombre,
            APORTE: aporte,
            FECHA: fecha,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return json(
        { ok: false, error: `Airtable respondio ${res.status}: ${errText.slice(0, 200)}` },
        502
      );
    }
  } catch (e) {
    return json({ ok: false, error: 'Error guardando: ' + e.message }, 502);
  }

  // Aviso a Ivan. Best-effort: si Telegram falla, el aporte YA quedo guardado
  // en Airtable y el alumno no tiene por que enterarse. El flag `tg` queda en
  // la respuesta para poder verificar el aviso sin adivinar.
  const tg = await avisarTelegram(context.env, { escena, nombre, aporte, fecha });

  return json({ ok: true, tg });
}

async function avisarTelegram(env, { escena, nombre, aporte, fecha }) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_GROUP_ID;
  if (!token || !chatId) return 'sin-credenciales';

  const texto =
    `📝 *APORTE AL GUION*\n\n` +
    `*${escapeMd(nombre)}* — _${escapeMd(escena)}_\n` +
    `${escapeMd(fecha)}\n\n` +
    `${escapeMd(aporte)}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: 'Markdown',
      }),
    });
    return res.ok ? 'ok' : 'telegram-' + res.status;
  } catch (e) {
    return 'error';
  }
}

// Markdown v1 de Telegram: solo hay que neutralizar los delimitadores
function escapeMd(s) {
  return String(s).replace(/([*_`\[\]])/g, '\\$1');
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
