#!/usr/bin/env python3
"""Публикует статью(и): draft: true → false + строки в public/sitemap.xml (статья, хаб, индекс /stati.html).
    python3 scripts/publish_article.py kak-pomiritsya-posle-ssory [slug2 ...]
Потом: npm run build (проверка) → git add (явные пути) → commit → push. Только по согласию Вали."""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
sm = ROOT / "public/sitemap.xml"; xml = sm.read_text(encoding="utf-8")
def add(path, xml):
    loc = f"https://ageeva.win{path}"
    if f"<loc>{loc}</loc>" in xml: return xml
    entry = f"  <url><loc>{loc}</loc><lastmod>2026-01-01</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n"
    return xml.replace("</urlset>", entry + "</urlset>")
for slug in sys.argv[1:]:
    f = ROOT / f"src/content/articles/{slug}.md"; t = f.read_text(encoding="utf-8")
    hub = re.search(r"^hub: (\S+)", t, re.M).group(1)
    f.write_text(re.sub(r"^draft: true", "draft: false", t, count=1, flags=re.M), encoding="utf-8")
    for p in (f"/stati/{slug}.html", f"/stati/hub/{hub}.html", "/stati.html"): xml = add(p, xml)
    print("опубликована:", slug)
sm.write_text(xml, encoding="utf-8")
print("дальше: python3 scripts/sitemap_lastmod.py (пересчитает lastmod)")
