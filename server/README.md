# Smart Vanity API

Нужен Node.js 22 или новее. Из корня репозитория установите зависимости командой `npm ci`. Затем из `server/` запустите `npm start`. `GET http://127.0.0.1:3000/api/health` возвращает `200 OK` и `{"status":"ok"}`.

Для совместного запуска с клиентом в браузере скопируйте корневой `.env.example` в `.env` и запустите из корня `npm run server:start` и `npm run mobile:dev` в разных терминалах. Fastify слушает порт `API_PORT` из `.env`, а Vite направляет `/api/*` на тот же порт. Ответ API можно проверить по адресу `http://localhost:8082/api/health`. После изменения `API_PORT` перезапустите оба процесса.

## Выкладка

Из `server/` запустите `npm run deploy`. В Windows PowerShell с ограничением на скрипты используйте `npm.cmd run deploy`. Нужны `tar`, OpenSSH, доступ к `deploy@quiz.filinda.ru` через SSH и проверенный ключ хоста в `known_hosts`.

Команда передаёт по SSH архив с текущим `server/src/` и файлами npm. Включаются новые и незакоммиченные исходники. Скрипт на VPS ставит зависимости, активирует релиз и проверяет локальный и публичный `/api/health`. При сбое он восстанавливает предыдущий релиз, если он есть.

## Первичная настройка Debian

На VPS нужны Node.js 22 или новее и `npm` в системном `PATH`, а также `sudo`, `curl`, `tar` и `flock`. Один раз создайте пользователей, если их ещё нет:

```sh
adduser --disabled-password --gecos '' deploy
adduser --system --group --no-create-home smart-vanity
```

Установите разрешённый публичный SSH-ключ в `/home/deploy/.ssh/authorized_keys` от имени `deploy`.

Передайте на VPS файлы из `server/deploy/`. Выполните от root из каталога с ними:

```sh
install -d -m 0755 -o deploy -g deploy /opt/smart-vanity /opt/smart-vanity/releases
install -m 0755 deploy.sh /usr/local/bin/smart-vanity-deploy
install -m 0644 smart-vanity-api.service /etc/systemd/system/smart-vanity-api.service
visudo -cf smart-vanity.sudoers
install -m 0440 smart-vanity.sudoers /etc/sudoers.d/smart-vanity
systemctl daemon-reload
systemctl enable smart-vanity-api.service
```

Установите отдельный конфиг Caddy командой `install -m 0644 smart-vanity.caddy /etc/caddy/smart-vanity.caddy`. Один раз добавьте `import /etc/caddy/smart-vanity.caddy` в общий `/etc/caddy/Caddyfile` на верхнем уровне. Проверьте конфигурацию командой `caddy validate --config /etc/caddy/Caddyfile`, затем примените её через `systemctl reload caddy`.

Первый `npm run deploy` сам запустит службу. Для изменения маршрутов отдельно обновите `/etc/caddy/smart-vanity.caddy`, проверьте конфигурацию и перезагрузите Caddy. Обычная выкладка API Caddy не редактирует.

## Тестовая выкладка

Из корня репозитория запустите `npm run server:deploy:test` или из `server/` запустите `npm run deploy:test`. Команда собирает браузерный клиент и отправляет его вместе с текущим кодом API. Релизы хранятся в `/opt/smart-vanity-test`, API слушает `127.0.0.1:3001`, а Caddy обслуживает клиент и API на `https://smartvanity.filinda.ru/test/`.

Перед первой тестовой выкладкой подготовьте окружение на VPS. Из каталога с файлами `server/deploy/` выполните от root:

```sh
adduser --system --group --no-create-home smart-vanity-test
install -d -m 0755 -o deploy -g deploy /opt/smart-vanity-test /opt/smart-vanity-test/releases
install -m 0755 deploy.sh /usr/local/bin/smart-vanity-deploy-test
install -m 0644 smart-vanity-api-test.service /etc/systemd/system/smart-vanity-api-test.service
visudo -cf smart-vanity-test.sudoers
install -m 0440 smart-vanity-test.sudoers /etc/sudoers.d/smart-vanity-test
systemctl daemon-reload
systemctl enable smart-vanity-api-test.service
install -m 0644 smart-vanity-test.caddy /etc/caddy/smart-vanity-test.caddy
```

Создайте `/etc/caddy/smart-vanity-test.users` с отдельной строкой `логин хеш` для каждого тестировщика. Хеш можно получить командой `caddy hash-password`, которая запросит пароль. Выдайте право чтения этого файла пользователю Caddy. Затем добавьте `import /etc/caddy/smart-vanity-test.caddy` внутрь блока `smartvanity.filinda.ru` в `/etc/caddy/smart-vanity.caddy`. Шаблон использует `basicauth` для совместимости с Caddy 2.6 на VPS. Выполните `caddy validate --config /etc/caddy/Caddyfile` перед `systemctl reload caddy`.

Тестовая выкладка проверяет, что Fastify возвращает `200` на внутреннем порту и что публичный `/test/api/health` без пароля возвращает `401`. Если проверка не проходит, скрипт возвращает предыдущий тестовый релиз. После первой выкладки откройте `/test/` и `/test/api/health` с учётными данными тестировщика, чтобы проверить клиент и API через Caddy.
