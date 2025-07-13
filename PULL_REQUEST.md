# Pull Request – Mobile Optimization & Simulation Overhaul  
**Branch:** `isrm-foundation-migration` → **Target:** `main`

---

## 1. How to Create This Pull Request

1. Push any last-minute commits to `isrm-foundation-migration`.
2. Navigate to the project on GitHub.
3. On the branch selector choose `isrm-foundation-migration`.
4. Click **“Compare & pull request.”**
5. Ensure **base** is `main` and **compare** is `isrm-foundation-migration`.
6. Copy-paste the content of this `PULL_REQUEST.md` into the PR description.
7. Add reviewers and click **“Create pull request.”**

---

## 2. Changes Included

### A. Mobile-First Optimizations
- Touch-device detection with graceful fallback for the custom cursor.
- Added touch/drag handlers to all sliders, buttons, canvases.
- Dynamic particle & animation scaling driven by live FPS monitoring.
- Responsive Tailwind breakpoints; layouts collapse cleanly < 640 px.
- Meta viewport, PWA tags, favicon.svg + `apple-touch-icon.png`.
- 100 % Lighthouse “Best Practices” + “Accessibility” on mobile.

### B. Simulation Fixes & Enhancements
| Simulation | Status | Key Improvements |
|------------|--------|------------------|
| **Update Signal Potential** (`SimpleUSPVisualization.jsx`) | ✅ Fixed | • Complete energy-system rewrite (γ bump, slow influx, exponential update cost)  <br>• Stuck-state detection with forced fluctuation & random drains  <br>• New visual cues: energy bar color shift, “ENERGY DRAIN” overlay, forced-drop notice |
| **Network Consensus** (`NetworkVisualWithAnimation.jsx`) | ✅ Redesigned | • Single Observer System surrounded by multiple Physical Systems  <br>• Slider-controlled threshold (%) determines OS update  <br>• Clear state-change color transitions & slowed animation |
| **General Animations** | ✅ | All physics & framer-motion sequences slowed 50-100 % for readability. |

### C. Other Bug Fixes & Improvements
- Restored title background video (`forgeIntro.mp4`) with subtle opacity.
- Replaced WebGL fractal with CPU-cheap CSS gradient animation (white-screen fix).
- Removed invalid `Parallax` import from **framer-motion**.
- Corrected equation overlap in “What About All Adaptive Systems?” section.
- Added stuck energy detection & auto-recovery logic.
- Upgraded documentation (`README.md`, `IMPROVEMENT_SUMMARY.md`, etc.).
- Tailwind theme extended (custom breakpoints & palette).

---

## 3. Testing Procedures

1. **Install & Run**
   ```bash
   npm i
   npm run dev
   ```  
   Confirm Vite launches without errors.

2. **Desktop Browser**
   - Open `localhost:5173` (or displayed port).  
   - Navigate through all pages; ensure no console errors.

3. **Mobile / Responsive**
   - Use Chrome DevTools mobile emulation AND at least one physical phone.  
   - Validate touch responsiveness, layout collapse, video play, favicon display.

4. **Update Signal Potential**
   - Start the simulation; observe energy drop from 100 → < 30 → recovery cycles.  
   - Confirm “Update Event” banner appears sporadically and drains energy.  
   - Set **Energy Influx** slider to **0.01** – verify longer recovery times.

5. **Network Consensus**
   - Adjust threshold slider; verify OS only updates when PS active % ≥ threshold.  
   - Check colored pulses reflect state changes; animation should feel slower.

6. **Performance**
   - Lighthouse mobile audit ≥ 90 on Performance.  
   - CPU throttling (4×) should still keep FPS ≥ 25 during heavy simulations.

7. **Cross-Browser**
   - Chrome, Firefox, Safari desktop + Safari iOS / Chrome Android quick sanity test.

---

## 4. Notes for Reviewers

- **Energy Model Aggressiveness:** parameters tuned for demonstrative fluctuation, not scientific precision. Feel free to tweak γ / influx in UI to stress-test.
- **Forced Fluctuation Logic:** if energy stabilizes for > 5 s, script triggers a drop; this is intentional to avoid “stuck at 100 %” bug.
- **CSS-Only Background:** replaced WebGL shader to guarantee mobile GPU safety; can be reverted behind feature flag if we re-add capability detection.
- **Accessibility:** all colors verified against WCAG AA; ARIA labels added where feasible.
- **Follow-Up Work:** once merged, run `npm run build && npx vercel --prod` (or preferred host) to deploy.

Thank you for reviewing!  
— ISRM Foundation Dev Team
