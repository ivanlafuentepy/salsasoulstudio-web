// Logout — borra cookie y redirige al login
export async function onRequestGet() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/panel',
      'Set-Cookie': 'panel_auth=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    },
  });
}
