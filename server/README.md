# Smart Vanity API

Нужен Node.js 22 или новее. Из корня репозитория установите зависимости командой `npm ci`. Затем из `server/` запустите `npm start`. `GET http://127.0.0.1:3000/api/health` возвращает `200 OK` и `{"status":"ok"}`.

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
