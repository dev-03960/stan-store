package storage

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"

	"github.com/devanshbhargava/stan-store/pkg/logger"
)

const (
	connectTimeout = 10 * time.Second
	pingTimeout    = 5 * time.Second
	maxPoolSize    = 100
	minPoolSize    = 5
	maxIdleTime    = 30 * time.Second
)

// MongoDB holds the MongoDB client and database references.
type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
}

// ConnectMongoDB establishes a connection to MongoDB with connection pooling.
// It pings the database to verify the connection and returns an error on failure.
func ConnectMongoDB(uri string, dbName string) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), connectTimeout)
	defer cancel()

	opts := options.Client().
		ApplyURI(uri).
		SetMaxPoolSize(maxPoolSize).
		SetMinPoolSize(minPoolSize).
		SetMaxConnIdleTime(maxIdleTime)

	client, err := mongo.Connect(ctx, opts)
	if err != nil {
		return nil, err
	}

	// Verify connection with ping
	pingCtx, pingCancel := context.WithTimeout(context.Background(), pingTimeout)
	defer pingCancel()

	if err := client.Ping(pingCtx, readpref.Primary()); err != nil {
		return nil, err
	}

	database := client.Database(dbName)

	logger.Info("mongodb connected",
		"database", dbName,
	)

	return &MongoDB{
		Client:   client,
		Database: database,
	}, nil
}

// Disconnect gracefully closes the MongoDB connection.
func (m *MongoDB) Disconnect() {
	ctx, cancel := context.WithTimeout(context.Background(), pingTimeout)
	defer cancel()

	if err := m.Client.Disconnect(ctx); err != nil {
		logger.Error("mongodb disconnect error", "error", err.Error())
		return
	}

	logger.Info("mongodb disconnected")
}

// Collection returns a handle to a specific collection.
func (m *MongoDB) Collection(name string) *mongo.Collection {
	return m.Database.Collection(name)
}
