# Загружаем переменные из .env (если файл существует)
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Цвета для вывода
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: help run build test clean db-up db-down db-logs psql migrate-create migrate-up migrate-down

help: ## Показать все доступные команды
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

run: ## Запустить приложение локально (с переменными из .env)
	@echo "$(GREEN)Запуск приложения...$(NC)"
	@echo "$(YELLOW)Используется БД: postgres://$(DB_USER)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)$(NC)"
	@ENV=local CONFIG_PATH=configs/local.yaml go run cmd/main.go

build: ## Собрать бинарник
	@echo "$(GREEN)Сборка приложения...$(NC)"
	go build -o bin/plantswap cmd/main.go

test: ## Запустить тесты
	@echo "$(GREEN)Запуск тестов...$(NC)"
	go test ./... -v

db-up: ## Запустить PostgreSQL в Docker
	@echo "$(GREEN)Запуск PostgreSQL...$(NC)"
	docker compose -f docker-compose-local.yml up -d
	@echo "$(GREEN)PostgreSQL запущен на порту $(DB_PORT)$(NC)"
	@echo "$(YELLOW)Подключение: postgresql://$(DB_USER):***@localhost:$(DB_PORT)/$(DB_NAME)$(NC)"

db-down: ## Остановить PostgreSQL
	@echo "$(GREEN)Остановка PostgreSQL...$(NC)"
	docker compose -f docker-compose-local.yml down

db-logs: ## Показать логи PostgreSQL
	docker compose -f docker-compose-local.yml logs -f

psql: ## Подключиться к PostgreSQL через psql
	@echo "$(GREEN)Подключение к PostgreSQL...$(NC)"
	@echo "$(YELLOW)Используйте пароль из .env$(NC)"
	docker exec -it plantswap_postgres psql -U $(DB_USER) -d $(DB_NAME)

pgadmin: ## Открыть pgAdmin в браузере
	@open http://localhost:8080 || echo "$(YELLOW)Откройте http://localhost:8080 в браузере$(NC)"

migrate-create: ## Создать новую миграцию (использовать: make migrate-create name=название)
	@if [ -z "$(name)" ]; then \
		echo "$(RED)Ошибка: укажите имя миграции. Пример: make migrate-create name=create_users_table$(NC)"; \
		exit 1; \
	fi
	migrate create -ext sql -dir internal/storage/migrations -seq $(name)

migrate-up: ## Применить миграции
	@echo "$(GREEN)Применение миграций...$(NC)"
	migrate -path internal/storage/migrations -database "postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable" up

migrate-down: ## Откатить последнюю миграцию
	@echo "$(GREEN)Откат миграции...$(NC)"
	migrate -path internal/storage/migrations -database "postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable" down 1

db-reset: ## Сбросить БД (удалить и создать заново)
	@echo "$(RED)ВНИМАНИЕ: Это удалит все данные в БД!$(NC)"
	@read -p "Продолжить? (y/n) " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(YELLOW)Остановка контейнера...$(NC)"; \
		docker compose -f docker-compose-local.yml down; \
		echo "$(YELLOW)Удаление тома с данными...$(NC)"; \
		docker volume rm plantswap_postgres_data 2>/dev/null || true; \
		echo "$(YELLOW)Запуск заново...$(NC)"; \
		docker compose -f docker-compose-local.yml up -d; \
		echo "$(GREEN)PostgreSQL перезапущен. Базы нужно создать заново:$(NC)"; \
		echo "make db-create"; \
	fi

db-create: ## Создать базы данных в PostgreSQL
	@echo "$(GREEN)Создание баз данных...$(NC)"
	@docker exec -i plantswap_postgres psql -U $(DB_USER) -d postgres <<-EOF
		SELECT 'CREATE DATABASE $(DB_NAME) OWNER $(DB_USER)' 
		WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$(DB_NAME)')\gexec
		SELECT 'CREATE DATABASE $(DB_NAME)_test OWNER $(DB_USER)' 
		WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$(DB_NAME)_test')\gexec
	EOF
	@echo "$(GREEN)Базы данных созданы:$(NC) $(DB_NAME) и $(DB_NAME)_test"

check: ## Проверить конфигурацию и переменные
	@echo "$(GREEN)Проверка конфигурации:$(NC)"
	@echo "$(YELLOW)Переменные из .env:$(NC)"
	@echo "  DB_USER: $(DB_USER)"
	@echo "  DB_NAME: $(DB_NAME)"
	@echo "  DB_HOST: $(DB_HOST)"
	@echo "  DB_PORT: $(DB_PORT)"
	@echo "  DB_PASSWORD: $(if $(DB_PASSWORD),***установлен***,$(RED)не установлен$(NC))"
	@echo "  JWT_SECRET: $(if $(JWT_SECRET),***установлен***,$(RED)не установлен$(NC))"
	@echo ""
	@echo "$(YELLOW)Проверка подключения к БД:$(NC)"
	@docker exec -i plantswap_postgres pg_isready -U $(DB_USER) -d $(DB_NAME) 2>/dev/null && \
		echo "$(GREEN)✅ PostgreSQL доступен$(NC)" || \
		echo "$(RED)❌ PostgreSQL недоступен. Запустите: make db-up$(NC)"

clean: ## Очистить бинарники
	@echo "$(GREEN)Очистка...$(NC)"
	rm -rf bin/
	go clean