package database

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"cardflow-backend/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

func normalizeDatabaseURL(connStr string) string {
	connStr = strings.TrimSpace(connStr)
	if connStr == "" {
		return connStr
	}
	if !strings.Contains(connStr, "sslmode=") {
		sep := "?"
		if strings.Contains(connStr, "?") {
			sep = "&"
		}
		connStr += sep + "sslmode=require"
	}
	return connStr
}

type DB struct {
	Pool *pgxpool.Pool
}

func NewPostgresPool(ctx context.Context, cfg *config.Config) (*DB, error) {
	var connStr string
	if cfg.DatabaseURL != "" {
		connStr = normalizeDatabaseURL(cfg.DatabaseURL)
	} else {
		connStr = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=%s",
			cfg.DBUser,
			cfg.DBPassword,
			cfg.DBHost,
			cfg.DBPort,
			cfg.DBName,
			cfg.DBSSLMode,
		)
	}

	poolConfig, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, fmt.Errorf("unable to parse db config: %w", err)
	}

	poolConfig.MaxConns = int32(cfg.DBMaxOpenConns)
	poolConfig.MinConns = int32(cfg.DBMaxIdleConns)

	if lifetime, err := time.ParseDuration(cfg.DBConnMaxLifetime); err == nil {
		poolConfig.MaxConnLifetime = lifetime
	} else {
		poolConfig.MaxConnLifetime = 5 * time.Minute
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create postgres pool: %w", err)
	}

	// Ping with timeout
	pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		slog.Warn("Postgres connection unavailable (falling back to memory state safely)", "error", err)
		pool.Close()
		return nil, err
	}

	slog.Info("Connected to PostgreSQL + PostGIS database successfully")
	return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
	if db != nil && db.Pool != nil {
		db.Pool.Close()
	}
}
