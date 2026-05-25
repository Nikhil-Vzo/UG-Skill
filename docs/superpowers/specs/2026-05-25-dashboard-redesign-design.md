# Design Spec - Gamified SaaS Student Dashboard Redesign

## 1. Goal Description
The student dashboard is transitioning from a very dark/black design to a premium, high-contrast light theme. This new design maintains a clean professional SaaS look for layout structures (flat cards, thin gray borders, elegant shadows) but infuses responsive gamification elements (subtle 3D press-down buttons, rounded tags) matching the student's learning progression framework (XP, levels, and streaks).

## 2. Design Tokens & CSS Variables

The following custom properties will be defined globally in `src/index.css`:

```css
:root {
  /* ── Backgrounds ── */
  --bg-app:               #ffffff;   /* Pure white main base */
  --bg-overlay:           rgba(255, 255, 255, 0.95);
  
  /* Surface elevations */
  --surface-0:            #ffffff;   /* Main background */
  --surface-1:            #ffffff;   /* Card base */
  --surface-2:            #f8fafc;   /* Inset wells & secondary widgets */
  --surface-3:            #f1f5f9;   /* Hover highlights, dropdowns */
  --surface-4:            #e2e8f0;   /* Headers, light borders */

  /* ── Accent Colors ── */
  --color-success:        #10b981;   /* Mint/Success Green */
  --color-success-subtle: rgba(16, 185, 129, 0.06);
  --color-warning:        #f59e0b;   /* Amber */
  --color-error:          #ef4444;   /* Rose / Red */
  
  /* Aura Blue Accents */
  --primary:              #0284c7;   /* Aura Blue */
  --primary-hover:        #0369a1;
  --primary-glow:         rgba(2, 132, 199, 0.15);
  
  /* Pink-radient (Aura-Blue to Pink Gradient) */
  --gradient-primary:     linear-gradient(135deg, #38bdf8 0%, #ec4899 100%);
  --gradient-primary-dark: linear-gradient(135deg, #0284c7 0%, #db2777 100%);

  /* ── Typography ── */
  --font-display:         'Outfit', 'Space Grotesk', sans-serif; /* Rounded geometric headers */
  --font-body:            'Inter', sans-serif;                   /* Crisp reading body font */

  /* ── Spacing & Sizing ── */
  --radius-sm:            4px;
  --radius-md:            8px;       /* Elements, buttons, inputs */
  --radius-lg:            12px;      /* Standard card container corners */
  --radius-xl:            16px;      /* Hero sections */
  
  /* ── Borders & Shadows ── */
  --border-default:       #e2e8f0;   /* Crisp slate-200 border line */
  --border-focus:         #38bdf8;   
  --shadow-sm:            0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-md:            0 4px 20px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02);
}
```

## 3. UI Component Layout Specifications

### 3.1. Dashboard Cards
* **Visual Styling**:
  * Clean white background (`--surface-1`).
  * Thin, precise light gray borders (`1px solid var(--border-default)`).
  * Rounded corners (`border-radius: var(--radius-lg)`).
  * Hover transition: Translates up by `1px` and increases shadow spread (`box-shadow: var(--shadow-md)`).

### 3.2. Tactile 3D Buttons (`.duo-btn-subtle`)
* **Visual Styling**:
  * Border: `none`.
  * Background: Aura Blue (`#38bdf8`) or Gradient (`var(--gradient-primary)`).
  * Bottom offset: `border-bottom: 3px solid var(--primary-hover)` (simulating a physical base depth).
  * Rounded corners: `border-radius: var(--radius-md)`.
* **Micro-interactions**:
  * On Active / Mouse Down: `transform: translateY(2px)`, `border-bottom-width: 1px`. Shrinks the bottom border to simulate pressing down.
  * Transitions are instantaneous (`transition: all 0.05s ease`) to feel fast and clicky.

### 3.3. Badges & Progress Bars
* **Status Badges**:
  * Clean, bordered capsules with desaturated background fills (e.g. `background: var(--color-success-subtle)`, `color: var(--color-success)`, `border: 1px solid var(--color-success)`).
* **Progress Bars**:
  * Height: `8px`.
  * Track background: `#e2e8f0`.
  * Fill: `var(--gradient-primary)` or `var(--primary)`.

## 4. Implementation Steps
1. **Fonts Integration**: Ensure 'Outfit' Google Font is imported in `index.html` or `index.css`.
2. **Tokens Setup**: Modify `index.css` to update CSS custom variables inside `:root`.
3. **Dashboard CSS Updates**: Clean up `Dashboard.css` to remove overridden dark colors and align with the new light variable themes.
4. **Button & Tag Classes**: Add utility classes for the tactile 3D buttons (`.btn-3d-tactile`) and status tags in `index.css` so they can be reused across pages.
