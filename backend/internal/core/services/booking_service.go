package services

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/devanshbhargava/stan-store/internal/core/domain"
	"github.com/devanshbhargava/stan-store/pkg/logger"
)

// BookingService handles the business logic for bookings and availability.
type BookingService struct {
	bookingRepo domain.BookingRepository
	productRepo domain.ProductRepository
}

// NewBookingService creates a new BookingService.
func NewBookingService(bookingRepo domain.BookingRepository, productRepo domain.ProductRepository) *BookingService {
	return &BookingService{
		bookingRepo: bookingRepo,
		productRepo: productRepo,
	}
}

// GetAvailableSlots returns available time slots in UTC for a specific date (YYYY-MM-DD).
func (s *BookingService) GetAvailableSlots(ctx context.Context, productID primitive.ObjectID, targetDateStr string) ([]time.Time, error) {
	product, err := s.productRepo.FindByID(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	if product == nil {
		return nil, fmt.Errorf("product not found")
	}

	if product.ProductType != domain.ProductTypeBooking {
		return nil, fmt.Errorf("product is not a booking product")
	}

	if len(product.Availability) == 0 {
		return []time.Time{}, nil // No availability set
	}

	durationMins := product.DurationMinutes
	if durationMins <= 0 {
		durationMins = 30 // default fallback
	}

	timezone := product.Timezone
	if timezone == "" {
		timezone = "UTC"
	}

	loc, err := time.LoadLocation(timezone)
	if err != nil {
		// fallback to UTC if invalid
		logger.Error("invalid timezone configured on product, falling back to UTC", "timezone", timezone, "product_id", productID.Hex())
		loc, _ = time.LoadLocation("UTC")
	}

	// Parse target date in the context of the creator's timezone
	targetDate, err := time.ParseInLocation("2006-01-02", targetDateStr, loc)
	if err != nil {
		return nil, fmt.Errorf("invalid date format (expected YYYY-MM-DD): %w", err)
	}

	targetWeekday := int(targetDate.Weekday())
	var availableSlots []time.Time

	// Generate all potential slots for the day
	for _, window := range product.Availability {
		if window.DayOfWeek != targetWeekday {
			continue
		}

		// Parse start time and end time
		startT, err := time.Parse("15:04", window.StartTime)
		if err != nil {
			logger.Error("invalid start time in availability window", "start_time", window.StartTime)
			continue
		}

		endT, err := time.Parse("15:04", window.EndTime)
		if err != nil {
			logger.Error("invalid end time in availability window", "end_time", window.EndTime)
			continue
		}

		// Construct time.Time objects for the specific date
		windowStart := time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), startT.Hour(), startT.Minute(), 0, 0, loc)
		windowEnd := time.Date(targetDate.Year(), targetDate.Month(), targetDate.Day(), endT.Hour(), endT.Minute(), 0, 0, loc)

		currentSlot := windowStart
		for currentSlot.Add(time.Duration(durationMins)*time.Minute).Before(windowEnd) ||
			currentSlot.Add(time.Duration(durationMins)*time.Minute).Equal(windowEnd) {

			// We store and return all slots in UTC
			availableSlots = append(availableSlots, currentSlot.UTC())
			currentSlot = currentSlot.Add(time.Duration(durationMins) * time.Minute)
		}
	}

	// If no slots generated, short circuit
	if len(availableSlots) == 0 {
		return []time.Time{}, nil
	}

	// Fetch existing bookings to filter out taken slots
	// We load bookings from Start of Day to End of Day
	sod := targetDate.UTC()
	eod := targetDate.Add(24 * time.Hour).UTC()

	bookings, err := s.bookingRepo.FindByProductID(ctx, productID, sod, eod)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch existing bookings: %w", err)
	}

	// Map taken times for O(1) lookup
	takenSlots := make(map[int64]bool)
	for _, b := range bookings {
		// A slot is taken if its exact start time is already booked
		takenSlots[b.SlotStart.UTC().Unix()] = true
	}

	var filteredSlots []time.Time
	for _, slot := range availableSlots {
		if !takenSlots[slot.Unix()] {
			// Also ensure we don't return slots in the past
			if slot.After(time.Now().UTC()) {
				filteredSlots = append(filteredSlots, slot)
			}
		}
	}

	return filteredSlots, nil
}

// CreateBooking creates a new confirmed booking.
func (s *BookingService) CreateBooking(ctx context.Context, booking *domain.Booking) error {
	// Re-verify the slot is still available
	overlaps, err := s.bookingRepo.FindOverlapping(ctx, booking.ProductID, booking.SlotStart, booking.SlotEnd)
	if err != nil {
		return fmt.Errorf("failed to check overlapping bookings: %w", err)
	}

	if len(overlaps) > 0 {
		return fmt.Errorf("SLOT_UNAVAILABLE")
	}

	booking.Status = domain.BookingStatusConfirmed

	// Create placeholder meeting link if none provided
	if booking.MeetingLink == "" {
		booking.MeetingLink = "https://meet.google.com/placeholder-" + booking.ID.Hex()[:6]
	}

	return s.bookingRepo.Create(ctx, booking)
}

// CancelBooking cancels a booking if within the cancellation window.
func (s *BookingService) CancelBooking(ctx context.Context, bookingID primitive.ObjectID, requesterEmail string, isCreator bool) error {
	booking, err := s.bookingRepo.GetByID(ctx, bookingID)
	if err != nil {
		return err
	}
	if booking == nil {
		return fmt.Errorf("booking not found")
	}

	// Authorization check
	if !isCreator && booking.BuyerEmail != requesterEmail {
		return fmt.Errorf("unauthorized to cancel this booking")
	}

	if booking.Status == domain.BookingStatusCancelled {
		return fmt.Errorf("booking is already cancelled")
	}

	product, err := s.productRepo.FindByID(ctx, booking.ProductID)
	if err != nil {
		return fmt.Errorf("failed to fetch product policy: %w", err)
	}

	windowHours := product.CancellationWindowHours
	if windowHours <= 0 {
		windowHours = 24 // default policy
	}

	cutoffTime := booking.SlotStart.Add(-time.Duration(windowHours) * time.Hour)
	if time.Now().UTC().After(cutoffTime) && !isCreator {
		return fmt.Errorf("cancellation period has expired (requires %d hours notice)", windowHours)
	}

	return s.bookingRepo.UpdateStatus(ctx, bookingID, domain.BookingStatusCancelled)
}
