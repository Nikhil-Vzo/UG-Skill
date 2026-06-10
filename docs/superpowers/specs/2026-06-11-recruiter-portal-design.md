# Recruiter Portal & Authentication Redesign Spec

## Goal Description
Redesign the HR Recruiter Dashboard (`/hr/dashboard`) and the Authentication pages (Student Login/Signup, Recruiter Login, and Admin Login) inside the `ugskill-web` workspace. 
Transition them from generic dark styles to a unified premium, pro-grade light theme utilizing the project's tech-blue (`#0052ff`) and emerald (`#10b981`) color palette, defined via design tokens in `index.css`.

---

## User Review Required
No breaking changes to data models or API routes. The layout, style variables, and custom HTML/CSS properties are the only assets modified.

---

## Proposed Changes

### HR Recruiter Dashboard
- **Target Files:**
  - [HRDashboard.tsx](file:///c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/hr/HRDashboard.tsx)
  - [HRDashboard.css](file:///c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/hr/HRDashboard.tsx)
- **Modifications:**
  - Transition the main wrapper `.hr-portal` to use the slate light background `var(--bg-app)` and dark text `var(--text-primary)`.
  - Overhaul cards (`.hr-stat-card`, `.hr-panel`, `.hr-applicant-item`, and `.hr-drive-item`) to use a clean white background (`var(--surface-1)`), subtle borders (`1px solid var(--border-subtle)`), and modern drop shadows.
  - Remove custom dark style inputs and inline style values (like `inputStyle` and `labelStyle`) and replace them with CSS-governed form fields that focus cleanly with a blue glow.
  - Redesign modals (`.hr-modal`) to use the light theme with proper overlay backdrops and clean buttons.
  - Adapt the stats grid layout to look clean, polished, and responsive.

### Authentication Pages
- **Target Files:**
  - [Login.css](file:///c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/Login.css)
  - [portals.css](file:///c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/portals.css)
  - [Login.tsx](file:///c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/Login.tsx)
  - [HRLogin.tsx](file:///c:/Users/nikhi/Downloads/ugskill/ugskill-web/src/pages/HRLogin.tsx)
- **Modifications:**
  - Transition the right-side forms in the HR Login page (`.hr-portal-right`) from a charcoal background to a pure white/slate background, unified with the standard login layout.
  - Overhaul buttons (`.hr-submit-btn` and `.admin-submit-btn`) to use `linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 100%)` with a subtle elevation shift on hover.
  - Ensure typography uses `Plus Jakarta Sans` throughout the onboarding process.

---

## Verification Plan

### Automated Tests
- Run Vite local production build:
  ```bash
  npm run build
  ```

### Manual Verification
- Access `http://localhost:5173/hr/dashboard` and verify the recruiter panels, stats cards, and modals render correctly in the browser.
- Open the login page (`http://localhost:5173/login`) and recruiter login (`http://localhost:5173/hr`) to check input alignments, transitions, and buttons.
- Test responsive layout behavior.
