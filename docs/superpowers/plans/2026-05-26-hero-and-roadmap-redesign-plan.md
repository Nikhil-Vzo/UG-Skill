# Hero and Roadmap Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the landing page hero section, fix double rendering on mobile, resolve speech bubble overlaps in the skill path, and improve tactile styling across the timeline and cards.

**Architecture:** 
1. Modify button classes in React and add comprehensive 3D press styles in CSS to ensure the Hero buttons are fully tactile and use the Outfit font.
2. Isolate the mobile Hero section by rendering the static `hero-mobile.webp` mascot instead of the interactive card, leaving the interactive card only in the showcase section below.
3. Align speech bubbles inward and toggle visibility so that mascot bubbles are hidden unless hovered or active, preventing overlapping.
4. Improve card typography, hover states, and proctored checklist badges.

**Tech Stack:** React, CSS, Lucide icons, Framer Motion

---

### Task 1: Hero Button Tactile Styling

**Files:**
- Modify: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/LandingPage.tsx:350-365`
- Modify: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/landing.css:433-455`

- [ ] **Step 1: Add tactile classes to the Hero Link CTAs in React**
  Open `LandingPage.tsx` and change the Hero actions block to:
  ```tsx
                <motion.div
                  className="hero-actions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  {isAuthenticated ? (
                    <Link to={getDashboardRoute()} className="btn-3d btn-3d-green hero-cta-main">
                      <span>Go to Dashboard</span>
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup" className="btn-3d btn-3d-green hero-cta-main">
                        <span>Start Learning Free</span>
                        <ArrowRight size={18} />
                      </Link>
                      <Link to="/login" className="btn-3d btn-3d-secondary hero-cta-secondary">
                        Sign In
                      </Link>
                    </>
                  )}
                </motion.div>
  ```

- [ ] **Step 2: Add 3D active pressing and Outfit font to Hero CTA classes in CSS**
  Open `landing.css` and rewrite the `.hero-actions` styling block to ensure it transitions correctly when clicked:
  ```css
  .hero-actions {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 1.5rem;
    margin-top: 2.5rem;
    margin-bottom: 2rem;
  }

  .hero-actions .hero-cta-main,
  .hero-actions .hero-cta-secondary {
    padding: 1.1rem 2.5rem !important;
    margin: 0 !important;
    font-size: 1.05rem !important;
    font-weight: 800;
    border-radius: 18px !important;
    min-height: 56px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Outfit', sans-serif !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .hero-actions .hero-cta-main:active,
  .hero-actions .hero-cta-secondary:active {
    transform: translateY(4px) !important;
    border-bottom-width: 0px !important;
  }
  ```

- [ ] **Step 3: Verify the tactile buttons locally**
  Run local validation or check console logs to make sure there are no syntax errors.
  Commit changes:
  ```bash
  git add ugskill-web/src/pages/LandingPage.tsx ugskill-web/src/pages/landing.css
  git commit -m "style: make hero buttons fully tactile with 3D press effects"
  ```

---

### Task 2: Mobile Hero Mascot & Double-Render Fix

**Files:**
- Modify: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/LandingPage.tsx:368-375`
- Modify: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/landing.css:1514-1527` (mobile media queries)
- Create CSS classes in: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/landing.css`

- [ ] **Step 1: Replace interactive card with static image on mobile in React**
  Open `LandingPage.tsx` and change `hero-3d-side` render block to:
  ```tsx
              <div className="hero-3d-side">
                {isMobile ? (
                  <div className="hero-mobile-visual-wrap">
                    <img 
                      src="/images/hero-mobile.webp" 
                      alt="UG Bot Mascot" 
                      className="hero-mobile-image" 
                    />
                  </div>
                ) : (
                  <div className="hero-visual-shell">
  ```

- [ ] **Step 2: Add CSS rules for mobile visual layout**
  Open `landing.css` and append these classes:
  ```css
  /* Mobile Hero Illustration styles */
  .hero-mobile-visual-wrap {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--duo-green-subtle, #f1fcf0);
    border: 3px solid var(--duo-border, #e5e5e5);
    border-bottom: 8px solid var(--duo-border, #e5e5e5);
    border-radius: 24px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.03);
  }

  .hero-mobile-image {
    width: 100%;
    height: auto;
    border-radius: 16px;
    display: block;
  }
  ```

- [ ] **Step 3: Adjust mobile media query overrides for buttons**
  Ensure the mobile layout button overrides target `.hero-cta-main` and `.hero-cta-secondary` properly.
  Commit changes:
  ```bash
  git add ugskill-web/src/pages/LandingPage.tsx ugskill-web/src/pages/landing.css
  git commit -m "fix: resolve mobile double render by showing static mascot on mobile hero"
  ```

---

### Task 3: Skill Path Timeline Overlaps & Node Pulse

**Files:**
- Modify: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/LandingPage.tsx:182-205`
- Modify: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/landing.css:664-742`, `820-829`
- Create CSS classes in: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/landing.css`

- [ ] **Step 1: Re-align timeline steps to point bubbles inward**
  Open `LandingPage.tsx` and adjust the `align` properties of Unit 2 and Unit 3 in the `steps` array:
  ```tsx
      {
        title: 'Proctored Assessments',
        badge: 'UNIT 2',
        mascotText: 'Next up: validation. Compete on our real-time AI Leaderboard under secure, anti-cheat proctoring!',
        color: '#ff4b4b',
        darkColor: '#ea2b2b',
        sectionId: 'unit-2-assessments',
        align: 'left', // Point bubble left towards center
        cx: '425px',
        cy: '250px',
        icon: <ShieldCheck size={24} />
      },
      {
        title: 'Live Group Discussions',
        badge: 'UNIT 3',
        mascotText: 'Now, let\'s collaborate! Participate in live, platform-native GDs with peers and boost your confidence.',
        color: '#ce82ff',
        darkColor: '#aa60eb',
        sectionId: 'unit-3-community',
        align: 'right', // Point bubble right towards center
        cx: '300px',
        cy: '410px',
        icon: <Users size={24} />
      },
  ```

- [ ] **Step 2: Hide speech bubbles by default and show on active or hover**
  Open `landing.css` and edit the styling of `.roadmap-mascot-bubble-wrap`:
  ```css
  .roadmap-mascot-bubble-wrap {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 240px;
    top: 50%;
    transform: translateY(-50%) scale(0.95);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Show speech bubble when active or when parent step node is hovered */
  .roadmap-step-item.active .roadmap-mascot-bubble-wrap,
  .roadmap-step-item:hover .roadmap-mascot-bubble-wrap {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(-50%) scale(1);
  }
  ```

- [ ] **Step 3: Add pulsing glow animation for the active step node**
  Open `landing.css` and define the pulse keyframes and class:
  ```css
  .roadmap-step-item.active .roadmap-node-btn {
    transform: scale(1.1);
    box-shadow: 0 0 0 6px rgba(88, 204, 2, 0.3), 0 10px 24px rgba(0, 0, 0, 0.1);
    animation: active-node-pulse 2s infinite ease-in-out;
  }

  @keyframes active-node-pulse {
    0%, 100% {
      box-shadow: 0 0 0 4px rgba(88, 204, 2, 0.3), 0 8px 20px rgba(0, 0, 0, 0.08);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(88, 204, 2, 0.5), 0 12px 28px rgba(0, 0, 0, 0.15);
    }
  }
  ```

- [ ] **Step 4: Commit timeline redesign changes**
  Commit the files:
  ```bash
  git add ugskill-web/src/pages/LandingPage.tsx ugskill-web/src/pages/landing.css
  git commit -m "refactor: re-align timeline bubbles inward and hide inactive bubbles unless hovered"
  ```

---

### Task 4: Card Typography & Interactive Uplift

**Files:**
- Modify: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/landing.css:1119-1134`, `1203-1220`

- [ ] **Step 1: Make Unit sections hover tactile and add lift animation**
  Open `landing.css` and style the unit cards and list items:
  ```css
  .unit-section {
    max-width: 1100px;
    margin: 6rem auto;
    background: #ffffff;
    border-radius: 28px;
    padding: 3.5rem;
    position: relative;
    overflow: hidden;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.02);
  }

  .unit-section:hover {
    transform: translateY(-6px) scale(1.005);
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.05);
  }

  /* When pressed down (active state) */
  .unit-section:active {
    transform: translateY(2px) scale(0.998);
  }
  ```

- [ ] **Step 2: Style checklist circular badges**
  Improve the visual appearance of checkmarks in unit checklist items:
  ```css
  .unit-feature-list li {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    font-size: 1rem;
    color: var(--duo-text-dark, #3c3c3c);
    font-weight: 700;
    line-height: 1.5;
  }

  .feat-check {
    padding: 2px;
    border-radius: 50%;
    background-color: var(--duo-green-subtle, #f1fcf0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  }

  .unit-red .feat-check { background-color: var(--duo-red-subtle, #fff0f0); }
  .unit-purple .feat-check { background-color: var(--duo-purple-subtle, #f9f0ff); }
  .unit-orange .feat-check { background-color: var(--duo-orange-subtle, #fff8ee); }
  .unit-blue .feat-check { background-color: var(--duo-blue-subtle, #f0f9ff); }
  ```

- [ ] **Step 3: Commit card styling changes**
  Commit the updates:
  ```bash
  git add ugskill-web/src/pages/landing.css
  git commit -m "style: enhance card typography, list badges, and hover lift effects"
  ```

---

### Task 5: 3D Mascot Loading Placeholder and Height Constraints

**Files:**
- Modify: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/LandingPage.tsx:380-384`
- Modify: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/landing.css:456-470`
- Create CSS classes in: `c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/landing.css`

- [ ] **Step 1: Update Suspense fallback markup in React**
  Open `LandingPage.tsx` and change the `Suspense` block to:
  ```tsx
                    <Suspense fallback={
                      <div className="hero-3d-placeholder">
                        <div className="loading-spinner-duo"></div>
                        <span className="loading-text-duo">Summoning UG Bot...</span>
                      </div>
                    }>
                      <HeroScene />
                    </Suspense>
  ```

- [ ] **Step 2: Add placeholder spinner and absolute layout fixes in CSS**
  Open `landing.css` and set `hero-visual-shell` to absolute to stretch correctly, then style the loading skeleton:
  ```css
  .hero-visual-shell {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-3d-placeholder {
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background-color: var(--duo-blue-subtle, #f0f9ff);
    border: 3px dashed var(--duo-border, #e5e5e5);
    border-radius: 28px;
    animation: placeholder-pulse 2s infinite ease-in-out;
  }

  .loading-spinner-duo {
    width: 44px;
    height: 44px;
    border: 5px solid var(--duo-border, #e5e5e5);
    border-top: 5px solid var(--duo-blue, #1cb0f6);
    border-radius: 50%;
    animation: duo-spin 1s linear infinite;
  }

  .loading-text-duo {
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--duo-blue, #1cb0f6);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  @keyframes placeholder-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.95; }
  }

  @keyframes duo-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  ```

- [ ] **Step 3: Verify build compiles and commit placeholder styles**
  Verify the build using `npm run build` or running `tsc` to make sure there are no errors in LandingPage.tsx.
  Commit:
  ```bash
  git add ugskill-web/src/pages/LandingPage.tsx ugskill-web/src/pages/landing.css
  git commit -m "style: add loading spinner skeleton fallback for 3D mascot"
  ```
