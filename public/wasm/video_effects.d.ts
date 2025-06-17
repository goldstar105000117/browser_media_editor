/* tslint:disable */
/* eslint-disable */
/**
 * Performance benchmarking function
 */
export function benchmark_processing(width: number, height: number, iterations: number): number;
export class ImageProcessor {
  free(): void;
  constructor(width: number, height: number);
  /**
   * Apply blur effect to image data
   */
  apply_blur(data: Uint8Array, radius: number): void;
  /**
   * Apply brightness adjustment
   */
  apply_brightness(data: Uint8Array, brightness: number): void;
  /**
   * Apply contrast adjustment
   */
  apply_contrast(data: Uint8Array, contrast: number): void;
  /**
   * Apply color temperature adjustment
   */
  apply_temperature(data: Uint8Array, temperature: number): void;
  /**
   * Batch apply multiple effects (more efficient)
   */
  apply_effects_batch(data: Uint8Array, brightness: number, contrast: number, temperature: number, blur_radius: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_imageprocessor_free: (a: number, b: number) => void;
  readonly imageprocessor_new: (a: number, b: number) => number;
  readonly imageprocessor_apply_blur: (a: number, b: number, c: number, d: any, e: number) => void;
  readonly imageprocessor_apply_brightness: (a: number, b: number, c: number, d: any, e: number) => void;
  readonly imageprocessor_apply_contrast: (a: number, b: number, c: number, d: any, e: number) => void;
  readonly imageprocessor_apply_temperature: (a: number, b: number, c: number, d: any, e: number) => void;
  readonly imageprocessor_apply_effects_batch: (a: number, b: number, c: number, d: any, e: number, f: number, g: number, h: number) => void;
  readonly benchmark_processing: (a: number, b: number, c: number) => number;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
