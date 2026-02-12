package domain

import "context"

// Pagination holds pagination parameters for list queries.
type Pagination struct {
	Page     int64 `json:"page" bson:"-"`
	PageSize int64 `json:"pageSize" bson:"-"`
}

// PaginationMeta holds pagination metadata for responses.
type PaginationMeta struct {
	Page       int64 `json:"page"`
	PageSize   int64 `json:"pageSize"`
	TotalCount int64 `json:"totalCount"`
	TotalPages int64 `json:"totalPages"`
}

// Filter is a map of field names to values for query filtering.
type Filter map[string]interface{}

// SortOrder defines sorting direction.
type SortOrder int

const (
	SortAsc  SortOrder = 1
	SortDesc SortOrder = -1
)

// Sort defines a sort field and direction.
type Sort struct {
	Field string    `json:"field"`
	Order SortOrder `json:"order"`
}

// Repository defines the standard CRUD interface for data access.
// All implementations must accept context.Context as the first parameter.
type Repository[T any] interface {
	// FindByID retrieves a single entity by its ID.
	FindByID(ctx context.Context, id string) (*T, error)

	// FindMany retrieves multiple entities matching the given filter.
	FindMany(ctx context.Context, filter Filter, pagination *Pagination, sort *Sort) ([]T, *PaginationMeta, error)

	// Create inserts a new entity and returns the created entity.
	Create(ctx context.Context, entity *T) (*T, error)

	// Update modifies an existing entity by ID.
	Update(ctx context.Context, id string, entity *T) (*T, error)

	// Delete removes an entity by ID.
	Delete(ctx context.Context, id string) error

	// Count returns the number of entities matching the filter.
	Count(ctx context.Context, filter Filter) (int64, error)
}
