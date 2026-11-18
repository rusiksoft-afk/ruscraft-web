# Сборка RusCraft (wasm)

Собрать Luanti в WebAssembly можно только в Linux-окружении. Два маршрута.

## Маршрут A — CI на GitHub Actions (рекомендуется)

1. Создать репозиторий (например `ruscraft/ruucraft` — имя на согласование) и импортировать
   форк `paradust7/luanti-wasm` (Settings → Fork импорта, или `git clone` + push).
2. Положить наш `.github/workflows/build.yml` (пишется на шаге S1): ubuntu-latest,
   `docker build` харнесса, извлечение `www/` (`docker run --rm ... cp -r /luanti-wasm/www
   /out`), `actions/upload-artifact`.
3. Забрать артефакт локально: `gh run download <run_id> -n www` (нужен `gh auth login`).

Ориентировочное время: 40–90 мин. Если линковка падает по RAM — см. троттлинг флагов
в `docs/RESEARCH.md` §5 (INITIAL_MEMORY / -O1).

## Маршрут B — локально через WSL2

```powershell
# от администратора, один раз (потребуется перезагрузка):
wsl --install -d Ubuntu-22.04
```

Затем в WSL:

```bash
sudo apt-get update && sudo apt-get install -y \
    build-essential cmake tclsh zstd gettext git wget python3 zip
git clone https://github.com/paradust7/luanti-wasm.git
cd luanti-wasm
./build_all.sh          # emsdk скачается сам; www/ в конце
```

Клон кладём в `~/luanti-wasm` WSL; для локального запуска `www/` копируем в наш
репозиторий (`/mnt/c/Users/rusik/.RusCraft/www`) и запускаем `node scripts/serve.js`.

## Что дальше после сборки

`www/` целиком самодостаточен (есть `.htaccess` с нужными заголовками). Локально —
`node scripts/serve.js`; на сервере — nginx/Caddy с теми же заголовками (см. S7).

## Пины версий

Текущие зафиксированные ревизии (см. также `docs/RESEARCH.md`):

- luanti-wasm: `main` на 2026-10 (sha фиксируем в `versions.lock` при первом клоне)
- движок: `paradust7/luanti@webport` = `6f532b5ed03a6aa70091412114b5dde3d33c6f87`
- webshims: `70653a91c974aa2b20df09a39f858d92e663c1a7`
