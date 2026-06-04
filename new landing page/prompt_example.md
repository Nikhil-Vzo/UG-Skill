### Look all Are Prompts that people use to avoid Their sight to look like being vibe coded So whenever I give you a prompt you can convert into the following types and take reference from here By the way the kind of throwns and these prompts are structured in a way that they avoid the website being looked like while forwarded so you have to exactly work like this You don't have to exactly copy paste this Commands or prom You can refer to them in whatever commands you get you can convert into such type of commands

### 1. 3D Creator Portfolio ("Jack")

```markdown
Build a 3D Creator portfolio landing page for "Jack" using React, TypeScript, Tailwind CSS, Framer Motion, and Lucide React. The page has a dark theme (#0C0C0C background) with the font Kanit (Google Fonts, weights 300-900). The page title is "Jack -- 3D Creator".

**GLOBAL STYLES**
* Background: `#0C0C0C` on html, body, `#root`, and the main wrapper
* Font family: 'Kanit', sans-serif
* Global reset: box-sizing border-box, margin 0, padding 0
* CSS class `.hero-heading`: gradient text using `background: linear-gradient(180deg, #646973 0%, #BBCCD7 100%)` with `-webkit-background-clip: text` and `-webkit-text-fill-color: transparent`
* Main wrapper has `overflowX: 'clip'`

**SECTION ORDER**
1. HeroSection
2. MarqueeSection
3. AboutSection
4. ServicesSection
5. ProjectsSection

**1. HERO SECTION**
Full viewport height (`h-screen`), flex column layout with `overflowX: clip`.
* **Navbar:** Horizontal nav bar with 4 links -- "About", "Price", "Projects", "Contact" -- evenly spaced with `justify-between`. Text color `#D7E2EA`, font-medium, uppercase, tracking-wider. Sizes: text-sm md:text-lg lg:text-[1.4rem]. Padding: px-6 md:px-10 pt-6 md:pt-8. Hover: opacity 70% with 200ms transition.
* **Hero Heading:** Massive h1 with text "Hi, i'm jack" (lowercase "i", curly apostrophe via `&apos;`). Uses the `.hero-heading` gradient text class. Font-black, uppercase, tracking-tight, leading-none, whitespace-nowrap, w-full. Font sizes: text-[14vw] sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw]. Margin top: mt-6 sm:mt-4 md:-mt-5. Wrapped in overflow-hidden container.
* **Bottom bar:** Flexbox justify-between items-end with pb-7 sm:pb-8 md:pb-10:
  * **Left:** paragraph text "a 3d creator driven by crafting striking and unforgettable projects", color `#D7E2EA`, font-light, uppercase, tracking-wide, leading-snug. Font size: clamp(0.75rem, 1.4vw, 1.5rem). Max-width: max-w-[160px] sm:max-w-[220px] md:max-w-[260px].
  * **Right:** ContactButton component (see below)
* **Hero Portrait:** Centered absolutely. Uses a Magnet component (mouse-following magnetic effect) wrapping an image. Image URL: `https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png`. Magnet settings: padding 150, strength 3, activeTransition "transform 0.3s ease-out", inactiveTransition "transform 0.6s ease-in-out". Positioning: absolute left-1/2 -translate-x-1/2 z-10. Width: w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px]. On mobile: top-1/2 -translate-y-1/2. On sm+: sm:top-auto sm:translate-y-0 sm:bottom-0.
* **FadeIn animations:** Navbar fades in with delay 0, y -20. Heading: delay 0.15, y 40. Left text: delay 0.35, y 20. Contact button: delay 0.5, y 20. Portrait: delay 0.6, y 30.

**2. MARQUEE SECTION**
Two rows of images that scroll horizontally based on page scroll position. Background `#0C0C0C`. Padding: pt-24 sm:pt-32 md:pt-40 pb-10.
* **Row 1:** First 11 images, tripled for seamless scrolling. Moves RIGHT on scroll (`translateX(offset - 200)`).
* **Row 2:** Remaining 10 images, tripled. Moves LEFT on scroll (`translateX(-(offset - 200))`).
* Scroll offset calculated as: `(window.scrollY - sectionTop + window.innerHeight) * 0.3`
* Each image tile: 420px x 270px, rounded-2xl, object-cover, lazy loaded. Gap-3 between tiles and rows.
* *Video GIFs (Use exactly these):* https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif
  https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif
  https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif
  https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif
  https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif
  https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif
  https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif
  https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif
  https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif
  https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif
  https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif
  https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif
  https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif
  https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif
  https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif
  https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif
  https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif
  https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif
  https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif
  https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif
  https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif

**3. ABOUT SECTION**
Full-height centered section with min-h-screen, padding px-5 sm:px-8 md:px-10 py-20.
* **4 Decorative 3D Images:**
  * Top-left (Moon): `.../moon_icon.11395d36.png` - w-[120px] sm:w-[160px] md:w-[210px], top-[4%] left-[1%] sm:left-[2%] md:left-[4%]. FadeIn: delay 0.1, x -80.
  * Bottom-left (3D object): `.../p59_1.4659672e.png` - w-[100px] sm:w-[140px] md:w-[180px], bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%]. FadeIn: delay 0.25, x -80.
  * Top-right (Lego): `.../lego_icon-1.703bb594.png` - w-[120px] sm:w-[160px] md:w-[210px], top-[4%] right-[1%] sm:right-[2%] md:right-[4%]. FadeIn: delay 0.15, x 80.
  * Bottom-right (3D group): `.../Group_134-1.2e04f3ce.png` - w-[130px] sm:w-[170px] md:w-[220px], bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%]. FadeIn: delay 0.3, x 80.
* **Heading:** "About me" using `.hero-heading`.
* **Animated paragraph:** Uses a character-by-character scroll-driven opacity animation (Framer Motion `useScroll` from 0.2 to 1). Text: "With more than five years of experience in design..."
* Contact button below the text block.

**4. SERVICES SECTION**
White background (`#FFFFFF`), rounded top corners `rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px]`. Padding: px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32.
* Heading: "Services" in `#0C0C0C`.
* 5 service items in a vertical list, max-w-5xl, centered:
  * 01 - 3D Modeling
  * 02 - Rendering
  * 03 - Motion Design
  * 04 - Branding
  * 05 - Web Design
* Layout: Number on the left (huge), name + description stacked vertically on the right. Separated by 1px borders `rgba(12, 12, 12, 0.15)`.

**5. PROJECTS SECTION**
Dark background (`#0C0C0C`), pulled up with negative margin, z-10.
* Heading: "Project" using `.hero-heading`.
* 3 sticky-stacking project cards that scale down as you scroll past them using Framer Motion `useScroll` and `useTransform`. Scale: `1 - (totalCards - 1 - index) * 0.03`. Offset: `top: ${index * 28}px`.
* Data mapping (Nextlevel Studio, Aura Brand Identity, Solaris Digital) with their respective dual-column layouts and CloudFront image URLs.

**REUSABLE COMPONENTS**
* **ContactButton:** Pill button with gradient bg `linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)`, inner box-shadow, white 2px outline with -3px offset.
* **LiveProjectButton:** Ghost/outline pill button, border-2 `#D7E2EA`.
* **FadeIn:** Framer Motion wrapper using `whileInView`.
* **Magnet:** Mouse-following magnetic hover effect.
* **AnimatedText:** Character-by-character scroll-reveal text animation.

```

### 2. Liquid Glass Landing Page ("Asme")

```markdown
Build a single-page landing site using React + TypeScript + Vite + Tailwind CSS + framer-motion + lucide-react. The entire page has a bg-black background. Font: Instrument Serif (Google Fonts).

**LIQUID GLASS CSS** (in index.css)
```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.4px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0) 60%, rgba(255, 255, 255, 0.15) 80%, rgba(255, 255, 255, 0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}

```

**SECTION 1 -- HERO (Index.tsx)**

* Full-screen (`min-h-screen`) relative flex col.
* Background video: absolute inset-0 w-full h-full object-cover. URL: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4`.
* Fade logic (vanilla JS refs): Fade 0 to 1 on `canplay`. Fade 1 to 0 when remaining time <= 0.55s. Loop seamlessly.
* Navbar: liquid-glass pill. Left: Globe icon + "Asme". Right: "Sign Up" text + "Login" liquid-glass pill.
* Hero Content: text-7xl md:text-9xl Instrument Serif. Text: "Know it then all."
* Email input: liquid-glass rounded-full pill.
* Footer: Social icons in liquid-glass buttons.

**SECTION 2 -- ABOUT SECTION**

* bg-black pt-32, radial gradient overlay.
* Heading: "Pioneering ideas for  minds that create, build, and inspire."

**SECTION 3 -- FEATURED VIDEO**

* Rounded-3xl aspect-video container. FadeIn y:60 to 0.
* Video URL: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4`
* Bottom overlay: Left (liquid glass card with approach text), Right ("Explore more" button).

**SECTION 4 -- PHILOSOPHY**

* Heading: "Innovation x Vision"
* 2-column grid. Left: Video (URL: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4`). Right: Text blocks divided by 1px line.

**SECTION 5 -- SERVICES**

* 2-card grid. Liquid-glass rounded-3xl cards with hover scale-105 on the video.
* Card 1 Video: `.../hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4`
* Card 2 Video: `.../hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4`

```

### 3. Prosthetics Hero Section
```markdown
Build a React + TypeScript + Tailwind CSS single-page hero section using Vite. The entire page lives in `src/App.tsx`. No extra libraries beyond react, lucide-react, and Tailwind.

**Background:**
* Fullscreen autoplaying, muted, looping, `playsInline` background `<video>` absolutely positioned `inset-0 w-full h-full object-cover`.
* Video URL: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4`
* Root wrapper: `relative min-h-screen overflow-hidden bg-[#f0f0ee]`.

**Logo (inline SVG component):**
* `w="18" h="18"`, `viewBox="0 0 256 256"`.
* Path: `M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z`

**Navbar:**
* Centered, pill-style. Two separate pills.
* Left: circular logo container, `bg-[#EDEDED]`.
* Right: pill container `bg-[#EDEDED]` with links: `['Story', 'Products', 'Help', 'Support']`.

**Hero content (bottom-left aligned):**
* Outer: `flex-1 flex items-end pb-10 sm:pb-16 lg:pb-20 px-6 sm:px-12 md:px-20 lg:px-28`.
* Stacked elements:
  1. Badge: "Seen on Shark Tank in India →" (text-blue-500).
  2. Headline `<h1>`: `text-[1.5rem] sm:text-[1.75rem] text-gray-900`. "Simple, smart prosthetics made for people who keep fighting."
  3. Subtext `<p>`: "Reclaim your movement now."
  4. CTA: Outline button "Try a free fitting →". Fills blue on hover.

```

### 4. AI-native Email Client ("Aura")

```markdown
Build a premium, AI-native email client landing page called "Aura" using React 18 + TypeScript + Vite + Tailwind CSS + motion/react + lucide-react. 

**Aesthetic:** Dark (`bg-[#0c0c0c]`), cinematic, glassy, macOS-style menu bar, liquid-glass cards.
* Font: Google Fonts Inter (weights 400-900). 
* Global Video: `fixed inset-0 z-0 w-full h-full object-cover` (URL: `.../hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4`).

**SVG Noise Filters:**
* Define `<filter id="c3-noise">` globally for the shiny headline text and the pricing watermark backdrop. (Use `feTurbulence`, `feColorMatrix`, `feComposite`, `feBlend`).

**Primitives:**
* **AppleLogo:** inline SVG.
* **LogoMark:** abstract 4-quadrant curve SVG.
* **AppleButton:** rounded-full white pill button.
* **gradientStyle:** Text gradient on the word "Revitalized" (linear-gradient from `#091020` to `#00d2ff` back to `#091020`) with `-webkit-background-clip: text`, applying the `url(#c3-noise)` filter and a 6s `.animate-shiny` background-position animation.
* **liquid-glass:** CSS utility class utilizing radial gradients and XOR masking for a premium border/backdrop blur.

**Sections:**
1. **Navbar:** Motion fade down. LogoMark left, links center, AppleButton right.
2. **Hero:** "Your email." / "Revitalized" (with gradientStyle). Followed by subtext and download button.
3. **macOS Bar:** `h-10 bg-black/40 backdrop-blur-md border-y border-white/10`. Menu items File, Edit, View, etc.
4. **Inbox Mockup:** `bg-[#0e1014]/90 backdrop-blur-2xl`. Grid layout with Sidebar (labels, folders), Message List (6 mock emails), and Reader (AI Summary block using Sparkles icon, email thread body).
5. **FeatureTriage:** 2-column grid. Left: text "Clear your inbox in a single pass." Right: 4 liquid-glass priority buckets (Priority, Follow-up, Updates, Archived).
6. **LogoCloud:** Marquee/grid of logos (Linear, Vercel, Figma, Stripe, etc).
7. **Testimonials:** 3-col grid of quotes in liquid-glass cards.
8. **Pricing:** Cinematic typography overlay with `.c3-watermark-container`. 3 pricing tiers (Free, Standard, Pro) rendered via custom `.c3-card` CSS, and a toggle for Monthly/Yearly.
9. **Final CTA:** Liquid-glass block with a radial glow overlay.

```

### 5. PR-Agency SaaS ("Convix Software")

```markdown
Build a fully responsive, full-viewport hero section for a PR-agency SaaS called "Convix Software" with these exact specs (React + TS + Vite + Tailwind CSS + Lucide):

**Page Frame & Video:**
* Outer wrapper: `min-h-screen w-full bg-[#ededed] p-3 sm:p-4`, font-family Inter.
* Hero container: `relative w-full h-[calc(100vh-24px)] overflow-hidden bg-[#d9d9d9] rounded-2xl`.
* Background Video: `absolute inset-0 w-full h-full object-cover pointer-events-none`. 
  URL: `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4`.
* Overlay: `absolute inset-0 bg-white/10`.
* Fonts: Inter & Instrument Serif.

**Navbar (Floating Pill):**
* `bg-white rounded-full max-w-[760px] relative px-2 py-2`.
* Logo: Orange `#ef4d23` 8-petal flower SVG.
* Desktop links: Home (with black dot), Features, About, Pages (with ChevronDown).
* Right: ShoppingCart + Orange "Get early access" button.
* Mobile Menu: Absolute dropdown triggered by hamburger toggle.

**Hero Content:**
* Badge: "Convix Software" with an orange dot.
* Headline `<h1>`: `clamp(36px, 8vw, 72px)`. Text: "Shaping " + `<span style="font-family:'Instrument Serif'; font-style:italic">Agencies</span>` + " of tomorrow".
* Subtitle: "The All-In-One Software Powering the Future of PR Agencies".
* CTA: Black `#0b0f1a` rounded-full "Get Started" button.

**Dashboard Preview (Clipping off the bottom):**
* Wrapper: `bg-[#f5f2ee] rounded-3xl p-4 max-w-[880px] mx-auto`.
* Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`.
* **Card 1 (Clicks):** "6,896", red pill "-3,382", Gauge at 92% (color `#ef4d23`), Toggle pill (Impressions / Clicks).
* **Card 2 (Form):** Two dropdown groups ("Show figures for", "Compare period by"). Two inputs ("Ste targets"). Footer with orange "Save" button and "Cancel".
* **Card 3 (Video Starts):** "0", pill with TrendingUp, Gauge at 68% (color `#9ca3af`), Toggle pill.
* **Gauge Component:** Custom SVG viewBox 0 0 200 120. 40 tick marks spanning a 180° arc. Active count = `round(value/100 * 40)`.

```