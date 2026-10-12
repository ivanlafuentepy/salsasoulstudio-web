/* las-elegidas/videos.js — GENERADO por scripts/festival_web_elegidas.py.
   Trae en vivo los videos (GET /api/elegidas-videos, Function del sitio que lee VIDEOS FESTIVAL):
   - [data-cuenta="CODIGO"]  → cuántos videos tiene ese número (índice de videos y botones).
   - [data-carpeta="CODIGO"] → los videos de ESE número (página carpeta). Nunca todos juntos. */
(function () {
  var cuentas = [].slice.call(document.querySelectorAll('[data-cuenta]'));
  var carpetas = [].slice.call(document.querySelectorAll('[data-carpeta]'));
  if (!cuentas.length && !carpetas.length) return;
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function alto() { if (window.avisarAlto) window.avisarAlto(); }
  function tarjeta(v) {
    return '<div class="vid"><video src="' + esc(v.url) + '" controls playsinline preload="metadata"></video>' +
      '<div class="vid-t">' + esc(v.titulo) + '</div>' +
      (v.notas ? '<div class="vid-n">' + esc(v.notas) + '</div>' : '') +
      '<div class="vid-m">' + esc([v.subido_por, v.fecha].filter(Boolean).join(' · ')) + '</div></div>';
  }
  document.addEventListener('loadedmetadata', alto, true);
  fetch('/api/elegidas-videos').then(function (r) { return r.json(); }).then(function (d) {
    if (!d.ok) throw new Error(d.error || 'sin datos');
    var por = {};
    d.videos.forEach(function (v) { (por[v.coreo || '-'] = por[v.coreo || '-'] || []).push(v); });
    cuentas.forEach(function (el) {
      var n = (por[el.getAttribute('data-cuenta')] || []).length;
      el.textContent = n ? '🎬 ' + n + (n === 1 ? ' video' : ' videos') : 'Sin videos todavía';
      el.classList.toggle('hay', n > 0);
    });
    carpetas.forEach(function (el) {
      var vs = por[el.getAttribute('data-carpeta')] || [];
      el.innerHTML = vs.length
        ? '<div class="sub-t">' + vs.length + (vs.length === 1 ? ' video' : ' videos') + '</div>' + vs.map(tarjeta).join('')
        : '<p class="nota-chica">Todavía no hay videos de este número. Aparecen acá apenas los suben los profes.</p>';
    });
    alto();
  }).catch(function () {
    carpetas.forEach(function (el) { el.innerHTML = '<p class="nota-chica">No pude cargar los videos. Probá de nuevo en un rato.</p>'; });
    cuentas.forEach(function (el) { el.textContent = ''; });
    alto();
  });
})();
