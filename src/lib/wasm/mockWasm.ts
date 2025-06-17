// Mock WASM module that simulates WebAssembly performance
// This shows integration patterns without requiring Rust compilation

export class MockImageProcessor {
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        console.log(`🦀 Mock WASM ImageProcessor initialized: ${width}x${height}`);
    }

    apply_blur(data: Uint8ClampedArray, radius: number): void {
        // Simulate WASM performance with optimized JavaScript
        const startTime = performance.now();

        if (radius <= 0) return;

        // Simple box blur implementation (faster than real blur for demo)
        const width = this.width;
        const height = this.height;
        const tempData = new Uint8ClampedArray(data);

        // Simplified blur for performance demo
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Average with neighbors
                for (let c = 0; c < 3; c++) {
                    const sum =
                        tempData[idx + c] +
                        tempData[idx - 4 + c] + tempData[idx + 4 + c] +
                        tempData[idx - width * 4 + c] + tempData[idx + width * 4 + c];
                    data[idx + c] = sum / 5;
                }
            }
        }

        const endTime = performance.now();
        console.log(`🎨 Mock WASM blur: ${(endTime - startTime).toFixed(2)}ms`);
    }

    apply_brightness(data: Uint8ClampedArray, brightness: number): void {
        const startTime = performance.now();

        // Optimized brightness adjustment
        const factor = Math.max(0, Math.min(3, brightness));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * factor);         // R
            data[i + 1] = Math.min(255, data[i + 1] * factor); // G
            data[i + 2] = Math.min(255, data[i + 2] * factor); // B
            // Alpha unchanged
        }

        const endTime = performance.now();
        if (endTime - startTime > 1) {
            console.log(`🎨 Mock WASM brightness: ${(endTime - startTime).toFixed(2)}ms`);
        }
    }

    apply_contrast(data: Uint8ClampedArray, contrast: number): void {
        const startTime = performance.now();

        const factor = Math.max(0, Math.min(3, contrast));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
        }

        const endTime = performance.now();
        if (endTime - startTime > 1) {
            console.log(`🎨 Mock WASM contrast: ${(endTime - startTime).toFixed(2)}ms`);
        }
    }

    apply_temperature(data: Uint8ClampedArray, temperature: number): void {
        const startTime = performance.now();

        const temp = Math.max(-1, Math.min(1, temperature));

        for (let i = 0; i < data.length; i += 4) {
            if (temp > 0) {
                // Warm (more red/yellow, less blue)
                data[i] = Math.min(255, data[i] * (1 + temp * 0.3));         // R
                data[i + 1] = Math.min(255, data[i + 1] * (1 + temp * 0.1)); // G
                data[i + 2] = Math.max(0, data[i + 2] * (1 - temp * 0.2));   // B
            } else {
                // Cool (more blue, less red/yellow)
                data[i] = Math.max(0, data[i] * (1 + temp * 0.2));           // R
                data[i + 1] = Math.max(0, data[i + 1] * (1 + temp * 0.1));   // G
                data[i + 2] = Math.min(255, data[i + 2] * (1 - temp * 0.3)); // B
            }
        }

        const endTime = performance.now();
        if (endTime - startTime > 1) {
            console.log(`🎨 Mock WASM temperature: ${(endTime - startTime).toFixed(2)}ms`);
        }
    }

    apply_effects_batch(
        data: Uint8ClampedArray,
        brightness: number,
        contrast: number,
        temperature: number,
        blur_radius: number
    ): void {
        const startTime = performance.now();

        // Apply effects in optimal order
        if (brightness !== 1.0) {
            this.apply_brightness(data, brightness);
        }

        if (contrast !== 1.0) {
            this.apply_contrast(data, contrast);
        }

        if (temperature !== 0.0) {
            this.apply_temperature(data, temperature);
        }

        if (blur_radius > 0.0) {
            this.apply_blur(data, blur_radius);
        }

        const endTime = performance.now();
        console.log(`🚀 Mock WASM batch processing: ${(endTime - startTime).toFixed(2)}ms`);
    }
}

// Mock benchmark function
export function mockBenchmarkProcessing(width: number, height: number, iterations: number): number {
    const size = width * height * 4;
    const data = new Uint8ClampedArray(size);

    // Fill with test pattern
    for (let i = 0; i < size; i += 4) {
        data[i] = 128;     // R
        data[i + 1] = 128; // G
        data[i + 2] = 128; // B
        data[i + 3] = 255; // A
    }

    const processor = new MockImageProcessor(width, height);

    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
        processor.apply_effects_batch(data, 1.2, 1.1, 0.1, 1.0);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(
        `🚀 Mock WASM Benchmark: ${width}x${height} image, ${iterations} iterations in ${duration.toFixed(2)}ms`
    );

    return duration;
}

// Export interface that matches real WASM
export interface WASMImageProcessor {
    new(width: number, height: number): WASMImageProcessor;
    apply_blur(data: Uint8ClampedArray, radius: number): void;
    apply_brightness(data: Uint8ClampedArray, brightness: number): void;
    apply_contrast(data: Uint8ClampedArray, contrast: number): void;
    apply_temperature(data: Uint8ClampedArray, temperature: number): void;
    apply_effects_batch(
        data: Uint8ClampedArray,
        brightness: number,
        contrast: number,
        temperature: number,
        blur_radius: number
    ): void;
}