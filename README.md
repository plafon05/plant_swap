<div align="center">

# PlantSwap

![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat-square&logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-required-2496ED?style=flat-square&logo=docker&logoColor=white)

</div>

---

## О проекте

PlantSwap — веб-приложение для любителей комнатных растений. Пользователи могут добавлять свои растения, предлагать их для обмена, откликаться на чужие предложения и отслеживать историю своих обменов.

**Основные возможности:**
- Каталог растений с фильтрацией по типу и региону
- Система предложений обмена с уведомлениями
- Загрузка фотографий растений и аватара
- Личный кабинет с историей обменов
- Статистика и отчёты по активности платформы

---

## Стек технологий

| Слой | Технологии |
|------|-----------|
| **Backend** | Go 1.21, Gin, GORM, JWT |
| **Frontend** | React 18, TypeScript, Vite, Zustand, Axios |
| **База данных** | PostgreSQL 17 |
| **Инфраструктура** | Docker, Docker Compose |

---

## Структура проекта

```
plantswap/
├── backend/
│   ├── cmd/main.go                        — точка входа
│   ├── configs/
│   │   └── local.yaml                     — конфигурация
│   ├── internal/
│   │   ├── config/config.go
│   │   ├── http-server/
│   │   │   ├── handlers/                  — auth, plants, offers, reports, upload
│   │   │   └── middleware/                — JWT, logger
│   │   └── storage/                       — модели и PostgreSQL репозиторий
│   │       ├── models/
│   │       ├── postgres/
│   │       └── storage.go
│   ├── uploads/                           — загруженные фото
│   ├── .env                               — секреты (не в Git)
│   ├── .gitignore
│   ├── docker-compose-local.yml
│   └── Makefile
├── frontend/
    ├── src/
    │   ├── api/                           — HTTP клиент (Axios)
    │   ├── components/                    — Navbar, PlantCard, ImageUpload, модалки
    │   │   └── models/
    │   ├── context/
    │   ├── pages/                         — Auth, Plants, Offers, History, Reports, Profile
    │   ├── store/                         — Zustand (авторизация)
    │   ├── types/                         — TypeScript типы
    │   ├── utils/
    │   ├── App.tsx/
    │   ├── index.css/ 
    │   ├── main.tsx/ 
    │   ├── vite-env.d.ts/
    ├── .env
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts                         
```

---

<br>

# 🚀 Локальное развёртывание

## Системные требования

| Инструмент | Версия | Проверка |
|-----------|--------|---------|
| Go | 1.21+ | `go version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Docker Desktop | 4+ | `docker --version` |

## 1. Клонирование репозитория

```bash
git clone https://github.com/plafon05/plant_swap.git
cd plant_swap
```

## 2. Настройка бэкенда

Создайте файл `backend/.env`:

```env
ENV=local
CONFIG_PATH=configs/local.yaml

DB_PASSWORD=ваш_пароль

# Сгенерировать: openssl rand -hex 32
JWT_SECRET=замените_на_случайную_строку_минимум_32_символа
```

> ⚠️ Файл `.env` добавлен в `.gitignore` — не добавляйте его в репозиторий.

Конфигурационный файл `backend/configs/local.yaml` уже настроен:

```yaml
env: local
server:
  port: "8081"
  allowed_origins:
    - "http://localhost:5173"
db:
  host: "localhost"
  port: "5433"
  user: "dzheltov"
  name: "plant_swap"
  ssl_mode: "disable"
jwt:
  expires_dur: 72h
```

## 3. Запуск базы данных

```bash
cd backend

# Запустить PostgreSQL в Docker
make db-up

# Убедиться что контейнер работает
make check
# ✅ PostgreSQL доступен
```

| Команда | Описание |
|---------|---------|
| `make db-up` | Запустить PostgreSQL контейнер |
| `make db-down` | Остановить контейнер (данные сохраняются) |
| `make db-logs` | Логи PostgreSQL |
| `make psql` | Подключиться через psql |
| `make db-reset` | Полный сброс БД (удаляет все данные) |
| `make check` | Проверить конфигурацию и доступность |

> 💡 Таблицы создаются **автоматически** при первом запуске бэкенда через GORM AutoMigrate.

## 4. Запуск бэкенда

```bash
# В папке backend/
go mod tidy
make run

```

Проверка:

```bash
curl http://localhost:8081/api/v1/health
# {"status":"ok"}
```

## 5. Запуск фронтенда

Откройте **новый терминал**:

```bash
cd frontend

# Создайте файл frontend/.env
echo "VITE_API_URL=http://localhost:8081/api/v1" > .env

npm install
npm run dev

# ➜  Local:   http://localhost:5173
```

## 6. Готово

Откройте [http://localhost:5173](http://localhost:5173) в браузере.

| Страница | URL |
|---------|-----|
| Вход / регистрация | `/login` |
| Каталог растений | `/` |
| Мои растения | `/my-plants` |
| Обмены | `/offers` |
| История | `/history` |
| Отчёты | `/reports` |
| Профиль | `/profile` |

```

## Типичные проблемы

<details>
<summary>PostgreSQL недоступен</summary>

Откройте Docker Desktop, убедитесь что он запущен, затем:
```bash
make db-up
```
</details>

<details>
<summary>failed to load config</summary>

Файл `backend/.env` не создан или находится не в той папке. Создайте его согласно пункту 2.
</details>

<details>
<summary>Port already in use</summary>

```bash
# Освободить порт 8081
lsof -ti:8081 | xargs kill

# Освободить порт 5173
lsof -ti:5173 | xargs kill
```
</details>

<details>
<summary>CORS ошибка в браузере</summary>

Убедитесь что в `backend/configs/local.yaml` в `allowed_origins` указан `http://localhost:5173`.
</details>

---

<br>

# 📡 Документация API

**Base URL:** `http://localhost:8081/api/v1`

Все защищённые маршруты требуют заголовок:
```
Authorization: Bearer <token>
```
Токен выдаётся при входе или регистрации. `*` — обязательный параметр.

---

## Аутентификация

| Метод | Маршрут | Описание | Body | Auth |
|-------|---------|---------|------|------|
| `POST` | `/auth/register` | Регистрация | `name*`, `email*`, `password*`, `region` | — |
| `POST` | `/auth/login` | Вход | `email*`, `password*` | — |

**Ответ:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": 1, "name": "Анна", "email": "anna@plants.ru" }
}
```

Коды ответа: `201/200` успех · `400` ошибка валидации · `401` неверные данные · `409` email занят

---

## Профиль

| Метод | Маршрут | Описание | Body | Auth |
|-------|---------|---------|------|------|
| `GET` | `/profile` | Получить профиль | — | JWT |
| `PUT` | `/profile` | Обновить профиль | `name`, `email`, `region`, `bio`, `avatar`, `old_password`, `new_password` | JWT |

Коды ответа: `200` успех · `400` ошибка валидации · `401` неверный пароль

---

## Загрузка файлов

| Метод | Маршрут | Описание | Body | Auth |
|-------|---------|---------|------|------|
| `POST` | `/upload` | Загрузить изображение | `file*` (multipart/form-data) | JWT |

Допустимые форматы: JPG, PNG, WEBP, GIF. Максимальный размер: 5MB.

**Ответ:**
```json
{ "url": "http://localhost:8081/uploads/1234567890.jpg" }
```

Коды ответа: `200` успех · `400` неверный тип или размер · `401` не авторизован

---

## Растения

| Метод | Маршрут | Описание | Body / Query | Auth |
|-------|---------|---------|------|------|
| `GET` | `/plants` | Список растений | `?type`, `?region`, `?search`, `?page`, `?limit` | JWT |
| `GET` | `/plants/my` | Мои растения | — | JWT |
| `GET` | `/plants/search` | Поиск | `?q` | JWT |
| `GET` | `/plants/:id` | Растение по ID | — | JWT |
| `POST` | `/plants` | Добавить растение | `name*`, `type*`, `species`, `description`, `image_url`, `region` | JWT |
| `PUT` | `/plants/:id` | Обновить (своё) | `name`, `type`, `species`, `description`, `image_url`, `region`, `is_available` | JWT |
| `DELETE` | `/plants/:id` | Удалить (своё) | — | JWT |

Допустимые значения `type`: `flowering`, `cactus`, `fern`, `succulent`, `tropical`, `herb`, `tree`, `vine`, `other`

Коды ответа: `200/201` успех · `403` не ваше растение · `404` не найдено · `500` ошибка

---

## Предложения обмена

| Метод | Маршрут | Описание | Body / Query | Auth |
|-------|---------|---------|------|------|
| `GET` | `/offers` | Список предложений | `?type`, `?region`, `?status` | JWT |
| `GET` | `/offers/compatible` | Совместимые с моими растениями | — | JWT |
| `GET` | `/offers/:id` | Предложение по ID | — | JWT |
| `POST` | `/offers` | Создать предложение | `offered_plant_id*`, `wanted_types`, `wanted_region`, `description` | JWT |
| `PUT` | `/offers/:id` | Обновить (своё, статус open) | `wanted_types`, `wanted_region`, `description` | JWT |
| `DELETE` | `/offers/:id` | Удалить (нельзя если pending) | — | JWT |
| `POST` | `/offers/:id/request` | Запросить обмен | `requested_plant_id*` | JWT |
| `PATCH` | `/offers/:id/accept` | Принять запрос | — | JWT |
| `PATCH` | `/offers/:id/reject` | Отклонить запрос | — | JWT |


Коды ответа: `200/201` успех · `403` не ваш оффер · `409` конфликт статуса · `404` не найдено

---

## История обменов

| Метод | Маршрут | Описание | Auth |
|-------|---------|---------|------|
| `GET` | `/history` | История (входящие и исходящие) | JWT |
| `GET` | `/history/:id` | Детали обмена | JWT |

Коды ответа: `200` успех · `404` не найдено · `500` ошибка

---

## Отчёты и статистика

| Метод | Маршрут | Описание | Auth |
|-------|---------|---------|------|
| `GET` | `/reports/active-users` | Топ-10 активных пользователей | JWT |
| `GET` | `/reports/popular-plants` | Топ-10 популярных растений | JWT |
| `GET` | `/reports/stats` | Общая статистика платформы | JWT |

**Ответ `/reports/stats`:**
```json
{
  "total_users": 42,
  "total_plants": 156,
  "total_trades": 38,
  "open_offers": 24
}
```

---

## Системные

| Метод | Маршрут | Описание | Auth |
|-------|---------|---------|------|
| `GET` | `/health` | Проверка работоспособности | — |

---