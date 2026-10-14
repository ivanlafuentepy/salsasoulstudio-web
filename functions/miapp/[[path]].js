// /miapp/* — la Salsa Soul App (PWA del alumno), servida desde salsasoulstudio.com.
//
// La app vive en el servidor de Dorita (Railway, agent/app_pwa, montada en /app). Iván quiere
// mandar el link salsasoulstudio.com/miapp y que la app QUEDE en este dominio (14/10/2026),
// no un 302 a la URL larga de Railway: esta Function le pasa cada pedido a Railway y le
// devuelve la respuesta al navegador sin cambiar la dirección. Mismo esquema que /elenco.
//
// /miapp/<algo> → Railway /app/<algo>. La app pide todo con rutas absolutas /app/... (api,
// manifest, ícono, foto), pero /app/* de este dominio NO llega a Pages: una regla vieja del
// dominio en Cloudflare (la de AppSheet) lo ataja con un 404. Por eso en el HTML y en el
// manifest se cambia "/app/" por "/miapp/" y la app entera queda bajo /miapp.
//
// - /miapp sin barra responde 200 directo: con un 30x WhatsApp no arma la vista previa.
// - Todo método (GET, POST de registro/código/foto) y todo header pasan tal cual.
// - La IP real del celular viaja en X-Forwarded-For.
// - Un redirect de Railway que apunte a su propio dominio se reescribe a este.

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

  const tipo = resp.headers.get('content-type') || '';
  if (/text\/html|manifest/.test(tipo)) {
    const texto = (await resp.text()).replaceAll('/app/', '/miapp/');
    const h = new Headers(resp.headers);
    h.delete('content-length');
    h.delete('content-encoding');
    h.delete('etag');   // el cuerpo cambió: el ETag de Railway ya no es el de esta respuesta
    return new Response(texto, { status: resp.status, headers: h });
  }

  const out = new Response(resp.body, resp);
  const loc = out.headers.get('location');
  if (loc && loc.startsWith(ORIGEN)) {
    out.headers.set('location', loc.slice(ORIGEN.length).replace(/^\/app\//, '/miapp/') || '/');
  }
  return out;
}
