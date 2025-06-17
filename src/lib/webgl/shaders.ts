// Vertex shader - positions our elements
export const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  uniform mat3 u_transform;
  uniform vec2 u_resolution;
  
  varying vec2 v_texCoord;
  
  void main() {
    // Apply transform and convert to clip space
    vec3 position = u_transform * vec3(a_position, 1.0);
    
    // Convert from pixels to clip space
    vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader - colors our pixels
export const fragmentShaderSource = `
  precision mediump float;
  
  uniform vec4 u_color;
  uniform sampler2D u_texture;
  uniform bool u_useTexture;
  
  // Effect uniforms
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color;
    
    if (u_useTexture) {
      color = texture2D(u_texture, v_texCoord);
      // Don't apply effects to transparent pixels
      if (color.a < 0.01) {
        gl_FragColor = color;
        return;
      }
    } else {
      color = u_color;
    }
    
    // Apply effects
    color.rgb *= u_brightness;
    color.rgb = ((color.rgb - 0.5) * u_contrast) + 0.5;
    
    // Simple saturation
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(vec3(gray), color.rgb, u_saturation);
    
    gl_FragColor = color;
  }
`;

// Utility functions
export function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}