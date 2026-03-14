package services

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

// BlogService provides business logic for blog management.
type BlogService struct {
	repo domain.BlogRepository
}

// NewBlogService creates a new BlogService instance.
func NewBlogService(repo domain.BlogRepository) *BlogService {
	return &BlogService{
		repo: repo,
	}
}

// CreateBlog handles blog creation with slug generation.
func (s *BlogService) CreateBlog(ctx context.Context, blog *domain.Blog) (*domain.Blog, error) {
	if blog.Slug == "" {
		blog.Slug = s.GenerateSlug(blog.Title)
	}

	// Ensure slug uniqueness
	existing, _ := s.repo.FindBySlug(ctx, blog.Slug)
	if existing != nil {
		blog.Slug = fmt.Sprintf("%s-%d", blog.Slug, time.Now().Unix()%1000)
	}

	blog.CreatedAt = time.Now()
	blog.UpdatedAt = time.Now()

	if blog.IsPublished != nil && *blog.IsPublished && blog.PublishedAt == nil {
		t := time.Now()
		blog.PublishedAt = &t
	}

	return s.repo.Create(ctx, blog)
}

// UpdateBlog handles blog updates with partial field support and validation.
func (s *BlogService) UpdateBlog(ctx context.Context, id string, updates *domain.Blog) (*domain.Blog, error) {
	// 1. Fetch existing blog
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, fmt.Errorf("blog not found")
	}

	// 2. Apply updates (only if fields are provided/non-zero)
	if updates.Title != "" {
		existing.Title = updates.Title
		// Re-generate slug if title changed and slug not provided
		if updates.Slug == "" {
			existing.Slug = s.GenerateSlug(updates.Title)
		}
	}
	if updates.Slug != "" {
		existing.Slug = updates.Slug
	}
	if updates.Content != "" {
		existing.Content = updates.Content
	}
	if updates.Summary != "" {
		existing.Summary = updates.Summary
	}
	if updates.CoverImage != "" {
		existing.CoverImage = updates.CoverImage
	}
	if updates.Author != "" {
		existing.Author = updates.Author
	}
	if len(updates.Tags) > 0 {
		existing.Tags = updates.Tags
	}

	// Handle publish status change
	if updates.IsPublished != nil && *updates.IsPublished != *existing.IsPublished {
		existing.IsPublished = updates.IsPublished
		if *existing.IsPublished && existing.PublishedAt == nil {
			t := time.Now()
			existing.PublishedAt = &t
		}
	}

	existing.UpdatedAt = time.Now()

	return s.repo.Update(ctx, id, existing)
}

// GetBlogBySlug retrieves a blog by slug (for public view).
func (s *BlogService) GetBlogBySlug(ctx context.Context, slug string) (*domain.Blog, error) {
	blog, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if blog == nil || blog.IsPublished == nil || !*blog.IsPublished {
		return nil, fmt.Errorf("blog not found or not published")
	}
	return blog, nil
}

// ListPublishedBlogs returns paginated published blogs.
func (s *BlogService) ListPublishedBlogs(ctx context.Context, pagination *domain.Pagination) ([]domain.Blog, *domain.PaginationMeta, error) {
	return s.repo.FindPublished(ctx, pagination)
}

// AdminListBlogs returns all blogs for admin view.
func (s *BlogService) AdminListBlogs(ctx context.Context, pagination *domain.Pagination) ([]domain.Blog, *domain.PaginationMeta, error) {
	return s.repo.FindMany(ctx, nil, pagination, &domain.Sort{Field: "created_at", Order: domain.SortDesc})
}

// DeleteBlog handles blog deletion.
func (s *BlogService) DeleteBlog(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

// GenerateSlug creates a URL-friendly slug from a title.
func (s *BlogService) GenerateSlug(title string) string {
	slug := strings.ToLower(title)
	// Remove special characters
	re := regexp.MustCompile("[^a-z0-9]+")
	slug = re.ReplaceAllString(slug, "-")
	// Trim hyphens
	slug = strings.Trim(slug, "-")
	return slug
}

// GetBlogByID retrieves a blog by its ID.
func (s *BlogService) GetBlogByID(ctx context.Context, id string) (*domain.Blog, error) {
	return s.repo.FindByID(ctx, id)
}
