// /las-elegidas (sin barra) — sirve el índice DIRECTO, con 200.
//
// Pages respondía un 308 a /las-elegidas/ (la carpeta del sitio de Las Elegidas) y WhatsApp no
// sigue esa redirección para armar la vista previa: el link pegado salía sin el afiche
// (12/10/2026). Esta Function devuelve el mismo index.html sin redirigir.
// /las-elegidas/ y las páginas de adentro siguen siendo archivos estáticos.

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  url.pathname = '/las-elegidas/';
  const resp = await env.ASSETS.fetch(new Request(url.toString(), request));
  return new Response(resp.body, resp);
}
