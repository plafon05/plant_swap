package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	mw "plantswap/internal/http-server/middleware"
)

func (h *handler) GetTradeHistory(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	history, err := h.db.GetTradeHistory(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, history)
}

func (h *handler) GetTradeDetail(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	h_entry, err := h.db.GetTradeHistoryByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, h_entry)
}

func (h *handler) GetActiveUsers(c *gin.Context) {
	users, err := h.db.GetActiveUsers(10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *handler) GetPopularPlants(c *gin.Context) {
	plants, err := h.db.GetPopularPlants(10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, plants)
}

func (h *handler) GetStats(c *gin.Context) {
	stats, err := h.db.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
