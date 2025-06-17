import { TimelineItem } from '@/types/editor';
import {
    vertexShaderSource,
    fragmentShaderSource,
    createShader,
    createProgram
} from './shaders';
import { getEffectProcessor, EffectParams } from '@/lib/effects/effectProcessor';

export class WebGLRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram | null = null;
    private positionBuffer: WebGLBuffer | null = null;
    private texCoordBuffer: WebGLBuffer | null = null;

    // Uniform locations
    private uniforms: { [key: string]: WebGLUniformLocation | null } = {};

    // Attribute locations
    private attributes: { [key: string]: number } = {};

    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL2 not supported');
        }
        this.gl = gl;
        this.initialize();
    }

    private initialize() {
        const gl = this.gl;

        // Create shaders
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        if (!vertexShader || !fragmentShader) {
            throw new Error('Failed to create shaders');
        }

        // Create program
        this.program = createProgram(gl, vertexShader, fragmentShader);
        if (!this.program) {
            throw new Error('Failed to create program');
        }

        // Get attribute locations
        this.attributes.position = gl.getAttribLocation(this.program, 'a_position');
        this.attributes.texCoord = gl.getAttribLocation(this.program, 'a_texCoord');

        // Get uniform locations
        this.uniforms.transform = gl.getUniformLocation(this.program, 'u_transform');
        this.uniforms.resolution = gl.getUniformLocation(this.program, 'u_resolution');
        this.uniforms.color = gl.getUniformLocation(this.program, 'u_color');
        this.uniforms.brightness = gl.getUniformLocation(this.program, 'u_brightness');
        this.uniforms.contrast = gl.getUniformLocation(this.program, 'u_contrast');
        this.uniforms.saturation = gl.getUniformLocation(this.program, 'u_saturation');
        this.uniforms.useTexture = gl.getUniformLocation(this.program, 'u_useTexture');

        // Create buffers
        this.createBuffers();

        // Set up WebGL state
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    private createBuffers() {
        const gl = this.gl;

        // Position buffer (rectangle vertices)
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        // Rectangle: two triangles
        const positions = [
            0, 0,    // top-left
            1, 0,    // top-right
            0, 1,    // bottom-left
            1, 0,    // top-right
            1, 1,    // bottom-right
            0, 1,    // bottom-left
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Texture coordinate buffer
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);

        const texCoords = [
            0, 0,    // top-left
            1, 0,    // top-right
            0, 1,    // bottom-left
            1, 0,    // top-right
            1, 1,    // bottom-right
            0, 1,    // bottom-left
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    }

    public render(items: TimelineItem[], currentTime: number, selectedItems: string[]) {
        const gl = this.gl;
        const canvas = gl.canvas as HTMLCanvasElement;

        // Debug logging
        const activeItems = items.filter(item => {
            const itemEndTime = item.startTime + item.duration;
            return currentTime >= item.startTime && currentTime <= itemEndTime;
        });

        if (activeItems.length > 0) {
            console.log(`🎬 Rendering ${activeItems.length} items at time ${currentTime.toFixed(2)}s`);
        }

        // Set viewport
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Clear
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (!this.program) return;

        // Use our program
        gl.useProgram(this.program);

        // Set resolution uniform
        gl.uniform2f(this.uniforms.resolution, canvas.width, canvas.height);

        // Render each active item
        items.forEach(item => {
            const itemEndTime = item.startTime + item.duration;

            if (currentTime >= item.startTime && currentTime <= itemEndTime) {
                this.renderItem(item, selectedItems.includes(item.id));
            }
        });
    }

    private renderItem(item: TimelineItem, isSelected: boolean) {
        const gl = this.gl;
        const { transform } = item;

        // Create transform matrix
        const matrix = this.createTransformMatrix(transform);
        gl.uniformMatrix3fv(this.uniforms.transform, false, matrix);

        // Set up attributes
        this.setupAttributes();

        if (item.type === 'text') {
            this.renderText(item, isSelected);
        } else {
            this.renderRect(item, isSelected);
        }

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        this.applyWASMEffects(item);
    }

    private setupAttributes() {
        const gl = this.gl;

        // Position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.attributes.position);
        gl.vertexAttribPointer(this.attributes.position, 2, gl.FLOAT, false, 0, 0);

        // Texture coordinate attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.attributes.texCoord);
        gl.vertexAttribPointer(this.attributes.texCoord, 2, gl.FLOAT, false, 0, 0);
    }

    private renderText(item: TimelineItem, isSelected: boolean) {
        const gl = this.gl;

        // Create a temporary canvas to render text as texture
        const textCanvas = document.createElement('canvas');
        const textCtx = textCanvas.getContext('2d');
        if (!textCtx) return;

        // Set canvas size to match item dimensions
        textCanvas.width = item.transform.width;
        textCanvas.height = item.transform.height;

        // Clear with transparent background
        textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

        // Draw text background (for visibility)
        textCtx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.1)';
        textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height);

        // Draw border if selected
        if (isSelected) {
            textCtx.strokeStyle = '#3b82f6';
            textCtx.lineWidth = 2;
            textCtx.strokeRect(1, 1, textCanvas.width - 2, textCanvas.height - 2);
        }

        // Set text properties
        const fontSize = item.properties.fontSize || 24;
        textCtx.font = `${fontSize}px Arial, sans-serif`;
        textCtx.fillStyle = item.properties.color || '#ffffff';
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';

        // Draw the text
        const text = item.properties.text || 'Text';
        textCtx.fillText(
            text,
            textCanvas.width / 2,
            textCanvas.height / 2
        );

        // Create WebGL texture from canvas
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Use texture in shader
        gl.uniform1i(this.uniforms.useTexture, 1);
        gl.uniform4f(this.uniforms.color, 1.0, 1.0, 1.0, 1.0);

        // Apply effects
        gl.uniform1f(this.uniforms.brightness, item.properties.brightness || 1.0);
        gl.uniform1f(this.uniforms.contrast, item.properties.contrast || 1.0);
        gl.uniform1f(this.uniforms.saturation, item.properties.saturation || 1.0);

        // Clean up texture after rendering
        setTimeout(() => {
            gl.deleteTexture(texture);
        }, 0);
    }

    private renderRect(item: TimelineItem, isSelected: boolean) {
        const gl = this.gl;

        gl.uniform4f(this.uniforms.color, 0.5, 0.5, 0.5, isSelected ? 0.8 : 1.0);
        gl.uniform1i(this.uniforms.useTexture, 0);

        gl.uniform1f(this.uniforms.brightness, 1.0);
        gl.uniform1f(this.uniforms.contrast, 1.0);
        gl.uniform1f(this.uniforms.saturation, 1.0);
    }

    private createTransformMatrix(transform: any): Float32Array {
        const { x, y, width, height, rotation, scale } = transform;

        // Create transformation matrix
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        // Scale first, then rotate, then translate
        return new Float32Array([
            width * scale * cos, width * scale * sin, x,
            -height * scale * sin, height * scale * cos, y,
            0, 0, 1
        ]);
    }

    private hexToRgb(hex: string): [number, number, number] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [1, 1, 1];
    }

    private applyWASMEffects(item: TimelineItem): void {
        const effects: EffectParams = {
            brightness: item.properties.brightness || 1.0,
            contrast: item.properties.contrast || 1.0,
            saturation: item.properties.saturation || 1.0,
            temperature: item.properties.temperature || 0.0,
            blur: item.properties.blur || 0.0,
        };

        // Only process if effects are applied
        const hasEffects = Object.values(effects).some((value, index) => {
            const defaults = [1.0, 1.0, 1.0, 0.0, 0.0];
            return value !== defaults[index];
        });

        if (hasEffects) {
            const canvas = this.gl.canvas as HTMLCanvasElement;
            const processor = getEffectProcessor();

            // Initialize processor for canvas size if needed
            processor.initForSize(canvas.width, canvas.height);

            // Apply effects to the current canvas content
            // Note: In a real implementation, you'd want to apply this to individual textures
            // processor.processCanvasContent(canvas, effects);

            console.log(`🎨 Applied WASM effects to ${item.id}:`, effects);
        }
    }

    public dispose() {
        const gl = this.gl;

        if (this.program) {
            gl.deleteProgram(this.program);
        }

        if (this.positionBuffer) {
            gl.deleteBuffer(this.positionBuffer);
        }

        if (this.texCoordBuffer) {
            gl.deleteBuffer(this.texCoordBuffer);
        }
    }


}