import { useEffect, useRef } from 'react';

export function AtmosphericBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    const gl =
      canvas.getContext('webgl', { alpha: true, antialias: false, depth: false }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      console.warn('[AtmosphericBackground] WebGL not supported, using CSS mesh fallback.');
      return;
    }

    function syncSize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const targetW = Math.floor(w * dpr);
      const targetH = Math.floor(h * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    }

    syncSize();
    window.addEventListener('resize', syncSize);

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Exact fragment shader from Stitch project 6694817817845011625
    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      // Simplex/Perlin noise helper functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      // Pseudo-random film grain
      float hash12(vec2 p) {
        vec3 p3  = fract(vec3(p.xyx) * .1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      void main() {
        vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        float t = u_time * 0.18;

        // Domain warping for organic air / water liquid flow
        vec2 q = vec2(0.0);
        q.x = snoise(vec3(st * 1.3, t * 0.8));
        q.y = snoise(vec3(st * 1.3 + vec2(4.3, 1.2), t * 0.7));

        vec2 r = vec2(0.0);
        r.x = snoise(vec3(st * 1.8 + 2.0 * q + vec2(1.7, 9.2), t * 0.9));
        r.y = snoise(vec3(st * 1.8 + 2.0 * q + vec2(8.3, 2.8), t * 0.85));

        float f = snoise(vec3(st * 2.2 + 2.5 * r, t));
        f = 0.5 + 0.5 * f; // Normalize to [0, 1]

        // Inspired by Stitch: Deep Prussian Navy, Atmospheric Cyan-Teal, Soft Luminous Ivory Crest
        vec3 deepNavy   = vec3(0.02, 0.08, 0.16);   // #051429
        vec3 midOcean   = vec3(0.06, 0.22, 0.35);   // #0F3859
        vec3 cyanTeal   = vec3(0.18, 0.49, 0.58);   // #2E7D94
        vec3 paleMist   = vec3(0.88, 0.92, 0.84);   // #E0EBD6 (soft glowing crest line)

        // Fluid blending based on warped field
        vec3 col = mix(deepNavy, midOcean, smoothstep(0.1, 0.6, f));
        col = mix(col, cyanTeal, smoothstep(0.45, 0.8, f + 0.2 * q.x));

        // Sharp organic wave rib / light caustics
        float ridge = 1.0 - abs(f - 0.62) * 4.5;
        ridge = clamp(ridge, 0.0, 1.0);
        ridge = pow(ridge, 3.0);
        col = mix(col, paleMist, ridge * 0.92);

        // Subtle interactive mouse deflection
        vec2 mouseNorm = (u_mouse - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
        float dMouse = length(st - mouseNorm);
        col += vec3(0.08, 0.18, 0.25) * exp(-dMouse * 3.5);

        // Analog fine film grain texture as in reference image
        float grain = hash12(gl_FragCoord.xy + fract(u_time * 11.23) * 100.0);
        col += (grain - 0.5) * 0.075;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error('[AtmosphericBackground] Shader compile error:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[AtmosphericBackground] Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    const mouse = { x: canvas.width * 0.5, y: canvas.height * 0.5 };

    const handleMouseMove = (e: MouseEvent) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      mouse.x = e.clientX * dpr;
      mouse.y = (window.innerHeight - e.clientY) * dpr;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = (time: number) => {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, time * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      data-purpose="background-shader-container"
      aria-hidden="true"
    >
      {/* CSS Mesh fallback to ensure liquid aesthetic is ALWAYS visible */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 20% 20%, rgba(14, 53, 71, 0.8) 0%, transparent 60%),
            radial-gradient(ellipse 80% 80% at 80% 75%, rgba(46, 125, 148, 0.7) 0%, transparent 60%),
            linear-gradient(135deg, #051429 0%, #0F3859 40%, #030712 100%)
          `,
        }}
      />
      {/* Real-time WebGL Fluid Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block absolute inset-0"
        style={{ width: '100%', height: '100%' }}
        id="shader-canvas"
      />
      {/* Scanline Overlay for Cybernetic Industrial Feel */}
      <div className="scanlines absolute inset-0 pointer-events-none opacity-30" />
    </div>
  );
}
