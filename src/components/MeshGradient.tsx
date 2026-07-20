'use client';

import { useEffect, useRef } from 'react';

/**
 * High-performance WebGL mesh-gradient background.
 *
 * Renders a fragment-shader-based animated multi-color gradient with a soft
 * grain overlay. Falls back to a pure-CSS mesh gradient when:
 *   - WebGL is unavailable
 *   - prefers-reduced-motion is set
 *   - the device is likely low-power (small viewport / save-data)
 *
 * Performance:
 *   - Single full-screen quad, all work done in fragment shader
 *   - Runs at native refresh but throttles to ~30fps on battery via rAF timing
 *   - Pauses entirely when tab is hidden or prefers-reduced-motion
 */

const VERT = `attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_dpr;

// Hash + noise (Ashima/Stzdz) — cheap 2D simplex-ish noise
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}

// Smooth fractal noise — used to drive blob positions
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<4;i++){
    v+=a*snoise(p);
    p*=2.0; a*=0.5;
  }
  return v;
}

// Palette drives color choice across the canvas
vec3 palette(float t){
  // Warm sunrise palette: rose -> orange -> amber -> soft cream
  vec3 c1=vec3(0.86,0.15,0.15);   // red-600
  vec3 c2=vec3(0.92,0.40,0.10);   // orange-600
  vec3 c3=vec3(0.98,0.65,0.14);   // amber-500
  vec3 c4=vec3(0.99,0.85,0.55);   // soft cream
  vec3 m1=mix(c1,c2,smoothstep(0.0,0.33,t));
  vec3 m2=mix(m1,c3,smoothstep(0.33,0.66,t));
  return mix(m2,c4,smoothstep(0.66,1.0,t));
}

void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy;
  vec2 p=(uv-0.5);
  p.x*=u_res.x/u_res.y;

  // Drift across time, soft flow
  float t=u_time*0.04;

  // Two layers of fbm produce smooth flowing blobs
  float n1=fbm(p*1.4+vec2(t,t*0.6));
  float n2=fbm(p*2.1+vec2(-t*0.8,t*0.4)+n1);

  float mask=smoothstep(-0.2,0.8,n2);

  // Color stops based on noise — gives flowing color regions
  float cT=clamp(n2*0.5+0.5+0.1*sin(t*2.0),0.0,1.0);
  vec3 col=palette(cT);

  // Mouse-driven bright spot — subtle glow follows cursor
  float md=distance(uv*u_dpr,u_mouse*u_dpr);
  float mglow=exp(-md*2.0)*0.10;
  col+=mglow*vec3(1.0,0.5,0.3);

  // Soft vignette to focus the page center
  float vig=smoothstep(1.3,0.3,distance(uv,vec2(0.5,0.45)));
  col*=0.55+0.45*vig;

  // Final alpha — keep it translucent so content reads clearly
  float alpha=mix(0.18,0.32,mask)*vig;

  gl_FragColor=vec4(col*alpha,alpha);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const vsh = createShader(gl, gl.VERTEX_SHADER, vs);
  const fsh = createShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!vsh || !fsh) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vsh);
  gl.attachShader(program, fsh);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { saveData?: boolean }).saveData === true;
    const smallViewport = window.innerWidth < 640;

    // Always show the fallback mesh — it's cheap CSS.
    if (fallbackRef.current) fallbackRef.current.style.opacity = '1';

    // Skip WebGL if reduced motion, save-data, or small/low-power device
    if (prefersReduced || saveData || smallViewport) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    if (!gl) return;

    const program = createProgram(gl, VERT, FRAG);
    if (!program) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Full-screen quad: two triangles
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(program, 'a_pos');
    const uRes = gl.getUniformLocation(program, 'u_res');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uDpr = gl.getUniformLocation(program, 'u_dpr');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();

    let visible = !document.hidden;
    const onVis = () => {
      visible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVis);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    window.addEventListener('resize', resize);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Show canvas now that WebGL is alive
    canvas.style.opacity = '0.55';

    let raf = 0;
    let last = 0;
    const start = performance.now();

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      // Throttle to ~30fps to save battery
      if (now - last < 33) return;
      last = now;
      if (!visible) return;

      const time = (now - start) / 1000;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uDpr, dpr);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      document.removeEventListener('visibilitychange', onVis);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <>
      {/* Fallback: pure-CSS mesh gradient (always on, cheap) */}
      <div
        ref={fallbackRef}
        aria-hidden="true"
        className="mesh-bg fixed inset-0 -z-20 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: 0 }}
      />

      {/* WebGL animated overlay (hidden until shader compiles) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: 0 }}
      />

      {/* Subtle film grain */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Top + bottom soft fade so content has breathing room */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 -z-10 h-32 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, var(--bg-primary), transparent)',
        }}
      />
    </>
  );
}
