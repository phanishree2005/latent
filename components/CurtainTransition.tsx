'use client';

import React, { useEffect, useRef, useState } from 'react';

// WebGL 2.0 Velvet Theater Curtain transition shader
const VERTEX_SHADER = `#version 300 es
in vec2 corner;
void main() {
  gl_Position = vec4(corner, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float progress; // 0 to 1
uniform float reveal;   // 0 while covering, 1 while revealing
uniform float time;
uniform vec3 color;     // cloth color
uniform float center;   // 1 for center parting pair
out vec4 fragColor;

const float PI = 3.14159265;
const float FOLDS = 10.0;
const float DEPTH = 0.55;
const float TRAIL = 0.35;
const float SWAY = 0.35;
const float SWAY_SPEED = 0.25;
const float SHEEN = 0.45;
const float SHADOW = 0.06;
const float DIM = 0.65;

vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float noise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec3 ns = 0.142857142857 * vec3(2.0, 0.5, 1.0) - vec3(0.0, 1.0, 0.0);
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
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  float aspect = resolution.x / resolution.y;
  vec2 position = vec2(gl_FragCoord.x / resolution.y, 1.0 - gl_FragCoord.y / resolution.y);
  float x = position.x;
  float y = position.y;
  float PAD = SHADOW + 0.03;

  float side = center > 0.5 && x < aspect * 0.5 ? 1.0 : 0.0;
  if (center > 0.5) x = aspect * 0.5 + abs(x - aspect * 0.5);
  float meet = center > 0.5 ? aspect * 0.5 - 0.02 : -PAD;
  float folds = center > 0.5 ? FOLDS * (0.6 - side * 0.08) : FOLDS;

  float travel = mix(aspect + PAD, meet, progress);
  float moving = sin(progress * PI);
  float way = mix(1.0, -1.0, reveal);
  float trail = pow(y, 1.5) * TRAIL * moving * way;
  float ripple = noise(vec3(y * 2.5, time * 0.4, side * 5.0)) * 0.008;
  float edge = travel + trail + ripple;
  float inside = x - edge;

  float across = inside / max(aspect - edge, 0.05);
  float uneven = noise(vec3(across * 4.0 + side * 9.0, y * 0.8, time * SWAY_SPEED)) * SWAY;
  float phase = (across + (uneven + side * 0.4) / folds) * folds * PI * 2.0;
  float sharp = 1.0 - smoothstep(0.6, 1.6, fwidth(phase));

  float slope = (sin(phase) + sin(phase * 2.0 + 1.0) * 0.35) * DEPTH * sharp;
  vec3 normal = vec3(slope * (1.0 - 2.0 * side), 0.0, 1.0) / sqrt(slope * slope + 1.0);
  float lit = clamp(dot(normal, vec3(-0.5, -0.3, 0.81)), 0.0, 1.0);
  float sheen = pow(1.0 - normal.z, 1.2) * SHEEN * (lit * 0.6 + 0.4);
  float stage = mix(1.1, 0.7, y);
  float hem = mix(0.55, 1.0, smoothstep(0.0, 0.014, inside));
  vec3 body = mix(color * 0.15, color * 1.1, lit) * stage * hem;
  vec3 glow = mix(color, vec3(1.0, 0.85, 0.8), 0.35) * sheen;
  vec3 cloth = body + glow;

  float aa = max(fwidth(inside), 1e-5);
  float covered = smoothstep(-aa, aa, inside);
  float shadow = (1.0 - smoothstep(0.0, SHADOW, -inside)) * 0.35;
  float edges = length(position - vec2(aspect * 0.5, 0.5)) / (aspect * 0.6);
  float dim = smoothstep(0.0, 1.0, progress) * DIM * mix(0.9, 1.1, clamp(edges, 0.0, 1.0));
  float dark = 1.0 - (1.0 - shadow) * (1.0 - dim);
  float alpha = covered + dark * (1.0 - covered);
  vec3 rgb = mix(vec3(0.0), cloth, covered);

  alpha = progress >= 0.999 ? 1.0 : clamp(alpha, 0.0, 1.0) * step(0.001, progress);
  fragColor = vec4(pow(max(rgb, 0.0), vec3(1.0 / 2.2)) * alpha, alpha);
}
`;

export default function CurtainTransition() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vert = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const corner = gl.getAttribLocation(program, 'corner');
    gl.enableVertexAttribArray(corner);
    gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);

    const u = {
      resolution: gl.getUniformLocation(program, 'resolution'),
      progress: gl.getUniformLocation(program, 'progress'),
      reveal: gl.getUniformLocation(program, 'reveal'),
      time: gl.getUniformLocation(program, 'time'),
      color: gl.getUniformLocation(program, 'color'),
      center: gl.getUniformLocation(program, 'center'),
    };

    gl.uniform1f(u.center, 1.0); // Center parting
    // Crimson velvet color
    gl.uniform3f(u.color, 0.65, 0.02, 0.05);

    let progress = 1.0;
    let reveal = 1.0;
    let animId: number | null = null;
    let startTime = performance.now();
    const duration = 1200; // 1.2s opening animation

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const render = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(window.innerWidth * dpr);
      const h = Math.round(window.innerHeight * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      progress = 1.0 - ease(t); // From closed (1.0) to open (0.0)

      gl.uniform2f(u.resolution, w, h);
      gl.uniform1f(u.progress, progress);
      gl.uniform1f(u.reveal, reveal);
      gl.uniform1f(u.time, (now % 100000) / 1000);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (t < 1) {
        animId = requestAnimationFrame(render);
      } else {
        setIsActive(false);
        if (animId) cancelAnimationFrame(animId);
      }
    };

    setIsActive(true);
    animId = requestAnimationFrame(render);

    // Listen to custom curtain events
    const triggerCurtain = (e: any) => {
      setIsActive(true);
      startTime = performance.now();
      reveal = e.detail?.reveal ?? 1.0;
      if (animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(render);
    };

    window.addEventListener('trigger-curtain', triggerCurtain);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('trigger-curtain', triggerCurtain);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-300 ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    />
  );
}
