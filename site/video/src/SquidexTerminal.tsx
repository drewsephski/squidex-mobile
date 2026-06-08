import React, {useCallback, useRef} from 'react';
import {
  AbsoluteFill,
  HtmlInCanvas,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  type HtmlInCanvasOnInit,
  type HtmlInCanvasOnPaint,
} from 'remotion';

// ═══════════════════════════════════════════════════════════════════════
// CRT Convex Shader (WebGL2)
// ═══════════════════════════════════════════════════════════════════════

const VS = `#version 300 es
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_uv = a_uv;
}`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform float u_time;
uniform vec2 u_resolution;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 uv = v_uv;

  // Convex barrel distortion
  vec2 centered = uv - 0.5;
  float r = length(centered);
  float k = 0.065;
  vec2 distorted = centered * (1.0 + k * r * r) + 0.5;

  if (distorted.x < 0.0 || distorted.x > 1.0 || distorted.y < 0.0 || distorted.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // RGB sub-pixel shift at edges
  float edgeFactor = smoothstep(0.0, 0.8, r * 2.0);
  float rgbShift = edgeFactor * 1.8 / u_resolution.x;

  float rCol = texture(u_tex, distorted + vec2(rgbShift, 0.0)).r;
  vec3 gbCol = texture(u_tex, distorted).gba;
  float bCol = texture(u_tex, distorted - vec2(rgbShift, 0.0)).b;

  vec3 color = vec3(rCol, gbCol.r, bCol);

  // Scanlines: fine ~2px + thick ~10px
  float scanline = sin(gl_FragCoord.y * 3.14159) * 0.035 + 0.965;
  float thickScanline = 1.0 - (sin(gl_FragCoord.y * 0.6283) * 0.5 + 0.5) * 0.04;
  color *= scanline * thickScanline;

  // Vignette
  float vignette = 1.0 - r * 1.2;
  vignette = clamp(vignette, 0.3, 1.0);
  vignette = smoothstep(0.3, 1.0, vignette);
  color *= vignette;

  // Green phosphor glow
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  color += luminance * 0.05 * vec3(0.15, 0.7, 0.25);

  // Center bloom
  color += exp(-r * 3.0) * 0.03 * vec3(0.1, 0.5, 0.2);

  // Curved corners
  float cornerRadius = 0.02;
  vec2 cornerDist = abs(uv - 0.5) - (0.5 - cornerRadius);
  float outsideCorner = length(max(cornerDist, 0.0));
  float cornerAlpha = 1.0 - smoothstep(0.0, cornerRadius, outsideCorner);
  color *= cornerAlpha;

  fragColor = vec4(color, 1.0);
}`;

const QUAD = new Float32Array([
  -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1,
  1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1,
]);

type GlState = {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uTex: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  texture: WebGLTexture;
  vao: WebGLVertexArrayObject;
};

function linkProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(`Shader error: ${gl.getShaderInfoLog(s)}`);
    }
    return s;
  };
  const vert = compile(gl.VERTEX_SHADER, vsSrc);
  const frag = compile(gl.FRAGMENT_SHADER, fsSrc);
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  return program;
}

// ═══════════════════════════════════════════════════════════════════════
// Design Tokens
// ═══════════════════════════════════════════════════════════════════════

const C = {
  bg: '#0C0D0F',
  terminalBg: '#0A0B0D',
  green: '#4ADE80',
  greenDim: '#2D7A4F',
  amber: '#E8AD55',
  amberDim: '#7A5A2E',
  dim: '#52545A',
  white: '#E4E4E7',
  phoneBg: '#0F0F13',
  phoneBorder: 'rgba(255,245,235,0.08)',
  messageUser: 'linear-gradient(135deg, #E8AD55 0%, #D4874A 100%)',
  messageBot: '#181A20',
};

// ═══════════════════════════════════════════════════════════════════════
// ASCII Logo
// ═══════════════════════════════════════════════════════════════════════

const SQUIDEX_ASCII = [
  ' ███████╗  ██████╗  ██╗   ██╗ ██╗ ██████╗  ███████╗ ██╗  ██╗',
  ' ██╔════╝ ██╔═══██╗ ██║   ██║ ██║ ██╔══██╗ ██╔════╝ ╚██╗██╔╝',
  ' ███████╗ ██║   ██║ ██║   ██║ ██║ ██║  ██║ █████╗    ╚███╔╝ ',
  ' ╚════██║ ██║▄▄ ██║ ██║   ██║ ██║ ██║  ██║ ██╔══╝    ██╔██╗ ',
  ' ███████║ ╚██████╔╝ ╚██████╔╝ ██║ ██████╔╝ ███████╗ ██╔╝ ██╗',
  ' ╚══════╝  ╚══▀▀═╝   ╚═════╝  ╚═╝ ╚═════╝  ╚══════╝ ╚═╝  ╚═╝',
];

const SUBTITLE = 'your AI coding tools · in your pocket';

// ═══════════════════════════════════════════════════════════════════════
// QR Code Visual (decorative pattern)
// ═══════════════════════════════════════════════════════════════════════

// Generate a deterministic decorative QR-like pattern (21x21 grid)
function generateQRPattern(): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({length: size}, () => Array(size).fill(false));

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const outer = y === 0 || y === 6 || x === 0 || x === 6;
        const inner = y >= 2 && y <= 4 && x >= 2 && x <= 4;
        if (outer || inner) grid[oy + y][ox + x] = true;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(14, 0);
  drawFinder(0, 14);

  // Timing patterns
  for (let i = 8; i < 13; i++) grid[6][i] = i % 2 === 0;
  for (let i = 8; i < 13; i++) grid[i][6] = i % 2 === 0;

  // Pseudo-random data fill
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x]) continue;
      // Skip finder + timing zones
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      grid[y][x] = ((x * 7 + y * 13 + 3) % 5) < 2;
    }
  }

  return grid;
}

const QR_PATTERN = generateQRPattern();
const QR_CELL = 8;
const QR_SIZE = QR_PATTERN.length * QR_CELL;
const QR_GRID = QR_PATTERN.length;

const QRCodeVisual: React.FC<{opacity: number; scale: number}> = ({opacity, scale}) => (
  <div style={{opacity, transform: `scale(${scale})`, transformOrigin: 'center center'}}>
    <svg width={QR_SIZE + 16} height={QR_SIZE + 16} viewBox={`0 0 ${QR_SIZE + 16} ${QR_SIZE + 16}`}>
      <rect x={0} y={0} width={QR_SIZE + 16} height={QR_SIZE + 16} rx={8} fill="#0F1115" />
      {QR_PATTERN.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${y}-${x}`}
              x={x * QR_CELL + 8}
              y={y * QR_CELL + 8}
              width={QR_CELL}
              height={QR_CELL}
              rx={1}
              fill={C.green}
            />
          ) : null,
        ),
      )}
    </svg>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// CRT Wrapper
// ═══════════════════════════════════════════════════════════════════════

// Check if WebGL2 is available (cached — only runs once)
let webgl2Available: boolean | null = null;

function checkWebGL2(): boolean {
  if (webgl2Available !== null) return webgl2Available;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2', {antialias: false});
    webgl2Available = gl !== null;
  } catch {
    webgl2Available = false;
  }
  return webgl2Available;
}

const CrtWrapper: React.FC<{
  children: React.ReactNode;
  width: number;
  height: number;
}> = ({children, width, height}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gpuRef = useRef<GlState | null>(null);

  // Bail early if HtmlInCanvas or WebGL2 are not available
  if (!HtmlInCanvas.isSupported() || !checkWebGL2()) {
    return <>{children}</>;
  }

  const onInit: HtmlInCanvasOnInit = useCallback(({canvas}) => {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!gl) return () => {}; // defensive — already checked above

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const program = linkProgram(gl, VS, FS);
    const uTex = gl.getUniformLocation(program, 'u_tex');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const locPos = gl.getAttribLocation(program, 'a_pos');
    const locUv = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(locPos);
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(locUv);
    gl.vertexAttribPointer(locUv, 2, gl.FLOAT, false, 16, 8);

    gpuRef.current = {gl, program, uTex, uTime, uResolution, texture, vao};

    return () => {
      gl.deleteProgram(program);
      gl.deleteTexture(texture);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(buffer);
      gpuRef.current = null;
    };
  }, []);

  const onPaint: HtmlInCanvasOnPaint = useCallback(
    ({canvas, elementImage}) => {
      const gpu = gpuRef.current;
      if (!gpu) return;

      const {gl} = gpu;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.useProgram(gpu.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, gpu.texture);
      gl.texElementImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, elementImage);

      if (gpu.uTex) gl.uniform1i(gpu.uTex, 0);
      if (gpu.uTime) gl.uniform1f(gpu.uTime, frame / fps);
      if (gpu.uResolution) gl.uniform2f(gpu.uResolution, canvas.width, canvas.height);

      gl.bindVertexArray(gpu.vao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    [frame, fps],
  );

  return (
    <HtmlInCanvas width={width} height={height} onInit={onInit} onPaint={onPaint}>
      {children}
    </HtmlInCanvas>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Terminal Scene
// ═══════════════════════════════════════════════════════════════════════

const TerminalScene: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ── Scene fade in ──
  const sceneOpacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});

  // ── Command typing (local frames 30-110) ──
  const CMD = 'squidex start';
  const cmdStart = 30;
  const cmdProgress = interpolate(frame, [cmdStart, cmdStart + 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const typedLength = Math.floor(cmdProgress * CMD.length);
  const typedCmd = CMD.substring(0, typedLength);
  const cmdDone = typedLength >= CMD.length;
  const cursorBlink = Math.sin(frame * 0.15) > 0;
  const showCursor = frame >= cmdStart && (cmdDone ? cursorBlink : true);

  // ── Output lines (local frames 115-160) ──
  const outputLines = [
    {text: 'bridge: scanning local environment...', color: C.dim},
    {text: 'bridge: codex app-server found at /usr/local/bin/codex', color: C.dim},
    {text: 'bridge: websocket server started on ws://0.0.0.0:9123', color: C.green},
    {text: 'bridge: auth token generated', color: C.green},
    {text: 'bridge: ready for connections', color: C.green},
  ];
  const outStart = 118;
  const outDelay = 16;

  // ── ASCII logo (local frames 165-215) ──
  const asciiStart = 165;
  const asciiSpring = spring({
    frame: frame - asciiStart,
    fps,
    config: {damping: 12, stiffness: 80, mass: 0.8},
    durationInFrames: 35,
  });
  const asciiOpacity = interpolate(frame, [asciiStart, asciiStart + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── QR code (local frames 200-240) ──
  const qrStart = 200;
  const qrSpring = spring({
    frame: frame - qrStart,
    fps,
    config: {damping: 10, stiffness: 100},
    durationInFrames: 30,
  });
  const qrOpacity = interpolate(frame, [qrStart, qrStart + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Slide-out transition (global frames 240-270) ──
  const slideOut = interpolate(globalFrame, [240, 275], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = slideOut * -28;
  const exitOpacity = 1 - slideOut;
  const exitScale = 1 - slideOut * 0.04;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.terminalBg,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        opacity: sceneOpacity * exitOpacity,
        transform: `translateX(${translateX}%) scale(${exitScale})`,
      }}
    >
      <div style={{padding: 48, height: '100%', display: 'flex', flexDirection: 'column'}}>
        {/* Window dots */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 28,
            opacity: frame < 10 ? 0 : 1,
          }}
        >
          <div style={dotStyle('#FF5F56')} />
          <div style={dotStyle('#FFBD2E')} />
          <div style={dotStyle('#27C93F')} />
        </div>

        {/* Command line */}
        <div style={{display: 'flex', alignItems: 'center', marginBottom: 20, minHeight: 30}}>
          <span style={{color: C.amber, marginRight: 10}}>$</span>
          <span style={{color: C.white, fontSize: 22}}>{typedCmd}</span>
          {showCursor && (
            <span style={cursorStyle(C.green, cmdDone ? (cursorBlink ? 1 : 0) : 1)} />
          )}
        </div>

        {/* Output lines */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          {outputLines.map((line, i) => {
            const lineStart = outStart + i * outDelay;
            const visible = frame >= lineStart;
            const fade = interpolate(frame, [lineStart, lineStart + 6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={i}
                style={{
                  color: line.color,
                  opacity: fade,
                  fontSize: 16,
                  transform: `translateX(${(1 - fade) * -6}px)`,
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>

        {/* ASCII Logo */}
        <div
          style={{
            marginTop: 40,
            opacity: asciiOpacity,
            transform: `scale(${0.85 + asciiSpring * 0.15})`,
            transformOrigin: 'left center',
          }}
        >
          {SQUIDEX_ASCII.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 17,
                lineHeight: 1.2,
                color: C.green,
                whiteSpace: 'pre',
              }}
            >
              {line}
            </div>
          ))}
          <div
            style={{
              marginTop: 16,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 13,
              color: C.greenDim,
              letterSpacing: 2,
              textTransform: 'uppercase',
              opacity: asciiOpacity,
            }}
          >
            {SUBTITLE}
          </div>
        </div>

        {/* QR Code */}
        <div
          style={{
            position: 'absolute',
            right: 80,
            bottom: 80,
            opacity: qrOpacity,
            transform: `scale(${qrSpring})`,
          }}
        >
          <QRCodeVisual opacity={1} scale={1} />
          <div
            style={{
              textAlign: 'center',
              marginTop: 12,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 13,
              color: C.greenDim,
            }}
          >
            scan to connect
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Phone Scene
// ═══════════════════════════════════════════════════════════════════════

const phoneMessages = [
  {from: 'bot', text: "Hey! I'm working on your auth module."},
  {from: 'user', text: 'Add JWT support and rate limiting'},
  {from: 'bot', text: 'On it. Scaffolding middleware chain now.'},
];

const TABS = ['Chat', 'Terminal', 'Git'];
const ACTIVE_TAB = 0;

const PhoneScene: React.FC<{globalFrame: number}> = ({globalFrame}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ── Slide in from right + zoom ──
  const slideIn = spring({
    frame,
    fps,
    config: {damping: 14, stiffness: 70, mass: 0.9},
    durationInFrames: 35,
  });
  const phoneTranslateX = interpolate(slideIn, [0, 1], [30, 0]);
  const phoneOpacity = interpolate(slideIn, [0, 1], [0, 1]);
  const phoneScale = interpolate(slideIn, [0, 1], [0.88, 1]);

  // ── Messages appear ──
  const msgStart = 50;
  const msgDelay = 28;

  // ── Input bar appears after all messages ──
  const inputStart = msgStart + phoneMessages.length * msgDelay + 10;

  // ── Animated prompt typing ──
  const PROMPT = "Let's add JWT authentication with refresh tokens and rate limiting middleware.";
  const promptStart = 140;
  const promptProgress = interpolate(
    frame,
    [promptStart, promptStart + 110],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const typedChars = Math.floor(promptProgress * PROMPT.length);
  const typedPrompt = PROMPT.substring(0, typedChars);
  const promptDone = typedChars >= PROMPT.length;
  const promptCursor = Math.sin(frame * 0.12) > 0;

  const allMessagesVisible = frame >= msgStart + (phoneMessages.length - 1) * msgDelay;

  // ── Shared font tokens ──
  const fontUI = '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const fontHeading = '"Syne", "Sora", -apple-system, sans-serif';
  const fontMono = '"JetBrains Mono", "SF Mono", "Fira Code", monospace';

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: phoneOpacity,
        transform: `translateX(${phoneTranslateX}%) scale(${phoneScale})`,
      }}
    >
      {/* Ambient glow behind phone */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,173,85,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Phone mockup */}
      <div
        style={{
          width: 320,
          height: 640,
          backgroundColor: C.phoneBg,
          borderRadius: 44,
          border: `1px solid ${C.phoneBorder}`,
          boxShadow: `
            0 0 0 1px rgba(255,245,235,0.03),
            0 40px 80px rgba(0,0,0,0.6),
            0 0 120px rgba(232,173,85,0.05)
          `,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 28,
            backgroundColor: C.phoneBg,
            borderRadius: 20,
            zIndex: 10,
          }}
        />

        {/* Status bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 28px 8px',
            fontSize: 11,
            fontFamily: fontUI,
            fontWeight: 600,
            color: C.dim,
          }}
        >
          <span>9:41</span>
          <span>●●●●○</span>
        </div>

        {/* Chat header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 18px 12px',
            borderBottom: '1px solid rgba(255,245,235,0.04)',
            opacity: frame >= 20 ? 1 : 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: C.messageUser,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontFamily: fontHeading,
              fontWeight: 700,
              color: '#0B0C0E',
            }}
          >
            C
          </div>
          <div>
            <div style={{fontSize: 13, fontWeight: 600, color: C.white, fontFamily: fontHeading}}>
              Codex
            </div>
            <div style={{fontSize: 10, color: C.dim, fontFamily: fontUI, fontWeight: 500}}>
              Connected · Private bridge
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '0 18px',
            borderBottom: '1px solid rgba(255,245,235,0.04)',
            opacity: frame >= 25 ? 1 : 0,
          }}
        >
          {TABS.map((tab, i) => {
            const active = i === ACTIVE_TAB;
            return (
              <div
                key={tab}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px 0 8px',
                  fontSize: 10,
                  fontFamily: fontUI,
                  fontWeight: active ? 600 : 400,
                  color: active ? C.amber : C.dim,
                  borderBottom: active ? `2px solid ${C.amber}` : '2px solid transparent',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {tab}
              </div>
            );
          })}
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflow: 'hidden',
          }}
        >
          {phoneMessages.map((msg, i) => {
            const start = msgStart + i * msgDelay;
            const visible = frame >= start;
            const fade = interpolate(frame, [start, start + 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const slide = (1 - fade) * 8;

            return (
              <div
                key={i}
                style={{
                  alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '84%',
                  padding: '10px 14px',
                  borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.from === 'user' ? C.messageUser : C.messageBot,
                  border: msg.from === 'user' ? 'none' : `1px solid rgba(255,245,235,0.06)`,
                  color: msg.from === 'user' ? '#0B0C0E' : C.white,
                  fontSize: 12,
                  fontFamily: fontUI,
                  fontWeight: msg.from === 'user' ? 500 : 400,
                  lineHeight: 1.55,
                  opacity: fade,
                  transform: `translateY(${slide}px)`,
                }}
              >
                {msg.text}
              </div>
            );
          })}

          {/* Animated prompt (streaming bot message) */}
          {allMessagesVisible && (
            <div
              style={{
                alignSelf: 'flex-start',
                maxWidth: '84%',
                padding: '10px 14px',
                borderRadius: '16px 16px 16px 4px',
                background: C.messageBot,
                border: `1px solid rgba(255,245,235,0.06)`,
                opacity: frame >= promptStart - 10 ? 1 : 0,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontFamily: fontUI,
                  fontWeight: 600,
                  color: C.amber,
                  marginBottom: 4,
                }}
              >
                Adding auth...
              </div>
              <div style={{fontSize: 12, fontFamily: fontUI, color: C.white, lineHeight: 1.55}}>
                {typedPrompt}
                {!promptDone && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 14,
                      backgroundColor: C.amber,
                      marginLeft: 2,
                      opacity: promptCursor ? 1 : 0,
                      verticalAlign: 'middle',
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat input bar */}
        <div
          style={{
            padding: '8px 12px 10px',
            borderTop: '1px solid rgba(255,245,235,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: frame >= inputStart ? interpolate(frame, [inputStart, inputStart + 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }) : 0,
          }}
        >
          {/* Text field */}
          <div
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,245,235,0.04)',
              borderRadius: 20,
              padding: '10px 16px',
              border: '1px solid rgba(255,245,235,0.06)',
            }}
          >
            <span style={{fontSize: 11, fontFamily: fontUI, color: C.dim}}>
              Type a message...
            </span>
          </div>
          {/* Send button */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: C.messageUser,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0B0C0E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
        </div>

        {/* Home bar */}
        <div
          style={{
            width: 120,
            height: 4,
            backgroundColor: 'rgba(255,245,235,0.10)',
            borderRadius: 4,
            margin: '0 auto 8px',
            flexShrink: 0,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

const dotStyle = (bg: string): React.CSSProperties => ({
  width: 13,
  height: 13,
  borderRadius: '50%',
  backgroundColor: bg,
});

const cursorStyle = (color: string, opacity: number): React.CSSProperties => ({
  display: 'inline-block',
  width: 10,
  height: 22,
  backgroundColor: color,
  marginLeft: 3,
  opacity,
});

export const PhoneLoop: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <PhoneScene globalFrame={frame} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Root Composition
// ═══════════════════════════════════════════════════════════════════════

export const SquidexTerminal: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {/* Scene 1: Terminal with CRT effect */}
      <Sequence name="terminal" from={0} durationInFrames={290}>
        <CrtWrapper width={width} height={height}>
          <TerminalScene globalFrame={frame} />
        </CrtWrapper>
      </Sequence>

      {/* Scene 2: Phone chat interface */}
      <Sequence name="phone" from={255} durationInFrames={255}>
        <PhoneScene globalFrame={frame} />
      </Sequence>
    </AbsoluteFill>
  );
};
