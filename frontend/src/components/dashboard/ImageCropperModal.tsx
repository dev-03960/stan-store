import { useState, useCallback } from 'react';
import Cropper, { type Point, type Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCropperModalProps {
    isOpen: boolean;
    onClose: () => void;
    image: string; // Data URL or object URL
    onCropComplete: (croppedImage: Blob) => void;
    aspect: number; // 1 for profile, 4 for cover
    shape?: 'rect' | 'round';
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area
): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    // Set canvas size to the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg');
    });
}

export default function ImageCropperModal({ 
    isOpen, 
    onClose, 
    image, 
    onCropComplete, 
    aspect, 
    shape = 'rect' 
}: ImageCropperModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((_showInternal: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
            if (croppedImageBlob) {
                onCropComplete(croppedImageBlob);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white dark:bg-[#1a1d2b] rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adjust Photo</h2>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Cropper Area */}
                        <div className="relative h-[400px] w-full bg-black">
                            <Cropper
                                image={image}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect}
                                cropShape={shape}
                                onCropChange={onCropChange}
                                onCropComplete={onCropCompleteInternal}
                                onZoomChange={onZoomChange}
                                showGrid={false}
                            />
                        </div>

                        {/* Controls */}
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <ZoomOut className="w-5 h-5 text-gray-400" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#6786f5]"
                                />
                                <ZoomIn className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-[#6786f5] hover:bg-[#5570e0] text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    Save Photo
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
