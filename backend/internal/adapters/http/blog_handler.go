package http

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/internal/core/services"
)

// BlogHandler handles HTTP requests for blog posts.
type BlogHandler struct {
	service *services.BlogService
}

// NewBlogHandler creates a new BlogHandler instance.
func NewBlogHandler(service *services.BlogService) *BlogHandler {
	return &BlogHandler{
		service: service,
	}
}

// GetPublicBlogs returns paginated published blog posts.
func (h *BlogHandler) GetPublicBlogs(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("pageSize", "10"), 10, 64)

	pagination := &domain.Pagination{
		Page:     page,
		PageSize: pageSize,
	}

	blogs, meta, err := h.service.ListPublishedBlogs(c.Context(), pagination)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to list blogs", err)
	}

	return SendSuccess(c, fiber.StatusOK, blogs, meta)
}

// GetBlogBySlug returns a single published blog post by slug.
func (h *BlogHandler) GetBlogBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	blog, err := h.service.GetBlogBySlug(c.Context(), slug)
	if err != nil {
		return SendError(c, fiber.StatusNotFound, ErrNotFound, "Blog not found", err)
	}
	return SendSuccess(c, fiber.StatusOK, blog, nil)
}

// AdminListBlogs returns all blog posts for admin view.
func (h *BlogHandler) AdminListBlogs(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	pageSize, _ := strconv.ParseInt(c.Query("pageSize", "20"), 10, 64)

	pagination := &domain.Pagination{
		Page:     page,
		PageSize: pageSize,
	}

	blogs, meta, err := h.service.AdminListBlogs(c.Context(), pagination)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to list blogs", err)
	}

	return SendSuccess(c, fiber.StatusOK, blogs, meta)
}

// CreateBlog creates a new blog post.
func (h *BlogHandler) CreateBlog(c *fiber.Ctx) error {
	var blog domain.Blog
	if err := c.BodyParser(&blog); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", err)
	}

	created, err := h.service.CreateBlog(c.Context(), &blog)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to create blog", err)
	}

	return SendCreated(c, created)
}

// UpdateBlog updates an existing blog post.
func (h *BlogHandler) UpdateBlog(c *fiber.Ctx) error {
	id := c.Params("id")
	var blog domain.Blog
	if err := c.BodyParser(&blog); err != nil {
		return SendError(c, fiber.StatusBadRequest, ErrBadRequest, "Invalid request body", err)
	}

	updated, err := h.service.UpdateBlog(c.Context(), id, &blog)
	if err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to update blog", err)
	}

	return SendSuccess(c, fiber.StatusOK, updated, nil)
}

// DeleteBlog deletes a blog post.
func (h *BlogHandler) DeleteBlog(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.service.DeleteBlog(c.Context(), id); err != nil {
		return SendError(c, fiber.StatusInternalServerError, ErrInternalServer, "Failed to delete blog", err)
	}
	return SendSuccess(c, fiber.StatusOK, nil, nil)
}

// GetBlogByID returns a single blog post by its ID (for admin editor).
func (h *BlogHandler) GetBlogByID(c *fiber.Ctx) error {
	id := c.Params("id")
	blog, err := h.service.GetBlogByID(c.Context(), id)
	if err != nil {
		return SendError(c, fiber.StatusNotFound, ErrNotFound, "Blog not found", err)
	}
	return SendSuccess(c, fiber.StatusOK, blog, nil)
}
