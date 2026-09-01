package database

import (
	"context"
	_ "embed"
	"fmt"
	"log/slog"
)

//go:embed migrations/001_initial_schema.sql
var schemaSQL string

//go:embed migrations/002_seed_data.sql
var seedSQL string

//go:embed migrations/003_saved_card_gstin_image.sql
var migration003SQL string

//go:embed migrations/004_saved_card_image_data.sql
var migration004SQL string

func RunMigrations(ctx context.Context, db *DB) error {
	if db == nil || db.Pool == nil {
		return fmt.Errorf("database pool is not initialized")
	}

	slog.Info("Running database schema migrations...")
	if _, err := db.Pool.Exec(ctx, schemaSQL); err != nil {
		return fmt.Errorf("failed executing schema migration: %w", err)
	}
	slog.Info("Schema migration applied successfully")

	for name, sql := range map[string]string{
		"003_saved_card_gstin_image": migration003SQL,
		"004_saved_card_image_data":  migration004SQL,
	} {
		if _, err := db.Pool.Exec(ctx, sql); err != nil {
			slog.Warn("Incremental migration note", "migration", name, "error", err)
		} else {
			slog.Info("Incremental migration applied", "migration", name)
		}
	}

	slog.Info("Applying initial seed data (Categories & DEV Test Users)...")
	if _, err := db.Pool.Exec(ctx, seedSQL); err != nil {
		slog.Warn("Seed migration execution note", "error", err)
	} else {
		slog.Info("Seed data applied successfully")
	}

	return nil
}
