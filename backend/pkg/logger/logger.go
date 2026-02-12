package logger

import (
	"context"
	"log/slog"
	"os"
)

// logger is the package-level structured logger instance.
var log *slog.Logger

func init() {
	log = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))
	slog.SetDefault(log)
}

// Info logs an informational message with optional key-value pairs.
func Info(msg string, args ...any) {
	log.Info(msg, args...)
}

// Error logs an error message with optional key-value pairs.
func Error(msg string, args ...any) {
	log.Error(msg, args...)
}

// Warn logs a warning message with optional key-value pairs.
func Warn(msg string, args ...any) {
	log.Warn(msg, args...)
}

// Debug logs a debug message with optional key-value pairs.
func Debug(msg string, args ...any) {
	log.Debug(msg, args...)
}

// Fatal logs an error message and exits the application.
func Fatal(msg string, args ...any) {
	log.Error(msg, args...)
	os.Exit(1)
}

// WithContext returns a logger with context fields attached.
func WithContext(ctx context.Context) *slog.Logger {
	return log.With("trace_id", ctx.Value("request_id"))
}

// With returns a logger with additional key-value pairs.
func With(args ...any) *slog.Logger {
	return log.With(args...)
}
