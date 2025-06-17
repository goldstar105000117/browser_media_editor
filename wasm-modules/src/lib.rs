use wasm_bindgen::prelude::*;

// Import console.log for debugging
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Macro for console.log
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub struct ImageProcessor {
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> ImageProcessor {
        console_log!("🦀 WASM ImageProcessor initialized: {}x{}", width, height);
        ImageProcessor { width, height }
    }

    /// Apply blur effect to image data
    #[wasm_bindgen]
    pub fn apply_blur(&self, data: &mut [u8], radius: f32) {
        let radius = radius.max(0.0).min(10.0) as usize;
        if radius == 0 { return; }

        let width = self.width as usize;
        let height = self.height as usize;
        
        // Simple box blur implementation
        let mut temp = vec![0u8; data.len()];
        
        // Horizontal pass
        for y in 0..height {
            for x in 0..width {
                let mut r = 0u32;
                let mut g = 0u32;
                let mut b = 0u32;
                let mut count = 0u32;
                
                for dx in -(radius as i32)..=(radius as i32) {
                    let nx = (x as i32 + dx).max(0).min(width as i32 - 1) as usize;
                    let idx = (y * width + nx) * 4;
                    
                    r += data[idx] as u32;
                    g += data[idx + 1] as u32;
                    b += data[idx + 2] as u32;
                    count += 1;
                }
                
                let idx = (y * width + x) * 4;
                temp[idx] = (r / count) as u8;
                temp[idx + 1] = (g / count) as u8;
                temp[idx + 2] = (b / count) as u8;
                temp[idx + 3] = data[idx + 3]; // Keep alpha
            }
        }
        
        // Vertical pass
        for y in 0..height {
            for x in 0..width {
                let mut r = 0u32;
                let mut g = 0u32;
                let mut b = 0u32;
                let mut count = 0u32;
                
                for dy in -(radius as i32)..=(radius as i32) {
                    let ny = (y as i32 + dy).max(0).min(height as i32 - 1) as usize;
                    let idx = (ny * width + x) * 4;
                    
                    r += temp[idx] as u32;
                    g += temp[idx + 1] as u32;
                    b += temp[idx + 2] as u32;
                    count += 1;
                }
                
                let idx = (y * width + x) * 4;
                data[idx] = (r / count) as u8;
                data[idx + 1] = (g / count) as u8;
                data[idx + 2] = (b / count) as u8;
                // Alpha unchanged
            }
        }
    }

    /// Apply brightness adjustment
    #[wasm_bindgen]
    pub fn apply_brightness(&self, data: &mut [u8], brightness: f32) {
        let factor = brightness.max(0.0).min(3.0);
        
        for i in (0..data.len()).step_by(4) {
            data[i] = ((data[i] as f32 * factor).min(255.0)) as u8;     // R
            data[i + 1] = ((data[i + 1] as f32 * factor).min(255.0)) as u8; // G
            data[i + 2] = ((data[i + 2] as f32 * factor).min(255.0)) as u8; // B
            // Alpha unchanged
        }
    }

    /// Apply contrast adjustment
    #[wasm_bindgen]
    pub fn apply_contrast(&self, data: &mut [u8], contrast: f32) {
        let factor = contrast.max(0.0).min(3.0);
        
        for i in (0..data.len()).step_by(4) {
            // Contrast formula: newValue = (oldValue - 128) * contrast + 128
            data[i] = (((data[i] as f32 - 128.0) * factor + 128.0).max(0.0).min(255.0)) as u8;
            data[i + 1] = (((data[i + 1] as f32 - 128.0) * factor + 128.0).max(0.0).min(255.0)) as u8;
            data[i + 2] = (((data[i + 2] as f32 - 128.0) * factor + 128.0).max(0.0).min(255.0)) as u8;
        }
    }

    /// Apply color temperature adjustment
    #[wasm_bindgen]
    pub fn apply_temperature(&self, data: &mut [u8], temperature: f32) {
        // Temperature: -1.0 (cool/blue) to 1.0 (warm/orange)
        let temp = temperature.max(-1.0).min(1.0);
        
        for i in (0..data.len()).step_by(4) {
            if temp > 0.0 {
                // Warm (add red/yellow, reduce blue)
                data[i] = ((data[i] as f32 * (1.0 + temp * 0.3)).min(255.0)) as u8;     // R
                data[i + 1] = ((data[i + 1] as f32 * (1.0 + temp * 0.1)).min(255.0)) as u8; // G
                data[i + 2] = ((data[i + 2] as f32 * (1.0 - temp * 0.2)).max(0.0)) as u8;   // B
            } else {
                // Cool (add blue, reduce red/yellow)
                data[i] = ((data[i] as f32 * (1.0 + temp * 0.2)).max(0.0)) as u8;       // R
                data[i + 1] = ((data[i + 1] as f32 * (1.0 + temp * 0.1)).max(0.0)) as u8;   // G
                data[i + 2] = ((data[i + 2] as f32 * (1.0 - temp * 0.3)).min(255.0)) as u8; // B
            }
        }
    }

    /// Batch apply multiple effects (more efficient)
    #[wasm_bindgen]
    pub fn apply_effects_batch(
        &self, 
        data: &mut [u8], 
        brightness: f32,
        contrast: f32,
        temperature: f32,
        blur_radius: f32
    ) {
        // Apply effects in optimal order
        if brightness != 1.0 {
            self.apply_brightness(data, brightness);
        }
        
        if contrast != 1.0 {
            self.apply_contrast(data, contrast);
        }
        
        if temperature != 0.0 {
            self.apply_temperature(data, temperature);
        }
        
        if blur_radius > 0.0 {
            self.apply_blur(data, blur_radius);
        }
    }
}

/// Performance benchmarking function
#[wasm_bindgen]
pub fn benchmark_processing(width: u32, height: u32, iterations: u32) -> f64 {
    let size = (width * height * 4) as usize;
    let mut data = vec![128u8; size]; // Gray image
    
    let processor = ImageProcessor::new(width, height);
    
    let start = js_sys::Date::now();
    
    for _ in 0..iterations {
        processor.apply_effects_batch(&mut data, 1.2, 1.1, 0.1, 1.0);
    }
    
    let end = js_sys::Date::now();
    let duration = end - start;
    
    console_log!(
        "🚀 WASM Benchmark: {}x{} image, {} iterations in {:.2}ms", 
        width, height, iterations, duration
    );
    
    duration
}