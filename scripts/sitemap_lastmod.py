#!/usr/bin/env python3
"""Пересчитывает <lastmod> в public/sitemap.xml по настоящим датам правок: git (файл страницы)
и updated_at из Supabase (тексты тестов / «Обо мне» / настройки главной). Запуск из корня репо:
    python3 scripts/sitemap_lastmod.py
Блог не включаем, пока в нём меньше 5 статей (контент подгружается скриптом, страница тонкая)."""
import re, subprocess, json, urllib.request, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SB = "https://iuvvheeocobhiothfgei.supabase.co/rest/v1/"
KEY = re.search(r"eyJ[\w.-]+", (ROOT / "public/assets/cms.js").read_text(encoding="utf-8")).group(0)  # публичный anon-ключ
TODAY = datetime.date.today().isoformat()

def sb(path):
    req = urllib.request.Request(SB + path, headers={"apikey": KEY, "Authorization": "Bearer " + KEY})
    return json.load(urllib.request.urlopen(req, timeout=20))

def git_date(rel):
    if subprocess.run(["git", "status", "--porcelain", "--", rel], cwd=ROOT, capture_output=True, text=True).stdout.strip():
        return TODAY                                   # есть невыкоммиченные правки
    out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", rel], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return out or TODAY

def newest(table):
    r = sb(f"{table}?select=updated_at&order=updated_at.desc&limit=1"); return r[0]["updated_at"][:10] if r else "1970-01-01"

tests = {t["slug"]: t["updated_at"][:10] for t in sb("valya_tests?enabled=eq.true&select=slug,updated_at")}
settings, about = newest("valya_settings"), newest("valya_about")
PAGES = {"/": "src/pages/index.astro", "/about.html": "src/pages/about.astro", "/free.html": "src/pages/free.astro",
         "/tests/": "public/tests/index.html", "/help.html": "public/help.html",
         "/en.html": "src/pages/en/index.astro", "/en/about.html": "src/pages/en/about.astro", "/en/free.html": "src/pages/en/free.astro",
         "/es.html": "src/pages/es/index.astro", "/es/about.html": "src/pages/es/about.astro", "/es/free.html": "src/pages/es/free.astro"}
def lastmod(path):
    if path in PAGES:
        d = git_date(PAGES[path])
        if path == "/": d = max(d, settings)
        if path == "/about.html": d = max(d, about)
        return d
    m = re.fullmatch(r"/tests/([\w-]+)\.html", path)
    if m: return git_date(f"public/tests/{m.group(1)}.html")
    m = re.fullmatch(r"/test/([\w-]+)\.html", path)
    if m: return max(git_date("src/pages/test/[slug].astro"), tests.get(m.group(1), "1970-01-01"))
    m = re.fullmatch(r"/stati/([\w-]+)\.html", path)
    if m and (ROOT / f"src/content/articles/{m.group(1)}.md").exists():
        u = re.search(r"^updated: (\S+)", (ROOT / f"src/content/articles/{m.group(1)}.md").read_text(encoding="utf-8"), re.M)
        return u.group(1) if u else TODAY
    if path == "/stati.html" or path.startswith("/stati/hub/"):
        return max((re.search(r"^updated: (\S+)", f.read_text(encoding="utf-8"), re.M) or [0, "1970-01-01"])[1] for f in (ROOT / "src/content/articles").glob("*.md"))
    raise SystemExit("нет правила lastmod для " + path)

p = ROOT / "public/sitemap.xml"; xml = p.read_text(encoding="utf-8"); out = []
for line in xml.splitlines():
    m = re.search(r"<loc>https://ageeva\.win(/[^<]*)</loc>", line)
    if not m: out.append(line); continue
    path = m.group(1)
    if path == "/blog.html": continue                              # см. docstring
    out.append(re.sub(r"<lastmod>[^<]*</lastmod>", f"<lastmod>{lastmod(path)}</lastmod>", line))
p.write_text("\n".join(out) + ("\n" if xml.endswith("\n") else ""), encoding="utf-8")
print("sitemap:", sum('<loc>' in l for l in out), "адресов")
