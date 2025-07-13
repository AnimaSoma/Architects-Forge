# Pull Request Instructions – ISRM-Foundation

These guidelines ensure smooth collaboration as we migrate **Architects-Forge** ➜ **ISRM-Foundation** and continue mobile/performance enhancements.

---

## 1  Create the Pull Request

1. Push your local work to the fork/remote **isrm-foundation-migration**  
   ```bash
   git push -u origin isrm-foundation-migration
   ```
2. Open the repository on GitHub.  
   GitHub will suggest **“Compare & pull request”** for the recently pushed branch.  
   • _Base branch_: **main**  
   • _Compare branch_: **isrm-foundation-migration**

> Prefer the UI? Go to **Pull requests ➜ New pull request ➜ compare across forks/branches** and pick `isrm-foundation-migration`.

---

## 2  Populate the PR Description

Copy-paste then fill the template below.

| Section | What to include |
|---------|-----------------|
| **Overview** | One-paragraph summary of the goal (e.g. “Complete re-branding and mobile optimisation of the front-end”). |
| **Key Changes** | Bullet list of major edits (files, features). Use the table from section 4 as a starting point. |
| **Implementation Notes** | Anything reviewers should know (design decisions, trade-offs, outstanding TODOs). |
| **Screenshots / GIFs** | • Hero on desktop & mobile <br>• Simulation demos <br>• Any UI regressions fixed |
| **Checklist** | - [ ] Code builds locally (`npm run dev`) <br>- [ ] ESLint passes <br>- [ ] Mobile break-points tested <br>- [ ] Added/updated docs |

---

## 3  Request a Review

1. In the PR sidebar:
   * **Reviewers** → add **@AnimaSoma** and at least **1 other core contributor**.
   * **Assignees** → yourself.
   * **Labels** → `migration`, `frontend`, plus any relevant (e.g. `performance`, `docs`).

2. Write a short comment pinging reviewers if the PR is time-sensitive.

---

## 4  Changes Contained in `isrm-foundation-migration`

| Area | Description |
|------|-------------|
| **Re-branding** | • Project renamed to **ISRM-Foundation** <br>• Component `ArchitectsForgeLanding.jsx` ➜ `ISRMFoundationLanding.jsx` <br>• Text copy, meta tags, favicon, README updated |
| **Mobile-first UX** | • Added touch support to all simulations and custom UI controls <br>• Responsive layouts via Tailwind break-points <br>• Custom cursor disabled on `pointer:coarse` devices |
| **Performance Scaling** | • Particle counts & visual detail adapt to device FPS/size <br>• Automatic “low-power mode” under 40 FPS |
| **Smooth Scroll/Animations** | Integrated **Lenis** inertia scroll; refactored Framer-Motion timelines |
| **Docs** | New `README.md` and this **PULL_REQUEST_INSTRUCTIONS.md** |

---

## 5  Deployment After Approval

1. **Squash & Merge** the PR into `main` (ensure the commit title reflects the feature set).
2. **Vercel** will auto-build the `main` branch:  
   • Monitor the build in the PR “Checks” tab or on the Vercel dashboard.  
   • If the Vercel preview passes, production will promote automatically.
3. Manual test in production (`https://isrm-foundation.org`) on:
   * Desktop browser (Chrome / Firefox / Safari)
   * iOS Safari
   * Android Chrome
4. If issues arise:
   * Re-open the PR or create a hot-fix branch off `main`.
   * Repeat the process above.

Happy shipping! 🚀
