package domain

type FilePurpose string

const (
	PurposeProductFile FilePurpose = "product_file"
	PurposeCoverImage  FilePurpose = "cover_image"
)

// UploadRequest defines the input for generating a pre-signed URL.
type UploadRequest struct {
	FileName    string      `json:"file_name"`
	ContentType string      `json:"content_type"`
	Purpose     FilePurpose `json:"purpose"`
}

// UploadResponse returns the pre-signed URL and the file key.
type UploadResponse struct {
	UploadURL string `json:"upload_url"`
	FileKey   string `json:"file_key"`
}
