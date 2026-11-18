# RusCraft

Веб-версия воксельной песочницы на основе открытого исходного кода
[Luanti (ex-Minetest)](https://www.luanti.org/) — полностью в браузере, интерфейс на
русском языке.

**Статус:** играется локально ✅ и **выложено на VPS** ✅ (через Docker). S1 и
авто-часть S2 готовы; S6/S7 — инфраструктура стоит (wss-прокси + сайт на VPS),
осталась ручная проигровка и E2E-инвайт. Смотри `docs/PLAN.md`.

**Живой сайт:** https://ruscraft.example.com:8443/ — настоящий сертификат
Let's Encrypt (ECC; http://ruscraft.example.com → 301 туда же; продление — acme.sh
кроном, само перезапускает контейнер). Состав и порядок обновления: `deploy/server/README.md`.
Мультиплеер: **wss://ruscraft.example.com:8444** (lwproxy напрямую; E2E проверен:
браузер-хост + десктоп Luanti по invite-порту). Не /mtproxy — тот ломает invite по IP.
Важно: OPFS привязан к origin — миры со старого адреса `https://203.0.113.10:8443`
на домене не видны; играем на домене.

**Уже запущено локально:** сервер на `http://127.0.0.1:8484` (`node scripts/serve.js`, лог
`serve.log`, остановка: `pkill -f serve.js`). В браузере — «Играть в RusCraft».

## Как это устроено

- Движок Luanti компилируется в WebAssembly харнессом
  [paradust7/luanti-wasm](https://github.com/paradust7/luanti-wasm) (MIT).
- Миры хранятся локально в браузере (OPFS). Сетевая игра — через WSS-прокси
  ([lwproxy](https://github.com/paradust7/lwproxy), MIT).
- Русский интерфейс: переводы Luanti (gettext) включены в сборку
  (`ENABLE_GETTEXT=TRUE`), язык по умолчанию — `ru`.
- Никакого собственного бэкенда: статическая выкладка + опциональный прокси.

## Быстрый старт (когда появится сборка)

```bash
# в каталоге репозитория, собранная статика лежит в www/
node scripts/serve.js          # http://127.0.0.1:8484
node scripts/serve.js --selftest   # только проверка заголовков COOP/COEP
```

Требования браузера: WebAssembly + SharedArrayBuffer + OPFS; сервер обязателен
с заголовками `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`
(их ставит `scripts/serve.js` или `www/.htaccess` из сборки).

## Карта репозитория

| Путь | Что |
|---|---|
| `docs/RESEARCH.md` | верифицированные факты о Luanti/luanti-wasm (2026-11-18) |
| `docs/PLAN.md` | пошаговый строительный план (blueprint) |
| `docs/BUILD.md` | как собирать wasm (CI / WSL2) |
| `docs/LICENSES.md` | лицензии и атрибутция (LGPL/MIT/CC BY-SA) |
| `CONSTRAINTS.md` | Quality bar проекта |
| `scripts/serve.js` | локальный стат-сервер с COOP/COEP |
| `.github/workflows/ruscraft-build.yml` | CI: docker-сборка wasm → артефакт `ruscraft-www` |
| `deploy.sh` | хук сборки: игровой пак Minetest Game (пин `versions.lock`) |
| `versions.lock` | зафиксированные ревизии движка/харнесса/игры |
| `scripts/fetch-artifact.ps1` | загрузка артефакта CI на эту машину (нужен `gh`) |
| `proxy/` | план self-hosted WSS-прокси (lwproxy), шаг S6 |
| `deploy/nginx.conf` | шаблон выкладки на VPS (шаблон S7) |
| `Dockerfile` | Linux-образ сборки (emsdk + зависимости + Luanti) |
| `static/` | наша русская оболочка лаунчера (форк статики харнесса) |
| `docs/UPSTREAM-luanti-wasm.md` | оригинальный README харнесса |
| `www/` | выходные артефакты сборки (в .gitignore) |

## Лицензии

Luanti — LGPL-2.1-or-later; luanti-wasm — MIT; игровые паки — LGPL/MIT/GPL+CC BY-SA
(детали: `docs/LICENSES.md`). RusCraft открыт: ссылка на исходники — в экране «Об игре».

## Название

«RusCraft» — независимый проект на базе Luanti. Не аффилирован с Luanti/Minetest
и Mojang/Minecraft. «Построено на Luanti» — обязательная атрибуция.
