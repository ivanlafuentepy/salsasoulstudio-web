// /elenco/* — App del elenco de Las Elegidas, servida desde salsasoulstudio.com.
//
// La app vive en el servidor de Dorita (Railway, agent/festival_app). Iván quiere mandar
// el link salsasoulstudio.com/elenco y que la app QUEDE en este dominio (13/10/2026), no un
// 302 a la URL larga de Railway: por eso esta Function le pasa cada pedido a Railway y le
// devuelve la respuesta al navegador sin cambiar la dirección.
//
// Además, así la app y las páginas de /las-elegidas son del MISMO sitio: la app muestra el
// guion y las coreos adentro (iframe) y puede medir su alto.
//
// - Todo método (GET, POST de ingreso/asistencia/fotos) y todo header pasan tal cual.
// - La IP real del celular viaja en X-Forwarded-For (el tope de intentos de ingreso es por IP).
// - Un redirect de Railway que apunte a su propio dominio se reescribe a este.

const ORIGEN = 'https://salsa-soul-dorita-production.up.railway.app';

export async function onRequest({ request }) {
  const url = new URL(request.url);

  // /elenco sin barra: la PWA y sus rutas relativas necesitan /elenco/
  if (url.pathname === '/elenco') {
    return Response.redirect(`${url.origin}/elenco/${url.search}`, 301);
  }

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
