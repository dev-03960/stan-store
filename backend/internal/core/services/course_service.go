package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
)

var (
	ErrCourseNotFound = errors.New("course not found")
	ErrModuleNotFound = errors.New("module not found")
	ErrLessonNotFound = errors.New("lesson not found")
)

type CourseService struct {
	courseRepo  domain.CourseRepository
	productRepo domain.ProductRepository
	orderRepo   domain.OrderRepository
	userRepo    domain.UserRepository // To fetch buyer's email if needed
}

func NewCourseService(courseRepo domain.CourseRepository, productRepo domain.ProductRepository, orderRepo domain.OrderRepository, userRepo domain.UserRepository) *CourseService {
	return &CourseService{
		courseRepo:  courseRepo,
		productRepo: productRepo,
		orderRepo:   orderRepo,
		userRepo:    userRepo,
	}
}

// getOrCreateCourse gets a course by product ID, creating a default one if it doesn't exist
func (s *CourseService) getOrCreateCourse(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID) (*domain.Course, error) {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, err
	}
	if product.CreatorID != creatorID {
		return nil, errors.New("unauthorized access to product")
	}

	course, err := s.courseRepo.FindByProductID(ctx, productID)
	if err != nil {
		// Simplistic check for ErrNotFound or mongo.ErrNoDocuments from repository
		if err.Error() == "not found" || err.Error() == "mongo: no documents in result" {
			course = &domain.Course{
				ProductID: productID,
				CreatorID: creatorID,
				Modules:   []domain.Module{},
			}
			if err := s.courseRepo.Create(ctx, course); err != nil {
				return nil, err
			}
			return course, nil
		}
		return nil, err
	}
	return course, nil
}

// GetCourse retrieves the full course structure
func (s *CourseService) GetCourse(ctx context.Context, productID primitive.ObjectID, requesterID primitive.ObjectID, isCreator bool) (*domain.Course, error) {
	// If creator, verify ownership and return/create
	if isCreator {
		return s.getOrCreateCourse(ctx, productID, requesterID)
	}

	// 1. Fetch user to get their email
	buyer, err := s.userRepo.FindByID(ctx, requesterID.Hex())
	if err != nil {
		return nil, errors.New("unauthorized: user not found")
	}

	// 2. Fetch all orders for this buyer to see if they bought this product
	orders, err := s.orderRepo.FindAllByCustomerEmail(ctx, buyer.Email)
	if err != nil {
		return nil, errors.New("failed to verify course purchase")
	}

	hasPurchased := false
	for _, order := range orders {
		if order.Status != domain.OrderStatusPaid {
			continue
		}
		// Check both legacy ProductID and new LineItems array
		if order.ProductID == productID {
			hasPurchased = true
			break
		}
		for _, item := range order.LineItems {
			if item.ProductID == productID {
				hasPurchased = true
				break
			}
		}
		if hasPurchased {
			break
		}
	}

	if !hasPurchased {
		return nil, errors.New("unauthorized: you have not purchased this course")
	}

	course, err := s.courseRepo.FindByProductID(ctx, productID)
	if err != nil {
		return nil, err
	}
	return course, nil
}

// CreateModule adds a new module to a course
func (s *CourseService) CreateModule(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID, title string, sortOrder int) (*domain.Course, error) {
	course, err := s.getOrCreateCourse(ctx, productID, creatorID)
	if err != nil {
		return nil, err
	}

	newModule := domain.Module{
		ID:        uuid.New().String(),
		Title:     title,
		SortOrder: sortOrder,
		Lessons:   []domain.Lesson{},
	}

	course.Modules = append(course.Modules, newModule)
	if err := s.courseRepo.Update(ctx, course); err != nil {
		return nil, err
	}

	return course, nil
}

// UpdateModule updates a module's title/order
func (s *CourseService) UpdateModule(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID, moduleID string, title string, sortOrder int) (*domain.Course, error) {
	course, err := s.getOrCreateCourse(ctx, productID, creatorID)
	if err != nil {
		return nil, err
	}

	found := false
	for i := range course.Modules {
		if course.Modules[i].ID == moduleID {
			course.Modules[i].Title = title
			course.Modules[i].SortOrder = sortOrder
			found = true
			break
		}
	}

	if !found {
		return nil, ErrModuleNotFound
	}

	if err := s.courseRepo.Update(ctx, course); err != nil {
		return nil, err
	}

	return course, nil
}

// DeleteModule removes a module and all its lessons
func (s *CourseService) DeleteModule(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID, moduleID string) (*domain.Course, error) {
	course, err := s.getOrCreateCourse(ctx, productID, creatorID)
	if err != nil {
		return nil, err
	}

	newModules := make([]domain.Module, 0, len(course.Modules))
	found := false
	for _, mod := range course.Modules {
		if mod.ID == moduleID {
			found = true
			continue
		}
		newModules = append(newModules, mod)
	}

	if !found {
		return nil, ErrModuleNotFound
	}

	course.Modules = newModules
	if err := s.courseRepo.Update(ctx, course); err != nil {
		return nil, err
	}

	return course, nil
}

// CreateLesson adds a new lesson to a specific module
func (s *CourseService) CreateLesson(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID, moduleID string, lesson domain.Lesson) (*domain.Course, error) {
	course, err := s.getOrCreateCourse(ctx, productID, creatorID)
	if err != nil {
		return nil, err
	}

	found := false
	for i := range course.Modules {
		if course.Modules[i].ID == moduleID {
			lesson.ID = uuid.New().String()
			course.Modules[i].Lessons = append(course.Modules[i].Lessons, lesson)
			found = true
			break
		}
	}

	if !found {
		return nil, ErrModuleNotFound
	}

	if err := s.courseRepo.Update(ctx, course); err != nil {
		return nil, err
	}

	return course, nil
}

// UpdateLesson updates a lesson within a module
func (s *CourseService) UpdateLesson(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID, moduleID string, lessonID string, updatedLesson domain.Lesson) (*domain.Course, error) {
	course, err := s.getOrCreateCourse(ctx, productID, creatorID)
	if err != nil {
		return nil, err
	}

	foundMod := false
	foundLes := false
	for i := range course.Modules {
		if course.Modules[i].ID == moduleID {
			foundMod = true
			for j := range course.Modules[i].Lessons {
				if course.Modules[i].Lessons[j].ID == lessonID {
					// Preserve ID and update fields
					updatedLesson.ID = lessonID
					course.Modules[i].Lessons[j] = updatedLesson
					foundLes = true
					break
				}
			}
			break
		}
	}

	if !foundMod {
		return nil, ErrModuleNotFound
	}
	if !foundLes {
		return nil, ErrLessonNotFound
	}

	if err := s.courseRepo.Update(ctx, course); err != nil {
		return nil, err
	}

	return course, nil
}

// DeleteLesson removes a lesson from a module
func (s *CourseService) DeleteLesson(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID, moduleID string, lessonID string) (*domain.Course, error) {
	course, err := s.getOrCreateCourse(ctx, productID, creatorID)
	if err != nil {
		return nil, err
	}

	foundMod := false
	foundLes := false
	for i := range course.Modules {
		if course.Modules[i].ID == moduleID {
			foundMod = true
			newLessons := make([]domain.Lesson, 0, len(course.Modules[i].Lessons))
			for _, les := range course.Modules[i].Lessons {
				if les.ID == lessonID {
					foundLes = true
					continue
				}
				newLessons = append(newLessons, les)
			}
			course.Modules[i].Lessons = newLessons
			break
		}
	}

	if !foundMod {
		return nil, ErrModuleNotFound
	}
	if !foundLes {
		return nil, ErrLessonNotFound
	}

	if err := s.courseRepo.Update(ctx, course); err != nil {
		return nil, err
	}

	return course, nil
}

// ReorderStructure takes a full module/lesson array replacement to handle drag-and-drop
func (s *CourseService) ReorderStructure(ctx context.Context, productID primitive.ObjectID, creatorID primitive.ObjectID, modules []domain.Module) (*domain.Course, error) {
	course, err := s.getOrCreateCourse(ctx, productID, creatorID)
	if err != nil {
		return nil, err
	}

	// Could add validation here that no modules/lessons were lost or added that are unknown,
	// but for now trusting the creator UI provided structure IDs.
	course.Modules = modules
	if err := s.courseRepo.Update(ctx, course); err != nil {
		return nil, err
	}

	return course, nil
}
