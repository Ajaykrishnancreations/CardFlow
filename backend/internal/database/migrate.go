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

//go:embed migrations/005_business_card_images.sql
var migration005SQL string

//go:embed migrations/006_dev_minimal_bootstrap.sql
var migration006BootstrapSQL string

//go:embed migrations/007_dev_business_bootstrap.sql
var migration007BusinessBootstrapSQL string

func RunMigrations(ctx context.Context, db *DB) error {
	if db == nil || db.Pool == nil {
		return fmt.Errorf("database pool is not initialized")
	}

	slog.Info("Running database schema migrations...")
	if _, err := db.Pool.Exec(ctx, schemaSQL); err != nil {
		slog.Warn("Full schema migration failed (PostGIS may be missing); applying minimal card vault bootstrap", "error", err)
		if _, err2 := db.Pool.Exec(ctx, migration006BootstrapSQL); err2 != nil {
			return fmt.Errorf("failed executing schema migration and minimal bootstrap: %w", err2)
		}
		slog.Info("Minimal card vault bootstrap applied successfully")
	} else {
		slog.Info("Schema migration applied successfully")
	}

	for name, sql := range map[string]string{
		"003_saved_card_gstin_image": migration003SQL,
		"004_saved_card_image_data":  migration004SQL,
		"005_business_card_images":   migration005SQL,
		"007_dev_business_bootstrap": migration007BusinessBootstrapSQL,
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
