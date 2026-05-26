# Design Specification: Landing Page Hero & Roadmap Redesign

This document outlines the design and structural specifications to solve layout overlaps in the Career Roadmap (Skill Path), fix the Hero section button styling, and resolve the double-rendering of the Interactive Lesson Card on mobile.

## Goal

Create a highly polished, interactive, and visually stunning landing page for UGSkill matching a Duolingo theme. Specifically:
1. **Tactile Hero Buttons**: Add Outfit typography, uppercase letter spacing, and active 3D press transitions to the Hero CTA buttons.
2. **Mobile Double-Render Fix**: Display the gorgeous `hero-mobile.webp` mascot asset in the mobile Hero section and display the `InteractiveLessonCard` only once in the interactive preview section.
3. **Skill Path Timeline Cleanup**: Prevent absolute nodes and dialogue bubbles from overlapping by hiding inactive unit bubbles by default (revealing them on hover or when active), adding a pulsing active indicator, and aligning speech bubbles inward.
4. **Premium Card Accents**: Enhance the typography, borders, and hover micro-animations of the roadmap unit cards.

## Proposed Changes

### Component 1: Hero Section

*   **Hero CTA Buttons**:
    *   Change class markup in `LandingPage.tsx` to include `btn-3d`, `btn-3d-green` for main CTA and `btn-3d-secondary` for sign-in CTA.
    *   Ensure they use the uppercase, Outfit font style with proper letter-spacing and standard 3D border-bottom offsets.
*   **Mobile Mascot**:
    *   Replace `<InteractiveLessonCard />` in the mobile Hero section (`isMobile ? ...`) with a styled container displaying `/images/hero-mobile.webp`.
    *   Add responsive CSS rules for `.hero-mobile-visual-wrap` and `.hero-mobile-image` to ensure it is centered and scales beautifully on mobile viewports.
*   **3D Mascot Placeholder**:
    *   Implement the `.hero-3d-placeholder` skeleton screen containing a styled loader and text "Summoning UG Bot..." so that the loading phase of the 5.5MB `robo-opt.glb` 3D model looks premium.

### Component 2: Skill Path (Roadmap Timeline)

*   **Coordinates & Alignments**:
    *   Modify the `steps` array in `LandingPage.tsx` to alternate directions and prevent horizontal boundary overflow:
        *   **Unit 1**: cx: `300px`, cy: `90px`, align: `'left'`
        *   **Unit 2**: cx: `425px`, cy: `250px`, align: `'left'` (points inward from right node)
        *   **Unit 3**: cx: `300px`, cy: `410px`, align: `'right'` (points right from center node)
        *   **Unit 4**: cx: `175px`, cy: `570px`, align: `'right'` (points inward from left node)
        *   **Unit 5**: cx: `300px`, cy: `730px`, align: `'left'`
*   **Interactive Speech Bubbles**:
    *   Set `.roadmap-mascot-bubble-wrap` to be hidden by default (`opacity: 0`, `pointer-events: none`, `transform: translateY(-50%) scale(0.95)`).
    *   Enable display when the node is active or hovered (`.active` or `:hover` classes on `.roadmap-step-item`).
    *   Use `transition` for smooth fade-in and scale-up effect.
*   **Active Node Pulse**:
    *   Apply a custom CSS keyframe animation `.active-pulse` around the active step node to draw attention to it.

### Component 3: Showcase & Unit Cards

*   **Showcase Section**:
    *   Retain `<InteractiveLessonCard />` inside the PC Showcase section. It will serve as the single, fully interactive quiz preview on both mobile and desktop.
*   **Unit Cards (Story Chapters)**:
    *   Improve margins, typography, and line-heights.
    *   Add hover state scale uplift: `transform: translateY(-4px) scale(1.01)` with smooth transitions.
    *   Ensure checkmarks inside unit checklists use cohesive colored circle badges for high contrast.

## Verification Plan

### Automated/Local Testing
1. Verify that the app builds successfully with `npm run build` or `tsc`.
2. Inspect responsive layouts on mobile, tablet, and desktop viewports using browser developer tools.
3. Validate button click states to confirm tactile click transition.

### Manual Verification
1. Click through the roadmap steps to confirm the active bubble updates, the path stroke updates, and page scrolls smoothly.
2. Hover over non-active nodes to verify that their mascot bubbles appear smoothly and fade away when unhovered.
