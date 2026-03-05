-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Очистка, если хочу пересоздать
DROP TABLE IF EXISTS trade_histories CASCADE;
DROP TABLE IF EXISTS trade_offers    CASCADE;
DROP TABLE IF EXISTS plants          CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

DROP TYPE IF EXISTS plant_type;
DROP TYPE IF EXISTS offer_status;

--  Enums
CREATE TYPE plant_type AS ENUM (
    'flowering',
    'cactus',
    'fern',
    'succulent',
    'tropical',
    'herb',
    'tree',
    'vine',
    'other'
);

CREATE TYPE offer_status AS ENUM (
    'open',
    'pending',
    'completed',
    'cancelled'
);

-- ============================================================
--  USERS
-- ============================================================
CREATE TABLE users (
    id            BIGSERIAL    PRIMARY KEY,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,

    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar        TEXT         NOT NULL DEFAULT '',
    region        VARCHAR(255) NOT NULL DEFAULT '',
    bio           TEXT         NOT NULL DEFAULT ''
);

CREATE UNIQUE INDEX idx_users_email      ON users(email)      WHERE deleted_at IS NULL;
CREATE        INDEX idx_users_deleted_at ON users(deleted_at);

-- ============================================================
--  PLANTS
-- ============================================================
CREATE TABLE plants (
    id           BIGSERIAL    PRIMARY KEY,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,

    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    species      VARCHAR(255) NOT NULL DEFAULT '',
    type         plant_type   NOT NULL,
    description  TEXT         NOT NULL DEFAULT '',
    image_url    TEXT         NOT NULL DEFAULT '',
    region       VARCHAR(255) NOT NULL DEFAULT '',
    is_available BOOLEAN      NOT NULL DEFAULT TRUE,
    trade_count  INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_plants_user_id    ON plants(user_id);
CREATE INDEX idx_plants_region     ON plants(region);
CREATE INDEX idx_plants_deleted_at ON plants(deleted_at);

-- ============================================================
--  TRADE_OFFERS
-- ============================================================
CREATE TABLE trade_offers (
    id                 BIGSERIAL    PRIMARY KEY,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ,

    owner_id           BIGINT       NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    offered_plant_id   BIGINT       NOT NULL REFERENCES plants(id) ON DELETE CASCADE,

    wanted_types       TEXT         NOT NULL DEFAULT '',
    wanted_region      VARCHAR(255) NOT NULL DEFAULT '',
    description        TEXT         NOT NULL DEFAULT '',
    status             offer_status NOT NULL DEFAULT 'open',

    requester_id       BIGINT       REFERENCES users(id)  ON DELETE SET NULL,
    requested_plant_id BIGINT       REFERENCES plants(id) ON DELETE SET NULL
);

CREATE INDEX idx_trade_offers_owner_id         ON trade_offers(owner_id);
CREATE INDEX idx_trade_offers_status           ON trade_offers(status);
CREATE INDEX idx_trade_offers_requester_id     ON trade_offers(requester_id);
CREATE INDEX idx_trade_offers_deleted_at       ON trade_offers(deleted_at);

-- ============================================================
--  TRADE_HISTORIES
-- ============================================================
CREATE TABLE trade_histories (
    id               BIGSERIAL   PRIMARY KEY,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    trade_offer_id   BIGINT      NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
    initiator_id     BIGINT      NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
    receiver_id      BIGINT      NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
    plant_given_id   BIGINT      NOT NULL REFERENCES plants(id)       ON DELETE CASCADE,
    plant_received_id BIGINT     NOT NULL REFERENCES plants(id)       ON DELETE CASCADE,
    notes            TEXT        NOT NULL DEFAULT ''
);

CREATE INDEX idx_trade_histories_trade_offer_id  ON trade_histories(trade_offer_id);
CREATE INDEX idx_trade_histories_initiator_id    ON trade_histories(initiator_id);
CREATE INDEX idx_trade_histories_receiver_id     ON trade_histories(receiver_id);

-- ============================================================
--  ФУНКЦИЯ auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_plants_updated_at
    BEFORE UPDATE ON plants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_trade_offers_updated_at
    BEFORE UPDATE ON trade_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
--  ТЕСТОВЫЕ ДАННЫЕ 
-- ============================================================

-- Пользователи (пароль для всех: "test_pass")
INSERT INTO users (name, email, password_hash, region, bio) VALUES
    ('Анна Зеленова',   'anna@plants.ru',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Москва',          'Люблю тропические растения'),
    ('Борис Садовый',   'boris@plants.ru',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Санкт-Петербург', 'Коллекционирую кактусы'),
    ('Виктория Лесная', 'vika@plants.ru',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Краснодар',       'Папоротники и суккуленты');

-- Растения
INSERT INTO plants (user_id, name, species, type, description, region, is_available, trade_count) VALUES
    (1, 'Монстера',        'Monstera deliciosa',     'tropical',  'Взрослое растение, много листьев', 'Москва',          TRUE,  3),
    (1, 'Алоэ вера',       'Aloe vera',              'succulent', 'Лечебное алоэ, много деток',       'Москва',          TRUE,  1),
    (2, 'Кактус Эхинопсис','Echinopsis',             'cactus',    'Цветёт раз в год',                 'Санкт-Петербург', TRUE,  2),
    (2, 'Фикус',           'Ficus benjamina',        'tropical',  'Высокий, около 1.5м',              'Санкт-Петербург', TRUE,  0),
    (3, 'Нефролепис',      'Nephrolepis exaltata',   'fern',      'Пышный папоротник',                'Краснодар',       TRUE,  1),
    (3, 'Эхеверия',        'Echeveria elegans',      'succulent', 'Розетка 15см',                     'Краснодар',       TRUE,  0);

-- Предложения обмена
INSERT INTO trade_offers (owner_id, offered_plant_id, wanted_types, wanted_region, description, status) VALUES
    (1, 1, 'cactus,succulent', 'Москва',          'Ищу что-то неприхотливое',  'open'),
    (2, 3, 'tropical,fern',    '',                'Меняю на любое тропическое','open'),
    (3, 5, 'flowering,herb',   'Краснодар',       'Только из Краснодара',      'open');

-- ============================================================
--  ПРЕДСТАВЛЕНИЯ
-- ============================================================

-- Активные пользователи по числу обменов
CREATE OR REPLACE VIEW v_active_users AS
SELECT
    u.id          AS user_id,
    u.name,
    u.email,
    u.region,
    COUNT(th.id)  AS trade_count
FROM users u
LEFT JOIN trade_histories th
       ON th.initiator_id = u.id OR th.receiver_id = u.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.name, u.email, u.region
ORDER BY trade_count DESC;

-- Популярные растения
CREATE OR REPLACE VIEW v_popular_plants AS
SELECT
    p.*,
    u.name   AS owner_name,
    u.region AS owner_region
FROM plants p
JOIN users u ON u.id = p.user_id
WHERE p.deleted_at IS NULL
  AND p.trade_count > 0
ORDER BY p.trade_count DESC;

-- Статистика платформы
CREATE OR REPLACE VIEW v_stats AS
SELECT
    (SELECT COUNT(*) FROM users        WHERE deleted_at IS NULL) AS total_users,
    (SELECT COUNT(*) FROM plants       WHERE deleted_at IS NULL) AS total_plants,
    (SELECT COUNT(*) FROM trade_histories)                       AS total_trades,
    (SELECT COUNT(*) FROM trade_offers WHERE status = 'open'
                                         AND deleted_at IS NULL) AS open_offers;