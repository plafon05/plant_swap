package models

import (
	"time"

	"gorm.io/gorm"
)

// ─── Enums ────────────────────────────────────────────────────────────────────

type PlantType string

const (
	PlantTypeFlowering PlantType = "flowering"
	PlantTypeCactus    PlantType = "cactus"
	PlantTypeFern      PlantType = "fern"
	PlantTypeSucculent PlantType = "succulent"
	PlantTypeTropical  PlantType = "tropical"
	PlantTypeHerb      PlantType = "herb"
	PlantTypeTree      PlantType = "tree"
	PlantTypeVine      PlantType = "vine"
	PlantTypeOther     PlantType = "other"
)

type OfferStatus string

const (
	OfferStatusOpen      OfferStatus = "open"
	OfferStatusPending   OfferStatus = "pending"
	OfferStatusCompleted OfferStatus = "completed"
	OfferStatusCancelled OfferStatus = "cancelled"
)

// ─── Tables ───────────────────────────────────────────────────────────────────

type User struct {
	ID           uint           `gorm:"primarykey"            json:"id"`
	CreatedAt    time.Time      `                             json:"created_at"`
	UpdatedAt    time.Time      `                             json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index"                 json:"-"`
	Name         string         `gorm:"not null"              json:"name"`
	Email        string         `gorm:"uniqueIndex;not null"  json:"email"`
	PasswordHash string         `gorm:"not null"              json:"-"`
	Avatar       string         `                             json:"avatar"`
	Region       string         `                             json:"region"`
	Bio          string         `                             json:"bio"`
	Plants       []Plant        `gorm:"foreignKey:UserID"     json:"plants,omitempty"`
}

type Plant struct {
	ID          uint           `gorm:"primarykey"        json:"id"`
	CreatedAt   time.Time      `                         json:"created_at"`
	UpdatedAt   time.Time      `                         json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index"             json:"-"`
	UserID      uint           `gorm:"not null;index"    json:"user_id"`
	User        User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Name        string         `gorm:"not null"          json:"name"`
	Species     string         `                         json:"species"`
	Type        PlantType      `gorm:"not null"          json:"type"`
	Description string         `                         json:"description"`
	ImageURL    string         `                         json:"image_url"`
	Region      string         `gorm:"index"             json:"region"`
	IsAvailable bool           `gorm:"default:true"      json:"is_available"`
	TradeCount  int            `gorm:"default:0"         json:"trade_count"`
}

type TradeOffer struct {
	ID               uint           `gorm:"primarykey"                    json:"id"`
	CreatedAt        time.Time      `                                     json:"created_at"`
	UpdatedAt        time.Time      `                                     json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index"                         json:"-"`
	OwnerID          uint           `gorm:"not null;index"                json:"owner_id"`
	Owner            User           `gorm:"foreignKey:OwnerID"            json:"owner,omitempty"`
	OfferedPlantID   uint           `gorm:"not null"                      json:"offered_plant_id"`
	OfferedPlant     Plant          `gorm:"foreignKey:OfferedPlantID"     json:"offered_plant,omitempty"`
	WantedTypes      string         `                                     json:"wanted_types"` // comma-separated
	WantedRegion     string         `                                     json:"wanted_region"`
	Description      string         `                                     json:"description"`
	Status           OfferStatus    `gorm:"default:'open';index"          json:"status"`
	RequesterID      *uint          `gorm:"index"                         json:"requester_id,omitempty"`
	Requester        *User          `gorm:"foreignKey:RequesterID"        json:"requester,omitempty"`
	RequestedPlantID *uint          `                                     json:"requested_plant_id,omitempty"`
	RequestedPlant   *Plant         `gorm:"foreignKey:RequestedPlantID"   json:"requested_plant,omitempty"`
}

type TradeHistory struct {
	ID              uint       `gorm:"primarykey"                    json:"id"`
	CreatedAt       time.Time  `                                     json:"created_at"`
	TradeOfferID    uint       `gorm:"not null;index"                json:"trade_offer_id"`
	TradeOffer      TradeOffer `gorm:"foreignKey:TradeOfferID"      json:"trade_offer,omitempty"`
	InitiatorID     uint       `gorm:"not null;index"                json:"initiator_id"`
	Initiator       User       `gorm:"foreignKey:InitiatorID"        json:"initiator,omitempty"`
	ReceiverID      uint       `gorm:"not null;index"                json:"receiver_id"`
	Receiver        User       `gorm:"foreignKey:ReceiverID"         json:"receiver,omitempty"`
	PlantGivenID    uint       `gorm:"not null"                      json:"plant_given_id"`
	PlantGiven      Plant      `gorm:"foreignKey:PlantGivenID"       json:"plant_given,omitempty"`
	PlantReceivedID uint       `gorm:"not null"                      json:"plant_received_id"`
	PlantReceived   Plant      `gorm:"foreignKey:PlantReceivedID"    json:"plant_received,omitempty"`
	Notes           string     `                                     json:"notes"`
}

// ─── Filters / DTOs ───────────────────────────────────────────────────────────

type PlantFilter struct {
	Type   string `form:"type"`
	Region string `form:"region"`
	Search string `form:"search"`
	Page   int    `form:"page,default=1"`
	Limit  int    `form:"limit,default=20"`
}

type OfferFilter struct {
	Type   string `form:"type"`
	Region string `form:"region"`
	Status string `form:"status"`
}

// ─── Report models ────────────────────────────────────────────────────────────

type ActiveUserReport struct {
	UserID     uint   `json:"user_id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	TradeCount int64  `json:"trade_count"`
}

type Stats struct {
	TotalUsers  int64 `json:"total_users"`
	TotalPlants int64 `json:"total_plants"`
	TotalTrades int64 `json:"total_trades"`
	OpenOffers  int64 `json:"open_offers"`
}
