# RusCraft — исследовательская записка (2026-11-18)

Проверенные факты по проекту Luanti (ex-Minetest) и его веб-порту. Всё подтверждено
запросами к GitHub API / raw-файлам в дату выше; ссылки — для перепроверки.

## 1. Движок Luanti (оригинал)

- Репозиторий: <https://github.com/luanti-org/luanti> (13.9k★, пуш 2026-11-16).
- Лицензия: LGPL-2.1-or-later (код движка), медиа — CC BY-SA (см. `LICENSE.txt` в репо).
- Последний релиз: **5.18.0** (2026-10-29).
- Интерфейс полностью переводится: каталог `po/` + gettext; русский `po/ru` — один из
  самых полных переводов (Weblate: <https://weblate.luanti.org/>).
- Официального веб-сборки в апстриме **нет** (`git tree` репо не содержит ни одного
  файла wasm/emscripten — проверено рекурсивно).

## 2. Веб-порт: paradust7/luanti-wasm (ключевая находка)

- Репозиторий: <https://github.com/paradust7/luanti-wasm> (139★, активность 2026-10,
  **MIT** — совместим с любым нашим лицензированием).
- Автор — paradust7, контрибьютор Luanti; это актуальный наследник старого minetest-wasm
  (старый `minetest/minetest-wasm` удалён — 404).
- Движок собирается из форка <https://github.com/paradust7/luanti>, ветка `webport`:
  на момент исследования **80 коммитов вперёд / 4 позади** апстрим-master, т.е. база
  ≈ Luanti 5.18-dev (последний merge master — 2026-10-16).
- Сборка: Docker/Ubuntu (`build_all.sh`: emsdk + curl + openssl + libarchive + libzip +
  zstd + webshims + Luanti). Требуется Linux (build-essential, cmake, tclsh, gettext).
  В CI-workflow репо — docker-build на ubuntu.
- Ключевые флаги сборки (из `build_luanti.sh`):
  - `-DENABLE_GETTEXT=TRUE` → **.mo-переводы компилируются и попадают в fsroot** —
    русский интерфейс «из коробки»;
  - `-sINITIAL_MEMORY=2013265920` (2 ГБ), `-sPTHREAD_POOL_SIZE=22`,
    SharedArrayBuffer/потоки → **обязательны COOP/COEP-заголовки** (crossOriginIsolated);
  - `-sMIN_WEBGL_VERSION=2`, GLES-путь, SDL2 через emscripten;
  - эмулированные порты: zlib, libjpeg, libpng, freetype, ogg, vorbis, sqlite3.
- Хранение миров: **OPFS** (Origin Private File System), пакуется всё дерево `/luanti`;
  контент — «дата-паки» (`base.pack`, `certs.pack`, доп. паки через `deploy.sh`),
  кэшируются по URL с ID релиза (immutability). Миры и установленные моды переживают
  обновление сборки.
- Сеть: браузер не может открывать TCP/UDP, поэтому есть **WSS-прокси**
  (`paradust7/webshims` emsocket, сервер — `paradust7/lwproxy`, **MIT, Rust**).
  Публичные прокси dustlabs: `wss://eu1.dustlabs.io/mtproxy` (Франкфурт — ближайший к РФ).
  Также есть режим «сервер прямо в браузере» + invite-ссылка для подключения из
  десктопного Luanti.
- Хостинг-стенд автора: <https://luanti.dustlabs.io/> (на 2026-11-18 — «Coming soon»;
  исторически там игралось; наборы прокси живут).
- Публичных prebuilt-артефактов (releases) у репо **нет** — собирать придётся самим
  (Docker или WSL2), либо через свой CI.
- Локализация лаунчер-страницы: в `static/launcher.js` есть `SUPPORTED_LANGUAGES` —
  **`ru` присутствует**; язык ставится в `minetest.conf` (`language = ru`), поддержан
  `?lang=` и автоопределение по браузеру. Сами строки HTML-оболочки — английские,
  их мы переводим сами (это наша зона).

## 3. Игровые паки (что играем)

| Игра | Лицензия | Характер |
|---|---|---|
| Minetest Game (minetest_game) | смешанная (код LGPL/MIT, медиа CC BY-SA — NOASSERTION) | классическая песочница Luanti — «тот самый оригинал» с сайта luanti.org |
| VoxeLibre (бывш. MineClone2/Mineclonia) | GPL-3.0 (+ медиа CC BY-SA) | максимальное сходство с Minecraft: крафт, мобы, выживание |
| Luanti "devtest" | встроенная | тесты, не для релиза |

- `minetest_game`: <https://github.com/luanti-org/minetest_game> (пуш 2026-10-30).
- VoxeLibre: зеркало на GitHub помечено GPL-3.0; основной хост — git.minetest.land.
- Обе распространяются через ContentDB (встроенный менеджер в Luanti умеет ставить сам,
  в wasm-сборке curl/CA-сертификаты для этого есть).

## 4. Юр. каркас RusCraft

- Luanti движок LGPL-2.1: статическая линковка в wasm → обязуемся открыть исходники
  нашей сборки + сохранить уведомление о лицензии и копию LGPL. В игре делаем экран
  «Об игре» с атрибуцией Luanti и ссылкой на наш репозиторий.
- luanti-wasm харнесс — MIT (атрибуция в NOTICE).
- Игра-джоб: выбор за пользователем (см. вопросы).
- Название **RusCraft** — не используем в маркетинге слова «Minetest/Minecraft» как
  название продукта; указываем «построено на Luanti».

## 5. Требования к железу/софту

- Браузер: WebAssembly + SharedArrayBuffer + pthread + JSPI + WebFetch/OPFS →
  актуальные Chromium/Firefox/Safari; заголовок `Cross-Origin-Opener-Policy: same-origin`
  и `Cross-Origin-Embedder-Policy: require-corp` (**без них не запустится**);
  всё стороннее (шрифты/картинки с чужих CDN) ломает изоляцию — только своё.
- Память: сборка резервирует 2 ГБ под wasm; реально браузеру нужно ~2.5–3 ГБ.
  Можно снизить `INITIAL_MEMORY` под слабые устройства (отдельный профиль сборки).
- Сборка: Linux/Docker или WSL2. На этой машине: Windows 11, Node 24, git есть,
  Docker/WSL/cmake/emcc — **нет**; RAM 95 ГБ, диск C: 620 ГБ свободно — потянет.

## 6. Плановые артефакты сборки, которые мы форкаем/патчим

- `static/index.html`, `static/launcher.js` — оболочка лаунчера (бренд, русский язык).
- `deploy.sh` — крючок доп. паков и выкладки.
- `cache/common.conf` — наши дефолты конфига.
- NEW: `.github/workflows/build.yml` — наш CI с публикацией артефакта `www/`.
- NEW: `scripts/serve.js` — локальный стат-сервер с COOP/COEP (уже в репо).
- NEW: `proxy/` — конфиг self-hosted lwproxy (опционально).
