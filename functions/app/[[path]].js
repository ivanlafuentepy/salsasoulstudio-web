// /app/* — Salsa Soul App (la PWA del alumno), servida desde salsasoulstudio.com.
//
// La app vive en el servidor de Dorita (Railway, agent/app_pwa) y pide todo con rutas
// absolutas /app/... (api, manifest, ícono, fotos). Iván quiere mandar el link
// salsasoulstudio.com/miapp y que la app QUEDE en este dominio (14/10/2026), no un 302 a la
// URL larga de Railway: esta Function le pasa cada pedido a Railway y le devuelve la
// respuesta al navegador sin cambiar la dirección. Mismo esquema que /elenco.
//
// - Todo método (GET, POST de registro/código/foto) y todo header pasan tal cual.
// - La IP real del celular viaja en X-Forwarded-For.
// - Un redirect de Railway que apunte a su propio dominio se reescribe a este.
// - /app exacto NO llega acá: una regla vieja del dominio lo manda a AppSheet. Por eso la
//   entrada es /miapp (functions/miapp/[[path]].js).

const ORIGEN = 'https://salsa-soul-dorita-production.up.railway.app';

export async function onRequest({ request }) {
  const url = new URL(request.url);

  const headers = new Headers(request.headers);
  headers.delete('host');
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) headers.set('X-Forwarded-For', ip);

  const metodo = request.method.toUpperCase();
  const resp = await fetch(ORIGEN + url.pathname + url.search, {
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
