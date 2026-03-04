package postgres

import (
	"fmt"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"plantswap/internal/config"
	"plantswap/internal/storage/models"
)

// DB wraps *gorm.DB and implements storage.Storage.
type DB struct {
	db *gorm.DB
}

// New opens a postgres connection using the provided DBConfig.
func New(cfg config.DBConfig) (*DB, error) {
	gormCfg := &gorm.Config{}
	if cfg.SSLMode == "disable" {
		gormCfg.Logger = logger.Default.LogMode(logger.Info)
	} else {
		gormCfg.Logger = logger.Default.LogMode(logger.Warn)
	}

	db, err := gorm.Open(postgres.Open(cfg.DSN()), gormCfg)
	if err != nil {
		return nil, fmt.Errorf("gorm open: %w", err)
	}

	return &DB{db: db}, nil
}

// Migrate runs AutoMigrate for all domain models.
func (d *DB) Migrate() error {
	return d.db.AutoMigrate(
		&models.User{},
		&models.Plant{},
		&models.TradeOffer{},
		&models.TradeHistory{},
	)
}

// Close closes the underlying sql.DB.
func (d *DB) Close() error {
	sqlDB, err := d.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// ─── Users ────────────────────────────────────────────────────────────────────

func (d *DB) CreateUser(u *models.User) error {
	return d.db.Create(u).Error
}

func (d *DB) GetUserByEmail(email string) (*models.User, error) {
	var u models.User
	if err := d.db.Where("email = ?", email).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (d *DB) GetUserByID(id uint) (*models.User, error) {
	var u models.User
	if err := d.db.Preload("Plants").First(&u, id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (d *DB) UpdateUser(id uint, fields map[string]any) error {
	return d.db.Model(&models.User{}).Where("id = ?", id).Updates(fields).Error
}

// ─── Plants ───────────────────────────────────────────────────────────────────

func (d *DB) CreatePlant(p *models.Plant) error {
	return d.db.Create(p).Error
}

func (d *DB) GetPlants(f models.PlantFilter) ([]models.Plant, int64, error) {
	q := d.db.Model(&models.Plant{}).Preload("User").Where("is_available = true")

	if f.Type != "" {
		q = q.Where("type = ?", f.Type)
	}
	if f.Region != "" {
		q = q.Where("region ILIKE ?", "%"+f.Region+"%")
	}
	if f.Search != "" {
		like := "%" + f.Search + "%"
		q = q.Where("name ILIKE ? OR species ILIKE ? OR description ILIKE ?", like, like, like)
	}

	var total int64
	q.Count(&total)

	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 100 {
		f.Limit = 20
	}
	offset := (f.Page - 1) * f.Limit

	var plants []models.Plant
	err := q.Offset(offset).Limit(f.Limit).Order("created_at DESC").Find(&plants).Error
	return plants, total, err
}

func (d *DB) GetPlantByID(id uint) (*models.Plant, error) {
	var p models.Plant
	if err := d.db.Preload("User").First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (d *DB) GetPlantsByUserID(userID uint) ([]models.Plant, error) {
	var plants []models.Plant
	err := d.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&plants).Error
	return plants, err
}

func (d *DB) UpdatePlant(id uint, fields map[string]any) error {
	return d.db.Model(&models.Plant{}).Where("id = ?", id).Updates(fields).Error
}

func (d *DB) DeletePlant(id uint) error {
	return d.db.Delete(&models.Plant{}, id).Error
}

func (d *DB) SearchPlants(q string) ([]models.Plant, error) {
	var plants []models.Plant
	like := "%" + q + "%"
	err := d.db.Preload("User").
		Where("(name ILIKE ? OR species ILIKE ?) AND is_available = true", like, like).
		Limit(20).Find(&plants).Error
	return plants, err
}

func (d *DB) IncrementTradeCount(plantID uint) error {
	return d.db.Model(&models.Plant{}).Where("id = ?", plantID).
		UpdateColumn("trade_count", gorm.Expr("trade_count + 1")).Error
}

// ─── Trade Offers ─────────────────────────────────────────────────────────────

func (d *DB) CreateOffer(o *models.TradeOffer) error {
	if err := d.db.Create(o).Error; err != nil {
		return err
	}
	return d.db.Preload("Owner").Preload("OfferedPlant").First(o, o.ID).Error
}

func (d *DB) GetOffers(f models.OfferFilter) ([]models.TradeOffer, error) {
	q := d.db.Preload("Owner").Preload("OfferedPlant")

	if f.Status != "" {
		q = q.Where("status = ?", f.Status)
	} else {
		q = q.Where("status = 'open'")
	}
	if f.Region != "" {
		q = q.Where("wanted_region ILIKE ?", "%"+f.Region+"%")
	}
	if f.Type != "" {
		q = q.Where("wanted_types ILIKE ?", "%"+f.Type+"%")
	}

	var offers []models.TradeOffer
	err := q.Order("created_at DESC").Find(&offers).Error
	return offers, err
}

func (d *DB) GetOfferByID(id uint) (*models.TradeOffer, error) {
	var o models.TradeOffer
	err := d.db.
		Preload("Owner").
		Preload("OfferedPlant").
		Preload("Requester").
		Preload("RequestedPlant").
		First(&o, id).Error
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (d *DB) UpdateOffer(id uint, fields map[string]any) error {
	return d.db.Model(&models.TradeOffer{}).Where("id = ?", id).Updates(fields).Error
}

func (d *DB) DeleteOffer(id uint) error {
	return d.db.Delete(&models.TradeOffer{}, id).Error
}

// GetCompatibleOffers returns open offers that match user's plant types or region.
func (d *DB) GetCompatibleOffers(userID uint) ([]models.TradeOffer, error) {
	// Get the user's plant types
	var plants []models.Plant
	d.db.Where("user_id = ? AND is_available = true", userID).Find(&plants)

	var user models.User
	d.db.First(&user, userID)

	var all []models.TradeOffer
	d.db.Preload("Owner").Preload("OfferedPlant").
		Where("status = 'open' AND owner_id != ?", userID).
		Find(&all)

	userTypes := make(map[string]bool)
	for _, p := range plants {
		userTypes[string(p.Type)] = true
	}

	compatible := make([]models.TradeOffer, 0)
	for _, o := range all {
		if o.WantedRegion != "" && strings.Contains(user.Region, o.WantedRegion) {
			compatible = append(compatible, o)
			continue
		}
		for _, wt := range strings.Split(o.WantedTypes, ",") {
			if userTypes[strings.TrimSpace(wt)] {
				compatible = append(compatible, o)
				break
			}
		}
	}
	return compatible, nil
}

// ─── Trade History ────────────────────────────────────────────────────────────

func (d *DB) CreateTradeHistory(h *models.TradeHistory) error {
	return d.db.Create(h).Error
}

func (d *DB) GetTradeHistory(userID uint) ([]models.TradeHistory, error) {
	var history []models.TradeHistory
	err := d.db.
		Preload("Initiator").Preload("Receiver").
		Preload("PlantGiven").Preload("PlantReceived").
		Where("initiator_id = ? OR receiver_id = ?", userID, userID).
		Order("created_at DESC").Find(&history).Error
	return history, err
}

func (d *DB) GetTradeHistoryByID(id uint) (*models.TradeHistory, error) {
	var h models.TradeHistory
	err := d.db.
		Preload("Initiator").Preload("Receiver").
		Preload("PlantGiven").Preload("PlantReceived").
		Preload("TradeOffer").
		First(&h, id).Error
	if err != nil {
		return nil, err
	}
	return &h, nil
}

// ─── Reports ──────────────────────────────────────────────────────────────────

func (d *DB) GetActiveUsers(limit int) ([]models.ActiveUserReport, error) {
	var results []models.ActiveUserReport
	err := d.db.Raw(`
		SELECT u.id AS user_id, u.name, u.email,
		       COUNT(th.id) AS trade_count
		FROM users u
		LEFT JOIN trade_histories th ON th.initiator_id = u.id OR th.receiver_id = u.id
		WHERE u.deleted_at IS NULL
		GROUP BY u.id, u.name, u.email
		ORDER BY trade_count DESC
		LIMIT ?`, limit).Scan(&results).Error
	return results, err
}

func (d *DB) GetPopularPlants(limit int) ([]models.Plant, error) {
	var plants []models.Plant
	err := d.db.Where("trade_count > 0").
		Order("trade_count DESC").Limit(limit).Find(&plants).Error
	return plants, err
}

func (d *DB) GetStats() (*models.Stats, error) {
	var s models.Stats
	d.db.Model(&models.User{}).Count(&s.TotalUsers)
	d.db.Model(&models.Plant{}).Count(&s.TotalPlants)
	d.db.Model(&models.TradeHistory{}).Count(&s.TotalTrades)
	d.db.Model(&models.TradeOffer{}).Where("status = 'open'").Count(&s.OpenOffers)
	return &s, nil
}
