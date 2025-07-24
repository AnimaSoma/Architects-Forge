"use client";
import dynamic from 'next/dynamic';
import type { SketchProps } from 'react-p5';
import p5Types from 'p5';
import { useMemo } from 'react';

interface Props {
  predictionError: number;
  coherenceTension: number;
  utility: number;
  energy: number;
}

const Sketch = dynamic(() => import('react-p5').then(mod => mod.default), { ssr: false });

export default function AuraBlob(props: Props) {
  const config = useMemo(() => props, [props.predictionError, props.coherenceTension, props.utility, props.energy]);

  const setup: SketchProps['setup'] = (p5, canvasParentRef) => {
    p5.createCanvas(220, 220).parent(canvasParentRef);
    p5.colorMode(p5.HSB, 100);
    p5.frameRate(30);
  };

  const draw: SketchProps['draw'] = (p5: p5Types) => {
    const { predictionError: dS, coherenceTension: dC, utility: U, energy: E } = config;

    // Clear with slight fade for motion trails at low energy
    p5.background(0, 0, 0, E < 0.3 ? 10 : 100);
    p5.translate(p5.width / 2, p5.height / 2);

    // Base parameters
    const baseRadius = 60;
    const distortionScale = 25 * dS + 15 * dC;
    const pts = 120;
    
    // Animation speed based on energy
    const speed = p5.map(E, 0, 1, 0.001, 0.01);
    
    // Main blob
    p5.noStroke();
    
    // Inner glow based on utility
    const hue = p5.map(U, 0, 1, 55, 65); // Shift from yellow-green to blue
    const sat = p5.map(U, 0, 1, 60, 90);
    const bright = p5.map(U, 0, 1, 60, 100);
    p5.fill(hue, sat, bright, 70);
    
    // Draw main blob
    p5.beginShape();
    for (let a = 0; a < p5.TWO_PI; a += p5.TWO_PI / pts) {
      const xoff = p5.map(p5.cos(a), -1, 1, 0, 2);
      const yoff = p5.map(p5.sin(a), -1, 1, 0, 2);
      
      // Multiple noise layers for complex deformation
      const n1 = p5.noise(xoff + p5.frameCount * speed, yoff);
      const n2 = p5.noise(xoff * 2 + p5.frameCount * speed * 1.5, yoff * 2);
      
      // Coherence tension creates secondary oscillations
      const tensionWave = dC > 0.5 ? p5.sin(a * 6 + p5.frameCount * 0.05) * 10 * dC : 0;
      
      // Final radius calculation with all factors
      const r = baseRadius + 
                n1 * distortionScale * (1 + dS) + 
                n2 * 10 * dC +
                tensionWave;
                
      // Apply energy dampening to movement
      const x = r * p5.cos(a) * (E * 0.5 + 0.5);
      const y = r * p5.sin(a) * (E * 0.5 + 0.5);
      
      p5.curveVertex(x, y);
    }
    p5.endShape(p5.CLOSE);

    // Outer glow based on utility
    if (U > 0.4) {
      const glowSize = p5.map(U, 0.4, 1, 5, 15);
      const glowOpacity = p5.map(U, 0.4, 1, 20, 70);
      
      p5.stroke(hue, sat * 0.8, bright, glowOpacity);
      p5.strokeWeight(glowSize);
      p5.noFill();
      p5.circle(0, 0, (baseRadius + distortionScale) * 1.8);
    }
    
    // Add fragmentation when coherence tension is high
    if (dC > 0.6) {
      const fragments = p5.floor(p5.map(dC, 0.6, 1, 3, 8));
      p5.fill(hue, sat * 0.7, bright * 0.8, 50);
      
      for (let i = 0; i < fragments; i++) {
        const angle = p5.random(p5.TWO_PI);
        const dist = p5.random(baseRadius * 0.8, baseRadius * 1.5);
        const size = p5.random(5, 15) * dC;
        
        p5.push();
        p5.translate(
          p5.cos(angle) * dist,
          p5.sin(angle) * dist
        );
        
        // Small blob fragments
        p5.beginShape();
        for (let a = 0; a < p5.TWO_PI; a += p5.TWO_PI / 8) {
          const r = size * (0.8 + p5.random(0.4));
          p5.vertex(r * p5.cos(a), r * p5.sin(a));
        }
        p5.endShape(p5.CLOSE);
        p5.pop();
      }
    }
    
    // High prediction error creates chaos bursts
    if (dS > 0.7) {
      const burstCount = p5.floor(p5.map(dS, 0.7, 1, 2, 6));
      
      for (let i = 0; i < burstCount; i++) {
        const angle = p5.random(p5.TWO_PI);
        const dist = baseRadius * 0.9;
        
        p5.push();
        p5.translate(
          p5.cos(angle) * dist,
          p5.sin(angle) * dist
        );
        
        p5.stroke(0, 0, 100, 70);
        p5.strokeWeight(1);
        
        // Jagged lines
        for (let j = 0; j < 5; j++) {
          const len = p5.random(10, 25) * dS;
          const a = p5.random(p5.TWO_PI);
          p5.line(0, 0, p5.cos(a) * len, p5.sin(a) * len);
        }
        
        p5.pop();
      }
    }
  };

  return (
    <div className="relative w-[220px] h-[220px]">
      <Sketch setup={setup} draw={draw} />
    </div>
  );
}
