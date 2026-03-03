package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	mw "plantswap/internal/http-server/middleware"
	"plantswap/internal/storage/models"
)

type createPlantInput struct {
	Name        string           `json:"name"     binding:"required,min=1"`
	Species     string           `json:"species"`
	Type        models.PlantType `json:"type"    binding:"required"`
	Description string           `json:"description"`
	ImageURL    string           `json:"image_url"`
	Region      string           `json:"region"`
}

type updatePlantInput struct {
	Name        string           `json:"name"`
	Species     string           `json:"species"`
	Type        models.PlantType `json:"type"`
	Description string           `json:"description"`
	ImageURL    string           `json:"image_url"`
	Region      string           `json:"region"`
	IsAvailable *bool            `json:"is_available"`
}

func (h *handler) GetPlants(c *gin.Context) {
	var f models.PlantFilter
	if err := c.ShouldBindQuery(&f); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	plants, total, err := h.db.GetPlants(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": plants, "total": total, "page": f.Page, "limit": f.Limit})
}

func (h *handler) GetMyPlants(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	plants, err := h.db.GetPlantsByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, plants)
}

func (h *handler) GetPlant(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	plant, err := h.db.GetPlantByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "plant not found"})
		return
	}
	c.JSON(http.StatusOK, plant)
}

func (h *handler) CreatePlant(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	var in createPlantInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	p := &models.Plant{
		UserID:      userID,
		Name:        in.Name,
		Species:     in.Species,
		Type:        in.Type,
		Description: in.Description,
		ImageURL:    in.ImageURL,
		Region:      in.Region,
	}
	if err := h.db.CreatePlant(p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func (h *handler) UpdatePlant(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	id, _ := strconv.Atoi(c.Param("id"))

	plant, err := h.db.GetPlantByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "plant not found"})
		return
	}
	if plant.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your plant"})
		return
	}

	var in updatePlantInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fields := map[string]any{}
	if in.Name != "" {
		fields["name"] = in.Name
	}
	if in.Species != "" {
		fields["species"] = in.Species
	}
	if in.Type != "" {
		fields["type"] = in.Type
	}
	if in.Description != "" {
		fields["description"] = in.Description
	}
	if in.ImageURL != "" {
		fields["image_url"] = in.ImageURL
	}
	if in.Region != "" {
		fields["region"] = in.Region
	}
	if in.IsAvailable != nil {
		fields["is_available"] = *in.IsAvailable
	}

	if err := h.db.UpdatePlant(uint(id), fields); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	updated, _ := h.db.GetPlantByID(uint(id))
	c.JSON(http.StatusOK, updated)
}

func (h *handler) DeletePlant(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	id, _ := strconv.Atoi(c.Param("id"))

	plant, err := h.db.GetPlantByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "plant not found"})
		return
	}
	if plant.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your plant"})
		return
	}
	h.db.DeletePlant(uint(id))
	c.JSON(http.StatusOK, gin.H{"message": "plant deleted"})
}

func (h *handler) SearchPlants(c *gin.Context) {
	q := c.Query("q")
	plants, err := h.db.SearchPlants(q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, plants)
}
