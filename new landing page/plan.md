# UGSkill Redesign Master Blueprint & Execution Plan

This document serves as the master specification, execution plan, and design system reference for the Next.js marketing site and SPA sandbox. It merges the tactile, venture-backed "Feather Green" visual physics with the specific section structures, asset recommendations, and animation timelines of the redesigned marketing site.

---

## 1. Tactile Visual Design System (Gamified Enterprise)

### Color Palette (The Feather Green System)
*   **Primary Action (Growth):** `Feather Green (#58CC02)`
    *   *Usage:* STRICTLY reserved for primary CTAs, active streaks, success indicators, and the Sandbox Demo button. Treated as a scarce resource to focus visitor attention.
*   **Base & Headings (Trust):** `Deep Slate (#0F172A)` — Primary text color for headings.
*   **Body Copy:** `Slate 500 (#64748B)` — Primary text color for paragraphs.
*   **Secondary Accent (Data/Metrics):** `Ocean Blue (#0EA5E9)` — Used for performance charts, radar charts, and tooltips.
*   **Surfaces:**
    *   `Pure White (#FFFFFF)` — Primary background for marketing sections.
    *   `Slate 50 (#F8FAFC)` — Offset backgrounds for alternate sections (e.g. Bento cards).
    *   `Slate 200 (#E2E8F0)` — Razor-thin borders (1px) for grids and cards.

### Button Physics & Micro-interactions
*   **Tactile Buttons (No Gradients):**
    *   *Default State:* CSS `border-bottom: 4px solid #46A302` for Feather Green buttons.
    *   *Active/Click State:* On `:active` (or click), translate the button down by `4px` (`transform: translateY(4px)`) and remove/reduce the border, simulating a satisfying physical push-down effect.
*   **Clean & Diffused Shadows:**
    *   No glowing neon halos. Cards use highly diffused, neutral shadows to float off the pure white background:
        `box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.05);`
*   **Borders:** Subtle, crisp 1px borders (`#E2E8F0`) to create a structured "bento" feel without heavy aesthetic layers.
*   **Typography:**
    *   *Headings:* Inter or Geist (Clean, heavy weights, tightly tracked with `-0.02em` spacing).
    *   *Body:* Inter (for readability at all sizes).

---

## 2. Asset & Motion Strategy

*   **3D Assets (React Three Fiber):**
    *   Style: "Claymorphism" or "Matte Premium". Soft studio lighting, ambient occlusion, no high-specular gloss.
    *   *Asset Prompt:* `3D render of a minimalist graduation cap and a briefcase, matte white texture, subtle green accent #58CC02, soft studio lighting, claymorphism, highly detailed, clean background, ui/ux asset --ar 16:9 --v 6.0`
*   **Custom Illustrations (SVG):**
    *   Abstract UI modules rather than vector human drawings. Show mockups of floating dashboard components in an isometric grid.
    *   *Mockup Prompt:* `High-fidelity SaaS dashboard UI mockup, light mode, white background, deep slate typography, vibrant green primary buttons, data visualization charts, modern, crisp borders, highly detailed --ar 16:9`
*   **Asset Sourcing Policy:**
    *   Whenever high-fidelity assets are needed, prompt the USER to generate them, or use fallback assets (`nano banana pro`).

---

## 3. Marketing Landing Page Section Order & Specifications

### Section 1: HeroSection
*   **Viewport:** Full viewport height (`h-screen`), flex column layout, `overflow-x: clip`.
*   **Navbar:** Floating horizontal nav bar, 4 links ("About", "Price", "Projects", "Contact") evenly spaced (`justify-between`). Text color `#D7E2EA` (or `Deep Slate` on light sections), font-medium, uppercase, tracking-wider. Sizes: text-sm md:text-lg lg:text-[1.4rem]. Padding: px-6 md:px-10 pt-6 md:pt-8. Hover transitions (opacity 70% in 200ms).
*   **Hero Heading:** Massive `h1` reading: "Hi, i'm jack" (representing a personalized introduction/user profile or customized for UGSkill). Font-black, uppercase, tracking-tight, leading-none, whitespace-nowrap. Text sizes: `text-[14vw]` to `text-[17.5vw]`. Margin: `mt-6` to `-mt-5`. Wrapped in an overflow-hidden wrapper.
*   **Hero Portrait/3D Asset:** Centered absolutely (`absolute left-1/2 -translate-x-1/2 z-10`). Uses a Magnet component (mouse-following magnetic hover effect) wrapping a high-quality matte asset (e.g. claymorphism model). Width: `w-[280px]` (mobile) to `w-[520px]` (desktop). Positioning: centered on mobile, bottom-docked on desktop (`sm:bottom-0 sm:translate-y-0`).
*   **Bottom Bar:** Flexbox container (`justify-between items-end pb-7 md:pb-10`):
    *   *Left:* Text: "a 3d creator driven by crafting striking and unforgettable projects" (or tailored to UGSkill: "a campus-recruitment network bridging the gap between learning and outcomes"), Slate 500, uppercase, tracking-wide. Max width: `160px` to `260px`.
    *   *Right:* Tactile `ContactButton` / `SandboxButton`.
*   **Animations (FadeIn):**
    *   Navbar: Delay 0s, y -20px.
    *   Heading: Delay 0.15s, y 40px.
    *   Left Text: Delay 0.35s, y 20px.
    *   Contact Button: Delay 0.5s, y 20px.
    *   Portrait Asset: Delay 0.6s, y 30px.

### Section 2: MarqueeSection
*   **Background:** Dark background `#0C0C0C`. Padding: `pt-24 md:pt-40 pb-10`.
*   **Interaction:** Two rows of horizontal tiles that scroll based on scroll position (`translateX` offset calculated as `(window.scrollY - sectionTop + window.innerHeight) * 0.3`).
    *   *Row 1:* First 11 image/gif cards (scrolls RIGHT).
    *   *Row 2:* Remaining 10 image/gif cards (scrolls LEFT).
*   **Tile Styling:** 420px x 270px, rounded-2xl, object-cover, lazy-loaded. Gap-3 between rows and tiles.
*   **GIF Assets:**
    1. https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif
    2. https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif
    3. https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif
    4. https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif
    5. https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif
    6. https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif
    7. https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif
    8. https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif
    9. https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif
    10. https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif
    11. https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif
    12. https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif
    13. https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif
    14. https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif
    15. https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif
    16. https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif
    17. https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif
    18. https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif
    19. https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif
    20. https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif
    21. https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif

### Section 3: AboutSection
*   **Layout:** Min-h-screen, centered layout, white background, px-5 md:px-10 py-20.
*   **Visual Assets:** Four decorative 3D assets in corners:
    *   *Top-Left:* Moon icon (`w-[120px]` to `w-[210px]`, top 4%, left 4%). FadeIn delay 0.1s, x -80px.
    *   *Bottom-Left:* 3D shape (`w-[100px]` to `w-[180px]`, bottom 8%, left 10%). FadeIn delay 0.25s, x -80px.
    *   *Top-Right:* Lego icon (`w-[120px]` to `w-[210px]`, top 4%, right 4%). FadeIn delay 0.15s, x 80px.
    *   *Bottom-Right:* 3D group (`w-[130px]` to `w-[220px]`, bottom 8%, right 10%). FadeIn delay 0.3s, x 80px.
*   **Heading:** "About me" or "The Platform" in heavy tracked font.
*   **Body:** Character-by-character scroll-reveal opacity animation (Framer Motion scroll triggers from 0.2 to 1 scroll offsets).

### Section 4: ServicesSection
*   **Layout:** White background, rounded top corners (`rounded-t-[40px]` to `md:rounded-t-[60px]`), padding px-5 md:px-10 py-20.
*   **Content:** 5 service list rows (e.g. 01 Adaptive LMS, 02 AI Proctoring, 03 Live GDs, 04 AI Interviews, 05 Recruiter Pipeline).
*   **Layout Structure:** Large serial index number on the left; Title + description stacked on the right. Separated by 1px borders (`rgba(12,12,12,0.15)`).

### Section 5: ProjectsSection
*   **Layout:** Dark background `#0C0C0C`, pulled up with negative margin.
*   **Interactive Cards:** 3 sticky-stacking cards (e.g., LMS preview, Proctoring demo panel, Placement drive board) that scale down sequentially on scroll using Framer Motion `useScroll` transforms: `scale = 1 - (totalCards - 1 - index) * 0.03`, and top offsets (`index * 28px`).
