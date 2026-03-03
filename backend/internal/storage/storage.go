package storage

import "plantswap/internal/storage/models"

// Storage is the full interface the application depends on.
// postgres.DB implements it.
type Storage interface {
	// Users
	CreateUser(u *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id uint) (*models.User, error)
	UpdateUser(id uint, fields map[string]any) error

	// Plants
	CreatePlant(p *models.Plant) error
	GetPlants(filter models.PlantFilter) ([]models.Plant, int64, error)
	GetPlantByID(id uint) (*models.Plant, error)
	GetPlantsByUserID(userID uint) ([]models.Plant, error)
	UpdatePlant(id uint, fields map[string]any) error
	DeletePlant(id uint) error
	SearchPlants(q string) ([]models.Plant, error)
	IncrementTradeCount(plantID uint) error

	// Trade Offers
	CreateOffer(o *models.TradeOffer) error
	GetOffers(filter models.OfferFilter) ([]models.TradeOffer, error)
	GetOfferByID(id uint) (*models.TradeOffer, error)
	UpdateOffer(id uint, fields map[string]any) error
	DeleteOffer(id uint) error

	// Trade History
	CreateTradeHistory(h *models.TradeHistory) error
	GetTradeHistory(userID uint) ([]models.TradeHistory, error)
	GetTradeHistoryByID(id uint) (*models.TradeHistory, error)

	// Reports
	GetActiveUsers(limit int) ([]models.ActiveUserReport, error)
	GetPopularPlants(limit int) ([]models.Plant, error)
	GetStats() (*models.Stats, error)

	Close() error
	Migrate() error
}
