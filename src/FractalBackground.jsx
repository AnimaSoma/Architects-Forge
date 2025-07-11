import React, { useEffect, useRef } from 'react';

export default function FractalBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    if (!gl) { console.warn('WebGL unavailable'); return; }

    /* ---------- resize ---------- */
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();  window.addEventListener('resize', resize);

    /* ---------- shaders ---------- */
    const vert = `
      attribute vec2 p;
      void main(){ gl_Position=vec4(p,0.,1.); }`;
    const frag = `
      precision mediump float;
      uniform vec2  r;        // resolution
      uniform float t;        // time
      #define I 80
      void main(){
        vec2 uv = (gl_FragCoord.xy/r)-.5;
        uv.x*=r.x/r.y;  uv*=2.3;
        vec2 c=uv, z=vec2(0.);
        float i;
        for(i=0.; i<I; i++){
          z = vec2(z.x*z.x - z.y*z.y, 2.*z.x*z.y)+c;
          if(dot(z,z)>4.) break;
        }
        float n=i/float(I);
        vec3 col=vec3(pow(n,0.15),pow(n,0.4),pow(n,0.9))* (0.7+0.3*sin(t*.2));
        gl_FragColor=vec4(col, n);   // alpha==n gives natural fade
      }`;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);  gl.useProgram(prog);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const rLoc = gl.getUniformLocation(prog, 'r');
    const tLoc = gl.getUniformLocation(prog, 't');

    let t = 0;
    const loop = () => {
      t += 0.016;
      gl.uniform2f(rLoc, canvas.width, canvas.height);
      gl.uniform1f(tLoc, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(loop);
    };
    loop();

    return () => window.removeEventListener('resize', resize);
  }, []);

  /* z-index: -1 keeps it below content but ABOVE <body> background */
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1, opacity: 0.8 }}
    />
  );
}