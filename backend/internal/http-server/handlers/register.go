package handlers

import (
	"plantswap/internal/config"
	"plantswap/internal/http-server/middleware"
	"plantswap/internal/storage"

	"github.com/gin-gonic/gin"
)

// Register wires all routes onto r.
func Register(r *gin.Engine, db storage.Storage, cfg *config.Config) {
	h := &handler{db: db, cfg: cfg}

	api := r.Group("/api/v1")

	// ── Public ────────────────────────────────────────────────
	auth := api.Group("/auth")
	auth.POST("/register", h.Register)
	auth.POST("/login", h.Login)

	// ── Protected ─────────────────────────────────────────────
	p := api.Group("/")
	p.Use(middleware.Auth(cfg.JWT.Secret))

	// Profile
	p.GET("profile", h.GetProfile)
	p.PUT("profile", h.UpdateProfile)

	// Plants
	p.GET("plants", h.GetPlants)
	p.GET("plants/search", h.SearchPlants)
	p.GET("plants/my", h.GetMyPlants)
	p.GET("plants/:id", h.GetPlant)
	p.POST("plants", h.CreatePlant)
	p.PUT("plants/:id", h.UpdatePlant)
	p.DELETE("plants/:id", h.DeletePlant)

	// Offers
	p.GET("offers", h.GetOffers)
	p.GET("offers/compatible", h.GetCompatibleOffers)
	p.GET("offers/:id", h.GetOffer)
	p.POST("offers", h.CreateOffer)
	p.PUT("offers/:id", h.UpdateOffer)
	p.DELETE("offers/:id", h.DeleteOffer)
	p.POST("offers/:id/request", h.RequestTrade)
	p.PATCH("offers/:id/accept", h.AcceptTrade)
	p.PATCH("offers/:id/reject", h.RejectTrade)

	// History
	p.GET("history", h.GetTradeHistory)
	p.GET("history/:id", h.GetTradeDetail)

	// Reports
	p.GET("reports/active-users", h.GetActiveUsers)
	p.GET("reports/popular-plants", h.GetPopularPlants)
	p.GET("reports/stats", h.GetStats)

	// в функции Register(), до protected группы
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}

// handler holds shared dependencies for all handlers.
type handler struct {
	db  storage.Storage
	cfg *config.Config
}
