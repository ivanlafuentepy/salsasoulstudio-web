// /miapp — la dirección oficial de la Salsa Soul App, la que Iván manda a la gente.
//
// Sirve la app DIRECTO (200), sin redirigir: con un 30x WhatsApp no arma la vista previa
// del link y la barra terminaba en la URL de Railway (14/10/2026). La app pide lo demás
// por /app/... (functions/app/[[path]].js). Un link viejo /miapp/<algo> va a /app/<algo>.

const ORIGEN = 'https://salsa-soul-dorita-production.up.railway.app';

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const ruta = '/app/' + url.pathname.replace(/^\/miapp\/?/, '');

  const headers = new Headers(request.headers);
  headers.delete('host');
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) headers.set('X-Forwarded-For', ip);

  const metodo = request.method.toUpperCase();
  const resp = await fetch(ORIGEN + ruta + url.search, {
    method: metodo,
    headers,
    body: metodo === 'GET' || metodo === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  });

  const out = new Response(resp.body, resp);
  const loc = out.headers.get('location');
  if (loc && loc.startsWith(ORIGEN)) out.headers.set('location', loc.slice(ORIGEN.length) || '/');
  return out;
}
