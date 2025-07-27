import { extend } from '@react-three/fiber';
import * as THREE from 'three';

class BlobMaterialImpl extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uMemPositions: { value: new Array(10).fill(new THREE.Vector3()) },
        uMemIntensities: { value: new Float32Array(10) },
        uEnergy: { value: 1 },
        uUtility: { value: 0.6 },
        uDeltaS: { value: 0 },   // local prediction error (0‒1)
        uDeltaC: { value: 0 },   // coherence loss
        uInertia:{ value: 0 },   // inertia / sluggishness
        /* thinking overlay (0 = off, 1 = on) */
        uThinking: { value: 0 },
        /* fractal mask texture supplied by parent runtime */
        uMask: { value: null }
      },
      // make bubble transparent & double-sided
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,

      vertexShader: /* glsl */`
        uniform float uTime;
        uniform float uDeltaC;
        uniform float uInertia;
        /* additional ISRM scalars used below */
        uniform float uUtility;
        uniform float uDeltaS;
        uniform float uEnergy;
        uniform float uThinking;
        uniform vec3 uMemPositions[10];
        uniform float uMemIntensities[10];
        varying vec2 vUv;
        varying float vViewDot;
        varying vec3 vNormal;
        varying float vRipple;
        // 3D perlin noise by iq
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);} 
        float snoise(vec3 v){
          const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
          vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
          vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
          vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0- D.yyy;
          i = mod(i,289.0 );
          vec4 p = permute( permute( permute( i.z + vec4(0.0,i1.z,i2.z,1.0 ))
                  + i.y + vec4(0.0,i1.y,i2.y,1.0 ))
                  + i.x + vec4(0.0,i1.x,i2.x,1.0 ));
          float n_ = 1.0/7.0;vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
          vec4 x_ = floor(j * ns.z);vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.y;vec4 y = y_ *ns.x + ns.y;vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0+1.0;vec4 s1 = floor(b1)*2.0+1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = 1.79284291400159 - 0.85373472095314 * 
            vec4( dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3) );
          p0 *= norm.x;p1 *= norm.y;p2 *= norm.z;p3 *= norm.w;
          vec4 m = max(0.6 - vec4( dot(x0,x0), dot(x1,x1), 
            dot(x2,x2), dot(x3,x3) ), 0.0);
          m = m * m;return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
            dot(p2,x2), dot(p3,x3) ) );}
        void main() {
          vec3 p = position;
          // base FBM wobble
          float n = snoise(p*2.0+uTime*0.3);
          /* gentler breathing at rest — amps up with utility */
          /* Reduce baseline wobble; full range now 0.02 – 0.17 */
          float wobbleAmp = 0.02 + uUtility * 0.15;   // calmer at rest
          p += normal * n * wobbleAmp;
          // avoidance ripple (from scars)
          float ripple=0.0;
          for(int i=0;i<10;i++){
            ripple += uMemIntensities[i] / (1.0 + distance(p, uMemPositions[i])*20.0);
          }
          /* ---------------------------------------------------------
             ISRM-driven deformation
           --------------------------------------------------------- */
          // urgency heartbeat – amplitude will be adjusted below, so we
          // omit the full-strength version to avoid duplicate definitions
          // lattice-style jagged term – intersecting waves on X and Y
          float jagged      = (sin(30.0 * p.y + uTime*4.0) * sin(30.0 * p.x + uTime*4.0)) * uDeltaS;
          float twist       = sin(p.y * 10.0 + uTime) * uDeltaC * 0.5;         // asym twist from ΔC
          float inertiaDamp = 1.0 / (1.0 + uInertia);                          // sluggishness
          /* reduce resting pulse amplitude to make idle state calmer */
          float pulse       = sin(uTime*2.0) * uUtility * 0.5;                 // 50 % weaker

          float deform      = (pulse + jagged + twist) * inertiaDamp
                              + ripple*0.25;                                   // still include scars

          p += normal * deform;
          // view-angle iridescence term
          vec3 worldN = normalize(mat3(modelMatrix) * normal);
          vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(p,1.0)).xyz);
          vViewDot = dot(worldN, viewDir);      // -1 → 1

          vRipple = ripple;
          vNormal = normal;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
        }`,
      fragmentShader: /* glsl */`
        varying float vRipple;
        varying float vViewDot;
        varying vec2 vUv;
        uniform float uUtility;
        uniform float uEnergy;
        uniform float uDeltaS;
        uniform float uThinking;
        uniform sampler2D uMask;
        uniform float uTime;
        void main(){
          // hueShift ties colour cycle to ISRM state
          float hueShift = uUtility*0.4 + (1.0 - uEnergy)*0.4 + uDeltaS*0.5;

          // psychedelic rainbow palette cycling with time, ripple and ISRM shift
          vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0,0.33,0.66) + hueShift + uTime*0.4 + vRipple*2.0));

          // iridescent complement shifts with view angle
          vec3 complement = 0.5 + 0.5 * cos(6.28318 * (vec3(0.66,0.33,0.0) + hueShift + uTime*0.4 + vRipple*2.0));

          // start with rainbow, blend complement by angle
          vec3 base = mix(rainbow, complement, 0.5 + 0.5 * vViewDot);

          // when utility is high blend toward white highlight
          base = mix(base, vec3(1.0), clamp(uUtility*0.8, 0.0, 1.0));

          // Modulate brightness with utility / energy
          float brightness = (0.5 + uUtility*0.5) * (0.3 + uEnergy*0.7);
          base *= brightness;

          // bubble transparency
          float alpha = 0.25 + 0.45 * brightness;

          // -------------------------------------------------
          // Thinking overlay — multiply alpha by fractal mask
          // -------------------------------------------------
          float mask = texture2D(uMask, vUv * 4.0).r;   // tile 4×
          alpha *= mix(1.0, mask, clamp(uThinking, 0.0, 1.0));

          gl_FragColor = vec4(base, alpha);
        }`
    });
  }

  set memPositions(v: THREE.Vector3[]) {
    this.uniforms.uMemPositions.value = v;
  }
  set memIntensities(arr: Float32Array) {
    this.uniforms.uMemIntensities.value = arr;
  }
  set time(t: number) { this.uniforms.uTime.value = t; }
  set energy(e:number){this.uniforms.uEnergy.value=e;}
  set utility(u:number){this.uniforms.uUtility.value=u;}
  set deltaS(s:number){this.uniforms.uDeltaS.value=s;}
  set deltaC(c:number){this.uniforms.uDeltaC.value=c;}
  set inertia(i:number){this.uniforms.uInertia.value=i;}
  // thinking state (0‒1)
  set thinking(t:number){this.uniforms.uThinking.value=t;}
}

extend({ BlobMaterialImpl });

export { BlobMaterialImpl as BlobMaterial };
