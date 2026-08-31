package database

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"cardflow-backend/internal/config"
	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	Client *redis.Client
}

func NewRedisClient(ctx context.Context, cfg *config.Config) (*RedisClient, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	if err := rdb.Ping(pingCtx).Err(); err != nil {
		slog.Warn("Redis ping failed (caching/sessions will operate in memory or retry)", "error", err)
	} else {
		slog.Info("Connected to Redis successfully")
	}

	return &RedisClient{Client: rdb}, nil
}

func (r *RedisClient) Close() error {
	if r != nil && r.Client != nil {
		return r.Client.Close()
	}
	return nil
}
