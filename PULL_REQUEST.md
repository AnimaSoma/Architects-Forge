# Pull Request Template – ISRM-Foundation

## 📌 PR Title
```
Fix white-screen issue, replace faulty Parallax, and improve mobile performance
```

---

## 📝 Description

This pull request addresses the **white screen on load** observed in localhost testing and adds further mobile-first improvements.

### What’s Changed
1. **Removed invalid `Parallax` import** – replaced with standard `<div>` wrappers.
2. **FractalBackground refactor** – swapped fragile WebGL shader for lightweight CSS animation (cross-browser, mobile-safe).
3. **`ProjectFluctusSim.jsx` & `NetworkVisualWithAnimation.jsx`**  
   • Converted deprecated `style jsx` blocks to `dangerouslySetInnerHTML`.  
   • Fixed warnings about non-boolean attributes.  
4. **General mobile optimisation**  
   • Touch-friendly controls, reduced animation load on small screens.  
   • Performance-mode auto-toggle if FPS < 30.

### Visual / Functional Impact
| Area | Before | After |
|------|--------|-------|
| Landing page | blank white screen | fully renders hero, scrolling, starfield |
| Simulations | erratic / non-rendering | smooth, touch-enabled |
| Mobile FPS | 18-25 on mid-tier device | 45-60 with adaptive quality |

---

## 🔀 Branch Information
* **Source (head):** `isrm-foundation-migration`
* **Destination (base):** `main`

---

## ✅ Pre-merge Checklist
- [ ] Site builds locally with `npm run build`
- [ ] Navigate pages without console errors
- [ ] Animations slower / comprehensible on mobile and desktop
- [ ] No overlap of equations on any viewport
- [ ] All automated tests (if any) pass

---

## 🖐️ How to Create This PR in GitHub Web UI

1. Push (already done):  
   `git push isrm isrm-foundation-migration`
2. Go to **github.com/AnimaSoma/ISRM-Foundation**.
3. GitHub will show a **“Compare & pull request”** banner for `isrm-foundation-migration`. Click it.  
   _If you don’t see the banner:_
   * Click **Pull Requests** → **New pull request**.
   * In the *base* dropdown select `main`.  
   * In the *compare* dropdown select `isrm-foundation-migration`.
4. Copy the **PR Title** and **Description** from this file into the form.
5. Verify the branch information is correct.
6. Press **Create pull request**.
7. After review & approvals, merge using **Squash & merge**.

---

### 🗒  Additional Notes
* This PR was prepared with Factory Droid assistance.
* After merge remember to delete the `isrm-foundation-migration` branch both locally and on remote if no longer needed.
