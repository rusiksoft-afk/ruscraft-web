# Self-hosted WSS-прокси для RusCraft (шаг S6)

Браузер не умеет TCP/UDP, поэтому сетевая игра Luanti идёт через WebSocket-прокси
(websocket → Luanti-пакеты). Исходный код прокси: <https://github.com/paradust7/lwproxy>
(Rust, MIT). Клиентская часть уже вшита в wasm (webshims/emsocket).

## Что нужно от VPS

1. Публичный домен + TLS (let's encrypt) — браузер подключается по `wss://`.
2. Возможность запустить контейнер/бинарник и открыть порт 443 (или отдельный).
3. nginx: location `/mtproxy` с `proxy_http_version 1.1`, `Upgrade`/`Connection`
   заголовками → lwproxy на localhost.

## Предварительный план (не проверено — сделать на S6)

```bash
# собрать или скачать lwproxy; запуск с listen на 127.0.0.1:8080
# nginx location:
#   location /mtproxy { proxy_pass http://127.0.0.1:8080; ws-upgrade-заголовки; }
```

После запуска — вписать URL вида `wss://<домен>/mtproxy` в `static/index.html`
(массив `PROXIES`) и пересобрать. Публичные прокси dustlabs остаются резервными.

Метрики/лимиты/аунд — на S6.
