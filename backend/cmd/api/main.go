package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"cardflow-backend/internal/admin"
	"cardflow-backend/internal/auth"
	"cardflow-backend/internal/billing"
	"cardflow-backend/internal/business"
	"cardflow-backend/internal/card"
	"cardflow-backend/internal/config"
	"cardflow-backend/internal/database"
	"cardflow-backend/internal/discovery"
	"cardflow-backend/internal/enquiry"
	"cardflow-backend/internal/extractor"
	"cardflow-backend/internal/middleware"
	"cardflow-backend/internal/storage"
	"cardflow-backend/pkg/response"
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

//go:embed dist/*
var embeddedFrontend embed.FS

func main() {
	// 1. Load configuration and setup structured logger
	cfg := config.Load()
	config.SetupLogger(cfg.Env)

	slog.Info("Starting CardFlow Modular Monolith API Server...", "env", cfg.Env, "port", cfg.Port)

	// 2. Initialize Database and Redis connections
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	dbPool, err := database.NewPostgresPool(ctx, cfg)
	if err != nil {
		slog.Warn("PostgreSQL pool initialization note", "error", err)
	} else {
		defer dbPool.Close()
		_ = database.RunMigrations(ctx, dbPool)
	}

	redisClient, err := database.NewRedisClient(ctx, cfg)
	if err != nil {
		slog.Warn("Redis connection note", "error", err)
	} else {
		defer redisClient.Close()
	}

	// 3. Initialize Services
	jwtSvc := auth.NewJWTService(cfg)
	authSvc := auth.NewAuthService(dbPool, redisClient, jwtSvc, cfg)
	discoverySvc := discovery.NewDiscoveryService(dbPool)
	businessSvc := business.NewBusinessService(dbPool)
	s3Svc, _ := storage.NewS3Service(context.Background(), cfg)
	geminiSvc := extractor.NewGeminiService(cfg)
	cardSvc := card.NewCardService(dbPool, s3Svc, geminiSvc)

	// 4. Initialize Handlers & Middlewares
	appMiddleware := middleware.NewMiddleware(jwtSvc, dbPool)
	authHandler := auth.NewAuthHandler(authSvc)
	discoveryHandler := discovery.NewDiscoveryHandler(discoverySvc)
	businessHandler := business.NewBusinessHandler(businessSvc)
	cardHandler := card.NewCardHandler(cardSvc, s3Svc)
	enquiryHandler := enquiry.NewEnquiryHandler(dbPool)
	billingHandler := billing.NewBillingHandler(dbPool)
	adminHandler := admin.NewAdminHandler(dbPool)

	// 5. Setup Router & Routes
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.Timeout(30 * time.Second))

	// CORS Configuration (Permissive for Web Browsers & Testing)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{"*"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Health Check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		response.JSON(w, http.StatusOK, map[string]interface{}{
			"status":    "healthy",
			"timestamp": time.Now(),
			"version":   "1.0.0",
			"env":       cfg.Env,
		})
	})
	r.Head("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Public Web Profile Route (e.g. https://cardflow-api-fsij.onrender.com/b/kovai-precision-tools)
	r.Get("/b/{slug}", discoveryHandler.RenderPublicHTML)

	// API v1 Routes
	r.Route("/api/v1", func(r chi.Router) {
		// 1. Auth Endpoints
		r.Route("/auth", func(r chi.Router) {
			r.Post("/otp/send", authHandler.SendOTP)
			r.Post("/otp/verify", authHandler.VerifyOTP)
			r.Post("/refresh", authHandler.RefreshToken)
			r.Post("/logout-all", authHandler.LogoutAll)
		})

		// 2. Discovery Endpoints (Public)
		r.Get("/categories", discoveryHandler.GetCategories)
		r.Get("/businesses/search", discoveryHandler.SearchBusinesses)
		r.Get("/businesses/{id}", discoveryHandler.GetBusiness)
		r.Get("/businesses/slug/{slug}", discoveryHandler.GetBusinessBySlug)
		r.Post("/cards/scan", cardHandler.ScanCard)

		// 3. User Account Endpoints (Protected)
		r.Group(func(r chi.Router) {
			r.Use(appMiddleware.Authenticate)

			r.Get("/users/me", authHandler.GetMe)
			r.Patch("/users/me", authHandler.UpdateMe)
			r.Delete("/users/me", authHandler.DeleteMe)
			r.Get("/users/me/export", authHandler.ExportMe)

			// Card Vault & OCR Scanner
			r.Get("/cards", cardHandler.ListCards)
			r.Post("/cards", cardHandler.CreateCard)
			r.Post("/cards/upload-url", cardHandler.GetUploadURL)
			r.Post("/cards/scan", cardHandler.ScanCard)
			r.Delete("/cards/{id}", cardHandler.DeleteCard)

			// Customer Enquiries
			r.Post("/enquiries", enquiryHandler.CreateEnquiry)

			// Billing & Credits
			r.Get("/billing/plans", billingHandler.GetPlans)
			r.Post("/billing/verify-purchase", billingHandler.VerifyPurchase)
			r.Get("/billing/credits", billingHandler.GetCredits)

			// Business Owner Endpoints (Multi-Business 1..N)
			r.Route("/owner", func(r chi.Router) {
				r.Get("/businesses", businessHandler.ListMyBusinesses)
				r.Post("/businesses", businessHandler.CreateBusiness)
				r.Get("/businesses/{id}/analytics", businessHandler.GetBusinessAnalytics)
				r.Post("/businesses/{id}/verify/gst", businessHandler.VerifyGST)
				r.Get("/businesses/{id}/card", businessHandler.GetDigitalCard)
				r.Get("/businesses/{id}/enquiries", enquiryHandler.ListBusinessEnquiries)
			})

			// In-App Admin Endpoints (Strict Admin Authorization Guard)
			r.Route("/admin", func(r chi.Router) {
				r.Use(appMiddleware.RequireAdmin)

				r.Get("/dashboard", adminHandler.GetDashboard)
				r.Get("/users", adminHandler.ListUsers)
				r.Patch("/users/{id}/status", adminHandler.UpdateUserStatus)
				r.Post("/users/grant-access", adminHandler.GrantFreeAccess)
				r.Get("/businesses", adminHandler.ListBusinesses)
				r.Post("/businesses/manual-create", adminHandler.CreateBusinessManual)
				r.Get("/verification", adminHandler.ListPendingVerifications)
				r.Post("/verification/{id}/decision", adminHandler.VerifyDecision)
				r.Get("/audit-logs", adminHandler.ListAuditLogs)
			})
		})
	})

	// 6. Serve Embedded Production Frontend Web Application at Root
	subFS, err := fs.Sub(embeddedFrontend, "dist")
	if err == nil {
		fileServer := http.FileServer(http.FS(subFS))
		r.Get("/*", func(w http.ResponseWriter, req *http.Request) {
			path := strings.TrimPrefix(req.URL.Path, "/")
			// If file exists in embedded dist, serve it
			if f, err := subFS.Open(path); err == nil && path != "" {
				_ = f.Close()
				fileServer.ServeHTTP(w, req)
				return
			}
			// Otherwise serve index.html for React SPA client-side routing
			indexFile, err := subFS.Open("index.html")
			if err == nil {
				defer indexFile.Close()
				http.ServeContent(w, req, "index.html", time.Now(), indexFile.(interface {
					ReadSeeker()
				}).(ioReadSeeker))
			} else {
				fileServer.ServeHTTP(w, req)
			}
		})
	}

	// 7. Start HTTP Server with Graceful Shutdown
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info(fmt.Sprintf("CardFlow Go Backend & Frontend running at http://localhost:%s", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server listen error", "error", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("Shutting down server gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server stopped cleanly")
}

type ioReadSeeker interface {
	fs.File
	Seek(offset int64, whence int) (int64, error)
}
