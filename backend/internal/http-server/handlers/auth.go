package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	mw "plantswap/internal/http-server/middleware"
	"plantswap/internal/storage/models"
)

// ─── Input DTOs ───────────────────────────────────────────────────────────────

type registerInput struct {
	Name     string `json:"name"     binding:"required,min=2"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Region   string `json:"region"`
}

type loginInput struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type updateProfileInput struct {
	Name        string `json:"name"`
	Region      string `json:"region"`
	Bio         string `json:"bio"`
	Avatar      string `json:"avatar"`
	Email       string `json:"email"`
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

func (h *handler) Register(c *gin.Context) {
	var in registerInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := &models.User{
		Name:         in.Name,
		Email:        in.Email,
		PasswordHash: string(hash),
		Region:       in.Region,
	}
	if err := h.db.CreateUser(user); err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	token, err := h.generateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"token": token, "user": user})
}

func (h *handler) Login(c *gin.Context) {
	var in loginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.db.GetUserByEmail(in.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(in.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := h.generateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

func (h *handler) GetProfile(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	user, err := h.db.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *handler) UpdateProfile(c *gin.Context) {
	userID := c.GetUint(mw.UserIDKey)
	var in updateProfileInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fields := map[string]any{}
	if in.Name != "" {
		fields["name"] = in.Name
	}
	if in.Region != "" {
		fields["region"] = in.Region
	}
	if in.Bio != "" {
		fields["bio"] = in.Bio
	}
	if in.Avatar != "" {
		fields["avatar"] = in.Avatar
	}
	if in.Email != "" {
		fields["email"] = in.Email
	}

	// Смена пароля
	if in.NewPassword != "" {
		if in.OldPassword == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "old_password required"})
			return
		}
		if len(in.NewPassword) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "new password min 6 characters"})
			return
		}
		user, err := h.db.GetUserByID(userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(in.OldPassword)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "old password is incorrect"})
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(in.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}
		fields["password_hash"] = string(hash)
	}

	if len(fields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "nothing to update"})
		return
	}

	if err := h.db.UpdateUser(userID, fields); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	user, _ := h.db.GetUserByID(userID)
	c.JSON(http.StatusOK, user)
}

// ─── JWT helper ───────────────────────────────────────────────────────────────

func (h *handler) generateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(h.cfg.JWT.ExpiresDur).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// Secret comes from config which reads it from env / GitHub Secret — never hardcoded
	return token.SignedString([]byte(h.cfg.JWT.Secret))
}
