/* eslint-disable @next/next/no-img-element */
"use client";
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import AuraShell from '../components/AuraShell';
import ConsciousBlob from '../components/ConsciousBlob';
import ISRMFormulation from '../components/ISRMFormulation';
import ISRMIntro from '../components/ISRMIntro';
import ObserverVsPhysical from '../components/ObserverVsPhysical';

export default function Home() {
  return (
    <>
      {/* site badge */}
      <div className="fixed top-4 right-4 text-right leading-tight select-none">
        <a
          href="https://architects-forge.org"
          target="_blank"
          rel="noreferrer"
          className="text-primary/70 text-sm hover:text-primary"
        >
          Architects-Forge.Org
        </a>
        <br />
        <span className="text-[10px] text-white/40">Schell, 2025</span>
      </div>
      
      {/* Aura chat + HUD overlay */}
      <AuraShell />

      {/* Conscious Blob section */}
      {/* 70 vh keeps the chat in view while still giving the blob presence */}
      <section className="h-[70vh] min-h-[500px] w-screen flex items-end justify-center">
        <Canvas>
          <Suspense fallback={null}>
            <ConsciousBlob />
          </Suspense>
        </Canvas>
      </section>

      {/* Hero / Intro */}
      <ISRMIntro />

      {/* ISRM Update Equation section */}
      <ISRMFormulation />

      {/* Observer vs Physical System explanation */}
      <ObserverVsPhysical />

      {/* Cosmos section stub – full-screen placeholder */}
      <section
        id="cosmos"
        className="h-screen w-screen flex items-center justify-center bg-[radial-gradient(circle,_#111_0%,_#000_100%)]"
      >
        <div className="text-center space-y-3">
          <a
            href="https://isrm-framework.org"
            target="_blank"
            rel="noreferrer"
            className="underline text-primary hover:text-white text-lg"
          >
            ISRM-Framework.org
          </a>
          <br />
          <a
            href="https://isrm-foundation.org"
            target="_blank"
            rel="noreferrer"
            className="underline text-primary hover:text-white text-lg"
          >
            ISRM-Foundation.org
          </a>
        </div>
      </section>
    </>
  );
}
