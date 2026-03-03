package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	mw "plantswap/internal/http-server/middleware"
	"plantswap/internal/storage/models"
)

type createOfferInput struct {
	OfferedPlantID uint   `json:"offered_plant_id" binding:"required"`
	WantedTypes    string `json:"wanted_types"`
	WantedRegion   string `json:"wanted_region"`
	Description    string `json:"description"`
}

type requestTradeInput struct {
	RequestedPlantID uint `json:"requested_plant_id" binding:"required"`
}

func (h *handler) GetOffers(c *gin.Context) {
	var f models.OfferFilter
	c.ShouldBindQuery(&f)
	offers, err := h.db.GetOffers(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, offers)
}

func (h *handler) GetCompatibleOffers(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	// GetCompatibleOffers is defined on *postgres.DB but not on the interface.
	// We use a type-assertion to call it when available.
	type compatibleOffers interface {
		GetCompatibleOffers(userID uint) ([]models.TradeOffer, error)
	}
	if co, ok := h.db.(compatibleOffers); ok {
		offers, err := co.GetCompatibleOffers(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, offers)
		return
	}
	c.JSON(http.StatusOK, []models.TradeOffer{})
}

func (h *handler) GetOffer(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	offer, err := h.db.GetOfferByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "offer not found"})
		return
	}
	c.JSON(http.StatusOK, offer)
}

func (h *handler) CreateOffer(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	var in createOfferInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify plant belongs to user
	plant, err := h.db.GetPlantByID(in.OfferedPlantID)
	if err != nil || plant.UserID != userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "plant not found or not yours"})
		return
	}

	offer := &models.TradeOffer{
		OwnerID:        userID,
		OfferedPlantID: in.OfferedPlantID,
		WantedTypes:    in.WantedTypes,
		WantedRegion:   in.WantedRegion,
		Description:    in.Description,
		Status:         models.OfferStatusOpen,
	}
	if err := h.db.CreateOffer(offer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, offer)
}

func (h *handler) UpdateOffer(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	id, _ := strconv.Atoi(c.Param("id"))

	offer, err := h.db.GetOfferByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "offer not found"})
		return
	}
	if offer.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your offer"})
		return
	}

	var in createOfferInput
	c.ShouldBindJSON(&in)
	h.db.UpdateOffer(uint(id), map[string]any{
		"wanted_types":  in.WantedTypes,
		"wanted_region": in.WantedRegion,
		"description":   in.Description,
	})
	updated, _ := h.db.GetOfferByID(uint(id))
	c.JSON(http.StatusOK, updated)
}

func (h *handler) DeleteOffer(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	id, _ := strconv.Atoi(c.Param("id"))

	offer, err := h.db.GetOfferByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "offer not found"})
		return
	}
	if offer.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your offer"})
		return
	}
	h.db.DeleteOffer(uint(id))
	c.JSON(http.StatusOK, gin.H{"message": "offer deleted"})
}

func (h *handler) RequestTrade(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	id, _ := strconv.Atoi(c.Param("id"))

	var in requestTradeInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	offer, err := h.db.GetOfferByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "offer not found"})
		return
	}
	if offer.Status != models.OfferStatusOpen {
		c.JSON(http.StatusConflict, gin.H{"error": "offer is not open"})
		return
	}
	if offer.OwnerID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot request your own offer"})
		return
	}

	plant, err := h.db.GetPlantByID(in.RequestedPlantID)
	if err != nil || plant.UserID != userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "plant not found or not yours"})
		return
	}

	h.db.UpdateOffer(uint(id), map[string]any{
		"status":             models.OfferStatusPending,
		"requester_id":       userID,
		"requested_plant_id": in.RequestedPlantID,
	})
	updated, _ := h.db.GetOfferByID(uint(id))
	c.JSON(http.StatusOK, updated)
}

func (h *handler) AcceptTrade(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	id, _ := strconv.Atoi(c.Param("id"))

	offer, err := h.db.GetOfferByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "offer not found"})
		return
	}
	if offer.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your offer"})
		return
	}
	if offer.Status != models.OfferStatusPending {
		c.JSON(http.StatusConflict, gin.H{"error": "offer is not pending"})
		return
	}

	h.db.UpdateOffer(uint(id), map[string]any{"status": models.OfferStatusCompleted})
	h.db.IncrementTradeCount(offer.OfferedPlantID)
	if offer.RequestedPlantID != nil {
		h.db.IncrementTradeCount(*offer.RequestedPlantID)
	}

	history := &models.TradeHistory{
		TradeOfferID:    offer.ID,
		InitiatorID:     *offer.RequesterID,
		ReceiverID:      offer.OwnerID,
		PlantGivenID:    *offer.RequestedPlantID,
		PlantReceivedID: offer.OfferedPlantID,
	}
	h.db.CreateTradeHistory(history)

	c.JSON(http.StatusOK, gin.H{"message": "trade accepted", "history_id": history.ID})
}

func (h *handler) RejectTrade(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	id, _ := strconv.Atoi(c.Param("id"))

	offer, err := h.db.GetOfferByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "offer not found"})
		return
	}
	if offer.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your offer"})
		return
	}

	h.db.UpdateOffer(uint(id), map[string]any{
		"status":             models.OfferStatusOpen,
		"requester_id":       nil,
		"requested_plant_id": nil,
	})
	c.JSON(http.StatusOK, gin.H{"message": "trade request rejected"})
}
