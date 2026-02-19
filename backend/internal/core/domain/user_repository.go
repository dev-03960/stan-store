package domain

import "context"

// UserRepository extends the base Repository with user-specific query methods.
type UserRepository interface {
	Repository[User]

	// FindByEmail finds a user by their email address (case-insensitive).
	FindByEmail(ctx context.Context, email string) (*User, error)

	// FindByGoogleID finds a user by their Google OAuth ID.
	FindByGoogleID(ctx context.Context, googleID string) (*User, error)

	// FindByUsername finds a user by their claimed username (case-insensitive).
	FindByUsername(ctx context.Context, username string) (*User, error)

	// UpdateStatus updates a user's status (active/banned) along with ban metadata.
	UpdateStatus(ctx context.Context, id string, status string, reason string) error
}
