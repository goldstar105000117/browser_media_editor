import { MockImageProcessor, mockBenchmarkProcessing, WASMImageProcessor } from './mockWasm';

let wasmModule: any = null;
let ImageProcessor: any = null;
let isUsingMockWasm = false;

export async function initWASM(): Promise<boolean> {
    try {
        console.log('🦀 Attempting to load WASM module...');

        // Try to load real WASM first
        try {
            const wasm = await import('../../../public/wasm/video_effects.js');
            await wasm.default('/wasm/video_effects_bg.wasm');

            wasmModule = wasm;
            ImageProcessor = wasm.ImageProcessor;
            isUsingMockWasm = false;

            console.log('✅ Real WASM module loaded successfully!');

            // Run benchmark
            const benchmark = wasm.benchmark_processing;
            if (benchmark) {
                const time = benchmark(800, 600, 10);
                console.log(`⚡ Real WASM Performance: ${time.toFixed(2)}ms for 10 iterations`);
            }

            return true;
        } catch (wasmError) {
            console.warn('⚠️ Real WASM not available, using mock WASM:', wasmError);

            // Fallback to mock WASM
            ImageProcessor = MockImageProcessor;
            isUsingMockWasm = true;

            console.log('✅ Mock WASM module loaded successfully!');

            // Run mock benchmark
            const time = mockBenchmarkProcessing(800, 600, 10);
            console.log(`⚡ Mock WASM Performance: ${time.toFixed(2)}ms for 10 iterations`);

            return true;
        }
    } catch (error) {
        console.error('❌ Failed to load any WASM module:', error);
        return false;
    }
}

export function createImageProcessor(width: number, height: number): WASMImageProcessor | null {
    if (!ImageProcessor) {
        console.warn('⚠️ WASM module not loaded');
        return null;
    }

    return new ImageProcessor(width, height);
}

export function isWASMAvailable(): boolean {
    return ImageProcessor !== null;
}

export function isUsingMockWASM(): boolean {
    return isUsingMockWasm;
}

export function getWASMStatus(): string {
    if (!ImageProcessor) return 'Not Loaded';
    if (isUsingMockWasm) return 'Mock WASM';
    return 'Real WASM';
}

// Fallback JavaScript implementations for when nothing is available
export const fallbackEffects = {
    applyBrightness(data: Uint8ClampedArray, brightness: number): void {
        console.log('📱 Using JavaScript fallback for brightness');
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * brightness);         // R
            data[i + 1] = Math.min(255, data[i + 1] * brightness); // G
            data[i + 2] = Math.min(255, data[i + 2] * brightness); // B
        }
    },

    applyContrast(data: Uint8ClampedArray, contrast: number): void {
        console.log('📱 Using JavaScript fallback for contrast');
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128));
        }
    }
};