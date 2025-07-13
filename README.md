# ISRM-Foundation Front-End

Interactive visualisation platform for the **Interactionist Self-Regulation Model (ISRM)** – a coherence-driven framework that unifies adaptation from atoms to AI.  
This repository contains the complete **React** front-end that powers [isrm-foundation.org](https://isrm-foundation.org) (work-in-progress).

---

## ✨ Project Highlights
* Immersive landing page with parallax star-field, video hero and smooth-scroll effects  
* Real-time physics simulations showcasing ISRM principles:
  * **ProjectFluctusSim** – coherence-driven particle field with temperature slider
  * **NetworkVisualWithAnimation** – distributed observer systems reaching consensus
  * **USP Inline Simulator** – interactive update-signal equation with live graphs
* Math rendering via **KaTeX** and dynamic LaTeX tooltips
* Error boundaries around all heavy components for graceful degradation
* Custom cursor on desktop, automatically disabled on touch devices

---

## 🛠️ Tech Stack

| Layer | Library | Purpose |
|-------|---------|---------|
| Framework | **React 18** | UI & component logic |
| Build-tool | **Vite 5** | Lightning-fast dev server & bundler |
| Styling | **Tailwind CSS 3** | Utility-first responsive design |
| Animation | **Framer-Motion 11** | Declarative motion & scroll-based effects |
| Smooth-scroll | **Lenis** | GPU-accelerated inertia scrolling |
| Visuals | **p5.js** | Canvas simulations (particle & star field) |
| Math | **KaTeX / react-katex** | Fast LaTeX typesetting |

---

## 🚀 Getting Started

```bash
# 1. Clone
git clone https://github.com/AnimaSoma/ISRM-Foundation.git
cd ISRM-Foundation

# 2. Install dependencies
npm install      # or pnpm install / yarn

# 3. Run dev server
npm run dev      # Vite will start on http://localhost:5173

# 4. Build for production
npm run build    # outputs to /dist
npm run preview  # locally preview the production build
```

Node ≥ 18 is required (see `package.json` engines).

---

## 📂 Project Structure (src)

```
├── ISRMFoundationLanding.jsx   # Main page component
├── ProjectFluctusSim.jsx       # Particle coherence simulation
├── NetworkVisualWithAnimation.jsx
├── CustomCursor.jsx            # Desktop-only cursor
├── index.jsx / index.css       # App entry & global styles
└── ...                         # Additional visual / helper modules
```

---

## 📱 Mobile Optimisations

The original Architects-Forge prototype was refactored to be **fully mobile-friendly**:

1. **Touch support everywhere**  
   • Added `pointerdown` / `touchmove` handlers to interactive canvases.  
   • Custom cursor auto-disables on touch devices.

2. **Responsive layout**  
   • Tailwind breakpoints (`sm`→`xl`) across grids, typography and spacing.  
   • Fluid SVG dividers scale without overflow.

3. **Dynamic performance scaling**  
   • Particle count & render detail adapt to frame-rate and screen size.  
   • Simulations enter low-power mode below 40 FPS.

4. **Viewport and PWA meta**  
   • `<meta name="viewport" content="width=device-width,initial-scale=1">`  
   • Added icons and theme-color for iOS/Android install.

5. **Reduced motion fallback**  
   • Checks `prefers-reduced-motion`; heavy parallax disabled if user prefers.

Together these changes deliver smooth 60 FPS interactions on most modern phones while preserving the rich desktop experience.

---

## 🙌 Contributing

Pull requests are welcome!  
If you have ideas for new ISRM visualisations or performance tweaks, open an issue or PR on the `isrm-foundation-migration` branch.

---

## 📜 License

MIT © 2025 – John Paul Schell & ISRM-Foundation
