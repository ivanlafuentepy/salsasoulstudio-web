# tools/ladies_imagenes.py — Genera las imágenes compartibles de Grupo A y B / Salsa Soul Studio
"""
Lee ladies.html (fuente de verdad: listas, contadores y horarios ya publicados) y genera
dos PNG de alta resolución en Downloads\\LADIES SSS, reemplazando los anteriores.

Uso:  py -3 tools/ladies_imagenes.py
Requiere: playwright (py -3 -m pip install playwright && py -3 -m playwright install chromium)
"""

import re, sys, base64
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

REPO = Path(__file__).parent.parent
SALIDA = Path.home() / "Downloads" / "LADIES SSS"
LOGO_B64 = "data:image/png;base64," + base64.b64encode((REPO / "logo-dorado.png").read_bytes()).decode()

html = (REPO / "ladies.html").read_text(encoding="utf-8")

# ── parsear las dos grupo-card ──
tarjetas = re.findall(r'<div class="grupo-card">(.*?)</div>\s*\n\s*</div>\s*\n\s*</div>', html, re.S)
if len(tarjetas) != 2:
    # fallback: partir por grupo-card y quedarse con los 2 bloques
    partes = html.split('<div class="grupo-card">')[1:]
    tarjetas = partes[:2]
if len(tarjetas) != 2:
    sys.exit("❌ No encontré las 2 tarjetas de grupo en ladies.html")

grupos = []
for t in tarjetas:
    nombre = re.search(r"<h3>(.*?)</h3>", t).group(1)
    cupo = re.search(r'<span class="cupo">(.*?)</span>', t).group(1)
    lista = re.findall(r"<li>(.*?)</li>", t)
    dias = []
    for dm in re.finditer(r'<div class="dia-nombre">(.*?)</div>(.*?)(?=<div class="dia">|<div class="horarios|$)', t, re.S):
        franjas = []
        for f in re.finditer(r'<div class="(franja[^"]*)"><span class="hora">(.*?)</span>'
                             r'<span class="clase">(.*?)</span>(?:<span class="profe">(.*?)</span>)?', dm.group(2)):
            franjas.append({"css": f.group(1), "hora": f.group(2), "clase": f.group(3), "profe": f.group(4) or ""})
        dias.append({"dia": dm.group(1), "franjas": franjas})
    grupos.append({"nombre": nombre, "cupo": cupo, "lista": lista, "dias": dias})
    print(f"Parseado {nombre}: {len(lista)} nombres, {len(dias)} días")


def html_grupo(g):
    items = "".join(f"<li>{n}</li>" for n in g["lista"])
    dias = ""
    for d in g["dias"]:
        filas = "".join(
            f'<div class="{f["css"]}"><span class="hora">{f["hora"]}</span>'
            f'<span class="clase">{f["clase"]}</span><span class="profe">{f["profe"]}</span></div>'
            for f in d["franjas"])
        dias += f'<div class="dia"><div class="dia-nombre">{d["dia"]}</div>{filas}</div>'
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      :root {{ --gold:#c9a84c; --gold-light:#e8c96a; --gold-dark:#8a6820; --rosa:#e5486f; --rosa-light:#ff7d9c; }}
      body {{ font-family: Georgia, serif; background:#0a0a0a; color:#fff; width:1080px; }}
      .tarjeta {{ padding:56px 64px 48px; background:
        radial-gradient(ellipse at top, rgba(201,168,76,0.10), transparent 55%), #0a0a0a; }}
      .cab {{ text-align:center; }}
      .cab img {{ width:280px; margin-bottom:18px; }}
      .cab .sub {{ color:#999; font-style:italic; letter-spacing:1px; margin-top:6px; font-size:1.05rem; }}
      h1 {{ color:var(--gold); font-size:3.2rem; letter-spacing:6px; text-transform:uppercase; }}
      .cupo {{ color:var(--rosa-light); font-size:1.1rem; margin-top:8px; letter-spacing:2px; }}
      .divider {{ width:140px; height:2px; background:linear-gradient(90deg,transparent,var(--gold),transparent); margin:30px auto; }}
      ul {{ list-style:none; columns:2; column-gap:48px; margin:0 30px; }}
      li {{ color:#e8e8e8; font-size:1.45rem; padding:8px 0; break-inside:avoid; }}
      li::before {{ content:'•'; color:var(--rosa); margin-right:13px; }}
      .horarios {{ margin-top:40px; }}
      .horarios h2 {{ color:var(--gold); font-size:1.5rem; letter-spacing:3px; text-transform:uppercase; text-align:center; }}
      .dia {{ margin-top:26px; }}
      .dia-nombre {{ color:var(--gold-light); font-size:1.2rem; letter-spacing:3px; text-transform:uppercase; text-align:center; margin-bottom:12px; }}
      .franja {{ display:grid; grid-template-columns:210px 1fr auto; gap:14px; align-items:baseline; padding:11px 20px; border-radius:6px; font-size:1.25rem; }}
      .franja + .franja {{ margin-top:6px; }}
      .hora {{ color:#999; font-variant-numeric:tabular-nums; }}
      .clase {{ color:#e8e8e8; }}
      .profe {{ color:#8d8d8d; font-style:italic; font-size:1.05rem; text-align:right; }}
      .franja.ladies {{ background:rgba(229,72,111,0.14); border:1px solid rgba(229,72,111,0.4); }}
      .franja.ladies .clase {{ color:var(--rosa-light); font-weight:bold; }}
      .franja.libre .clase, .franja.libre .hora {{ color:#555; }}
      .pie {{ text-align:center; color:var(--gold-light); font-style:italic; margin-top:42px; font-size:1.2rem; }}
    </style></head><body><div class="tarjeta">
      <div class="cab">
        <img src="{LOGO_B64}">
        <h1>{g["nombre"]}</h1>
        <div class="sub">Ladies Salsa Soul · Nivel Intermedio · Martes y Jueves</div>
        <div class="cupo">{g["cupo"]}</div>
      </div>
      <div class="divider"></div>
      <ul>{items}</ul>
      <div class="horarios"><h2>Horarios</h2>{dias}</div>
      <p class="pie">Bailamos juntas, crecemos juntas 💃</p>
    </div></body></html>"""


SALIDA.mkdir(parents=True, exist_ok=True)
# eliminar versiones viejas
for viejo in SALIDA.glob("LADIES GRUPO * - lista y horarios.png"):
    viejo.unlink()
    print(f"🗑️ Eliminado: {viejo.name}")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1080, "height": 1400}, device_scale_factor=2)
    for g in grupos:
        pg.set_content(html_grupo(g), wait_until="networkidle")
        ruta = SALIDA / f"LADIES {g['nombre'].upper()} - lista y horarios.png"
        pg.locator(".tarjeta").screenshot(path=str(ruta))
        print(f"✅ {ruta}")
    b.close()
