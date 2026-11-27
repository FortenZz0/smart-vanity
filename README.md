# Проект Smart Vanity
Проект Smart Vanity реализован в рамках дисциплины "Управление проектной деятельностью" ТулГУ

В разработке принимали участие студенты группы 220052-11:
- Верховцев И.В.
- Донская Е.Д.
- Филин Д.А.


## NPM Команды
Инициализация проекта
```bash
npm i
```

### Команды WEB разработки
Запуск локального сервера на основе папки _/web/**app**_ сервера для **web** приложения (для разработки)
```bash
npm run web-dev
```
Сборка **web** приложения (создаётся папка _/web/dist_)
```bash
npm run web-build
```
Запуск локального сервера на основе папки _/web/**dist**_ сервера для **web** приложения (для проверки сборки)
```bash
npm run web-preview
```

### Команды ANDROID разработки
Мобильное приложение находится в npm workspace `mobile`.

Перед первым открытием проекта в Android Studio выполните эту команду из корня репозитория. Она собирает мобильное приложение и создаёт `mobile/android`.
```bash
npm run android:init
```
Запуск локального сервера на основе папки _/mobile/**app**_ сервера для **android** приложения (для разработки)
```bash
npm run mobile:dev
```
Сборка **android** приложения (создаётся папка _/mobile/dist_)
```bash
npm run mobile:build
```
Запуск локального сервера на основе папки _/mobile/**dist**_ сервера для **android** приложения (для проверки сборки)
```bash
npm run mobile:preview
```
Синхронизация текущей сборки и запуск Android Studio для сборки APK
```bash
npm run android:open
```

Сборка APK из корня репозитория:
```bash
npm run android:apk -- --debug
npm run android:apk -- --release
```

Команды собирают мобильное приложение, синхронизируют Capacitor и копируют APK
в `mobile/android/dist/debug` или `mobile/android/dist/release` соответственно.
Для запуска нужны JDK и Android SDK. Gradle подписывает debug APK отладочным ключом.

#### Релизный APK для RuStore

Первый релиз использует пакет `ru.filinda.smartvanity`, имя версии `1.0` и код версии `1`.
Параметры версии находятся в `mobile/native/smart-vanity-release.gradle`.
Для следующего релиза увеличьте `versionCode` и используйте тот же ключ подписи.

Перед запуском команды `npm run android:apk -- --release` задайте в локальной сессии переменные окружения:

| Переменная | Значение |
| --- | --- |
| `SMART_VANITY_KEYSTORE` | Абсолютный путь к вашему keystore |
| `SMART_VANITY_KEYSTORE_PASSWORD` | Пароль keystore |
| `SMART_VANITY_KEY_ALIAS` | Псевдоним ключа подписи |
| `SMART_VANITY_KEY_PASSWORD` | Пароль ключа подписи |

Храните файл ключа и пароли вне репозитория. Если параметров подписи нет, сборка релизного APK завершится ошибкой.

#### Запуск с примерами товаров

`npm run mobile:dev:demo` запускает мобильное приложение в браузере с отдельной SQLite-базой. При её первом открытии добавляются 20 товаров без фото, в том числе архивные. Сроки рассчитываются относительно даты первого запуска.

Для Android выполните `npm run mobile:build:demo`, затем `npm run android:open`. Обычная и демо-сборка используют `mobile/dist`. Чтобы вернуть обычную сборку, выполните `npm run mobile:build` перед `npm run android:open`.
