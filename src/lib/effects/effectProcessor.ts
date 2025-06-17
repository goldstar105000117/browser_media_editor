import { createImageProcessor, isWASMAvailable, fallbackEffects } from '@/lib/wasm/wasmLoader';

export interface EffectParams {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    temperature?: number;
    blur?: number;
}

export class EffectProcessor {
    private wasmProcessor: any = null;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        // Create an offscreen canvas for image processing
        this.canvas = document.createElement('canvas');
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context');
        }
        this.ctx = ctx;
    }

    public initForSize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;

        if (isWASMAvailable()) {
            this.wasmProcessor = createImageProcessor(width, height);
            console.log(`🦀 WASM processor initialized for ${width}x${height}`);
        } else {
            console.log(`📱 Using JavaScript fallback for ${width}x${height}`);
        }
    }

    public processImageData(imageData: ImageData, effects: EffectParams): ImageData {
        const startTime = performance.now();

        // Clone the data to avoid modifying original
        const processedData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );

        if (this.wasmProcessor && isWASMAvailable()) {
            // Use WASM for better performance
            this.wasmProcessor.apply_effects_batch(
                processedData.data,
                effects.brightness || 1.0,
                effects.contrast || 1.0,
                effects.temperature || 0.0,
                effects.blur || 0.0
            );
        } else {
            // Fallback to JavaScript
            if (effects.brightness && effects.brightness !== 1.0) {
                fallbackEffects.applyBrightness(processedData.data, effects.brightness);
            }

            if (effects.contrast && effects.contrast !== 1.0) {
                fallbackEffects.applyContrast(processedData.data, effects.contrast);
            }
        }

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        if (processingTime > 5) { // Only log slow operations
            console.log(`🎨 Effects processed in ${processingTime.toFixed(2)}ms`);
        }

        return processedData;
    }

    public processCanvasContent(canvas: HTMLCanvasElement, effects: EffectParams): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get current canvas content
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Process with effects
        const processedData = this.processImageData(imageData, effects);

        // Put back processed data
        ctx.putImageData(processedData, 0, 0);
    }

    public async processVideoFrame(
        video: HTMLVideoElement,
        effects: EffectParams
    ): Promise<ImageData | null> {
        if (video.videoWidth === 0 || video.videoHeight === 0) return null;

        // Draw video frame to canvas
        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;
        this.ctx.drawImage(video, 0, 0);

        // Get image data and process
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return this.processImageData(imageData, effects);
    }

    public dispose(): void {
        if (this.wasmProcessor) {
            // WASM cleanup if needed
            this.wasmProcessor = null;
        }
    }
}

// Singleton instance
let effectProcessor: EffectProcessor | null = null;

export function getEffectProcessor(): EffectProcessor {
    if (!effectProcessor) {
        effectProcessor = new EffectProcessor();
    }
    return effectProcessor;
}