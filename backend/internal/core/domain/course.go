package domain

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// LessonType defines the format of the lesson content
type LessonType string

const (
	LessonTypeVideo      LessonType = "video"
	LessonTypeText       LessonType = "text"
	LessonTypeAttachment LessonType = "attachment"
)

// Lesson represents an individual item in a course module
type Lesson struct {
	ID              string     `bson:"lesson_id" json:"id"`
	Title           string     `bson:"title" json:"title" validate:"required"`
	Type            LessonType `bson:"type" json:"type" validate:"required,oneof=video text attachment"`
	Content         string     `bson:"content" json:"content"` // URL, text, or file key depending on type
	SortOrder       int        `bson:"sort_order" json:"sort_order"`
	DurationMinutes int        `bson:"duration_minutes,omitempty" json:"duration_minutes,omitempty"` // For videos
}

// Module represents a section within a course
type Module struct {
	ID        string   `bson:"module_id" json:"id"`
	Title     string   `bson:"title" json:"title" validate:"required"`
	SortOrder int      `bson:"sort_order" json:"sort_order"`
	Lessons   []Lesson `bson:"lessons" json:"lessons"`
}

// Course represents the structure of an educational product
type Course struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID primitive.ObjectID `bson:"product_id" json:"product_id"`
	CreatorID primitive.ObjectID `bson:"creator_id" json:"creator_id"`
	Modules   []Module           `bson:"modules" json:"modules"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

// CourseRepository defines the interface for course storage
type CourseRepository interface {
	Create(ctx context.Context, course *Course) error
	FindByProductID(ctx context.Context, productID primitive.ObjectID) (*Course, error)
	FindByID(ctx context.Context, id string) (*Course, error)
	Update(ctx context.Context, course *Course) error
	DeleteByProductID(ctx context.Context, productID primitive.ObjectID) error
}
