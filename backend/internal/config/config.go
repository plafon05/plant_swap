package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	Env    string       `yaml:"env"    env:"ENV"    env-default:"local"`
	Server ServerConfig `yaml:"server"`
	DB     DBConfig     `yaml:"db"`
	JWT    JWTConfig    `yaml:"jwt"`
}

type ServerConfig struct {
	Port           string        `yaml:"port"            env:"SERVER_PORT"     env-default:"8080"`
	ReadTimeout    time.Duration `yaml:"read_timeout"    env:"READ_TIMEOUT"    env-default:"5s"`
	WriteTimeout   time.Duration `yaml:"write_timeout"   env:"WRITE_TIMEOUT"   env-default:"10s"`
	AllowedOrigins []string      `yaml:"allowed_origins" env:"ALLOWED_ORIGINS" env-separator:","`
}

type DBConfig struct {
	Host     string `yaml:"host"     env:"DB_HOST"     env-required:"true"`
	Port     string `yaml:"port"     env:"DB_PORT"     env-default:"5432"`
	User     string `yaml:"user"     env:"DB_USER"     env-required:"true"`
	Password string `yaml:"-"        env:"DB_PASSWORD" env-required:"true"`
	Name     string `yaml:"name"     env:"DB_NAME"     env-required:"true"`
	SSLMode  string `yaml:"ssl_mode" env:"DB_SSL_MODE" env-default:"disable"`
}

type JWTConfig struct {
	// Secret is intentionally NOT in yaml — only from env / GitHub Secrets
	Secret     string        `yaml:"-" env:"JWT_SECRET"     env-required:"true"`
	ExpiresDur time.Duration `yaml:"expires_dur" env:"JWT_EXPIRES_DUR" env-default:"72h"`
}

// DSN returns a postgres connection string.
func (d DBConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=UTC",
		d.Host, d.Port, d.User, d.Password, d.Name, d.SSLMode,
	)
}

// Load reads config from YAML file (path in CONFIG_PATH env) then overlays
// environment variables. Secrets (DB_PASSWORD, JWT_SECRET) must be supplied
// via environment — they are never written to any config file.
func Load() (*Config, error) {
	cfg := &Config{}

	path := configPath()

	if path != "" {
		if err := cleanenv.ReadConfig(path, cfg); err != nil {
			return nil, fmt.Errorf("read config file %s: %w", path, err)
		}
	} else {
		if err := cleanenv.ReadEnv(cfg); err != nil {
			return nil, fmt.Errorf("read env: %w", err)
		}
	}

	// AllowedOrigins default for local
	if len(cfg.Server.AllowedOrigins) == 0 {
		cfg.Server.AllowedOrigins = []string{"http://localhost:5173"}
	}

	return cfg, nil
}

func configPath() string {
	if v := os.Getenv("CONFIG_PATH"); v != "" {
		return v
	}
	// auto-detect by ENV
	env := strings.ToLower(os.Getenv("ENV"))
	switch env {
	case "prod":
		return "configs/prod.yaml"
	default:
		return "configs/local.yaml"
	}
}
