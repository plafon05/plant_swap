package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	maxFileSize = 5 << 20 // 5 MB
	uploadsDir  = "./uploads"
)

var allowedTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

func (h *handler) UploadFile(c *gin.Context) {
	if err := c.Request.ParseMultipartForm(maxFileSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file too large (max 5MB)"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}
	defer file.Close()

	// Проверка типа
	contentType := header.Header.Get("Content-Type")
	ext, ok := allowedTypes[contentType]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only jpg, png, webp, gif allowed"})
		return
	}

	// Создать папку если нет
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upload dir"})
		return
	}

	// Уникальное имя файла
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	dst := filepath.Join(uploadsDir, filename)

	// Сохранить файл
	buf := make([]byte, header.Size)
	if _, err := file.Read(buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}
	if err := os.WriteFile(dst, buf, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	// Вернуть публичный URL
	host := c.Request.Host
	scheme := "http"
	if c.Request.TLS != nil || strings.Contains(c.GetHeader("X-Forwarded-Proto"), "https") {
		scheme = "https"
	}
	url := fmt.Sprintf("%s://%s/uploads/%s", scheme, host, filename)

	c.JSON(http.StatusOK, gin.H{"url": url})
}
