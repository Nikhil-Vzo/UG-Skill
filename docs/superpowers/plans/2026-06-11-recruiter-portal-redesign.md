# Recruiter Portal & Authentication Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Recruiter Portal and Auth pages to use a premium, pro-grade light theme with tech-blue and emerald accents.

**Architecture:** Convert custom inline styles and dark colors in `HRDashboard.tsx` and `HRDashboard.css` to use global design tokens (like `var(--bg-app)`, `var(--surface-1)`, `var(--border-subtle)`, `var(--primary)`) from `index.css`. Standardize `Login.css` and `portals.css` to transition from dark/neon colors to a clean, cohesive light/slate theme.

**Tech Stack:** React, CSS Variables, Lucide icons, Vite.

---

### Task 1: Redesign Portal Login Styling (`portals.css`)

**Files:**
- Modify: `c:\Users\nikhi\Downloads\ugskill\ugskill-web\src\pages\portals.css`

- [ ] **Step 1: Replace dark styles with Light Theme variables in `portals.css`**
  Modify `.hr-portal-page`, `.hr-portal-right`, `.hr-portal-heading`, `.hr-portal-subheading`, `.hr-input`, `.hr-submit-btn`, `.hr-portal-notice`, `.hr-portal-back-link` and `.hr-invite-form-header` to match:
  ```css
  .hr-portal-page {
    min-height: 100vh;
    display: flex;
    position: relative;
    overflow: hidden;
    background: var(--bg-app);
  }
  .hr-portal-right {
    width: 480px;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem;
    background: var(--surface-1);
    border-left: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }
  .hr-portal-heading {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }
  .hr-portal-subheading {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.375rem;
    line-height: 1.5;
  }
  .hr-input {
    width: 100%;
    padding: 0.75rem 0.875rem 0.75rem 2.625rem;
    background: var(--surface-1);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    font-size: 0.9375rem;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
  }
  .hr-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
    background: var(--surface-1);
  }
  .hr-input::placeholder {
    color: var(--text-tertiary);
  }
  .hr-submit-btn {
    margin-top: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 100%);
    border: none;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: opacity 0.2s ease, transform 0.15s ease;
    width: 100%;
  }
  .hr-submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--primary-glow);
  }
  .hr-portal-notice {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: var(--primary-subtle);
    border: 1px solid var(--border-emphasis);
    border-radius: 8px;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  .hr-portal-notice-icon {
    color: var(--primary);
    flex-shrink: 0;
    margin-top: 1px;
  }
  .hr-portal-back-link {
    text-align: center;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }
  .hr-portal-back-link a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
  }
  .hr-invite-form-header {
    padding: 1rem;
    background: var(--primary-subtle);
    border: 1px solid var(--border-emphasis);
    border-radius: 8px;
  }
  .hr-invite-company {
    font-size: 0.75rem;
    color: var(--primary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }
  .hr-invite-email {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-top: 0.25rem;
  }
  ```

- [ ] **Step 2: Commit Task 1 changes**
  ```bash
  git add ugskill-web/src/pages/portals.css
  git commit -m "style: redesign HR recruiter login page to light theme"
  ```

---

### Task 2: Redesign General Auth Styling (`Login.css`)

**Files:**
- Modify: `c:\Users\nikhi\Downloads\ugskill\ugskill-web\src\pages\Login.css`

- [ ] **Step 1: Clean and update shadows/borders in `Login.css`**
  Modify buttons and cards inside `Login.css` to use standard variables:
  ```css
  .login-submit-btn {
    height: 3.25rem !important;
    font-size: 0.9375rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.01em !important;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 100%) !important;
    box-shadow: 0 4px 12px var(--primary-glow) !important;
    margin-top: 0.5rem;
  }
  .login-submit-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px var(--primary-glow) !important;
  }
  .login-forgot-link {
    color: var(--primary);
  }
  .login-forgot-link:hover {
    color: var(--primary-dim);
  }
  .login-footer-link {
    color: var(--duo-green);
  }
  .login-footer-link:hover {
    color: var(--duo-green-hover);
  }
  ```

- [ ] **Step 2: Commit Task 2 changes**
  ```bash
  git add ugskill-web/src/pages/Login.css
  git commit -m "style: update submit buttons and link accents in general login page"
  ```

---

### Task 3: Redesign HR Dashboard Styling (`HRDashboard.css`)

**Files:**
- Modify: `c:\Users\nikhi\Downloads\ugskill\ugskill-web\src\pages\hr\HRDashboard.css`

- [ ] **Step 1: Replace dark themes with Slate Light Theme variables in `HRDashboard.css`**
  Update styling classes in `HRDashboard.css` to use the global theme tokens:
  ```css
  .hr-portal {
    min-height: 100vh;
    background: var(--bg-app);
    color: var(--text-primary);
    font-family: var(--font-body);
  }
  .hr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2.5rem;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-subtle);
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: var(--shadow-sm);
  }
  .hr-header-logo-wrap {
    width: 36px;
    height: 36px;
    background: var(--gradient-primary);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  .hr-btn-create {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 100%);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px var(--primary-glow);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hr-btn-create:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px var(--primary-glow);
    filter: brightness(1.08);
  }
  .hr-welcome-title {
    font-size: 1.85rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    margin-bottom: 0.375rem;
    color: var(--text-primary);
  }
  .hr-welcome-subtitle {
    color: var(--text-secondary);
    font-size: 0.9375rem;
    margin-top: 0;
  }
  .hr-stat-card {
    padding: 1.5rem;
    background: var(--surface-1);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: all 0.25s ease;
    box-shadow: var(--shadow-sm);
  }
  .hr-stat-card:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  .hr-stat-label {
    font-size: 0.775rem;
    color: var(--text-secondary);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .hr-panel {
    background: var(--surface-1);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
  }
  .hr-panel-title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }
  .hr-panel-link {
    font-size: 0.775rem;
    color: var(--primary);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }
  .hr-panel-link:hover {
    color: var(--primary-hover);
  }
  .hr-applicant-item {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.75rem 1rem;
    background: var(--surface-1);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hr-applicant-item:hover {
    background: var(--surface-2);
    border-color: var(--primary);
    transform: translateX(3px);
  }
  .hr-avatar {
    width: 36px;
    height: 36px;
    background: var(--primary-subtle);
    border: 1px solid var(--border-emphasis);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
    color: var(--primary);
  }
  .hr-applicant-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-primary);
  }
  .hr-drive-item {
    padding: 1.125rem;
    background: var(--surface-2);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.25s ease;
  }
  .hr-drive-item:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
  }
  .hr-drive-name {
    font-weight: 700;
    font-size: 0.9375rem;
    margin-bottom: 0.375rem;
    color: var(--text-primary);
  }
  .hr-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    justify-content: flex-end;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
  }
  .hr-side-panel {
    width: 420px;
    max-width: 95vw;
    background: var(--surface-1);
    border-left: 1px solid var(--border-subtle);
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    box-shadow: -10px 0 35px rgba(0, 0, 0, 0.05);
  }
  .hr-side-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }
  .hr-resume-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.875rem;
    background: var(--surface-2);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-primary);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .hr-resume-btn:hover {
    background: var(--surface-3);
  }
  .hr-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(4px);
  }
  .hr-modal {
    background: var(--surface-1);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 2.5rem;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
  }
  .hr-modal-title {
    color: var(--text-primary);
  }
  .hr-modal-btn.secondary {
    background: var(--surface-2);
    border: 1px solid var(--border-subtle);
    color: var(--text-primary);
  }
  .hr-modal-btn.secondary:hover {
    background: var(--surface-3);
  }
  .hr-modal-btn.primary {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 100%);
    color: #fff;
    box-shadow: 0 4px 12px var(--primary-glow);
  }
  .hr-modal-btn.primary:hover {
    box-shadow: 0 6px 16px var(--primary-glow);
  }
  ```

- [ ] **Step 2: Commit Task 3 changes**
  ```bash
  git add ugskill-web/src/pages/hr/HRDashboard.css
  git commit -m "style: overhaul HRDashboard CSS to modern light-theme variables"
  ```

---

### Task 4: Polish HR Dashboard Layout & Inline Styles (`HRDashboard.tsx`)

**Files:**
- Modify: `c:\Users\nikhi\Downloads\ugskill\ugskill-web\src\pages\hr\HRDashboard.tsx`

- [ ] **Step 1: Refactor inline styles and components in `HRDashboard.tsx`**
  Modify the inline styled objects and text color definitions inside `HRDashboard.tsx` to align with the light theme:
  - Replace the styling constants:
  ```typescript
  const labelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', fontSize: '0.8125rem',
    fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem',
    background: 'var(--surface-1)', border: '1px solid var(--border-default)',
    borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
    boxSizing: 'border-box',
  };
  const roleCardStyle = (accent: string): React.CSSProperties => ({
    display: 'flex', gap: '0.625rem', padding: '0.75rem',
    background: `${accent}0a`, border: `1px solid ${accent}30`,
    borderRadius: 8,
  });
  const linkCardStyle = (accent: string): React.CSSProperties => ({
    padding: '1rem', background: `${accent}0a`,
    border: `1px solid ${accent}30`, borderRadius: 10,
  });
  const linkUrlStyle: React.CSSProperties = {
    background: 'var(--surface-2)', border: '1px solid var(--border-subtle)',
    borderRadius: 6, padding: '0.5rem 0.75rem',
    fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-primary)',
    wordBreak: 'break-all', lineHeight: 1.5,
  };
  ```
  - In `ScheduleInterviewModal` component (lines 71-77):
  ```tsx
  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
    Candidate: <strong style={{ color: 'var(--text-primary)' }}>{applicant.student?.fullName}</strong>
    {applicant.drive?.name && (
      <span> · {applicant.drive.name}</span>
    )}
  </p>
  ```
  - In `ScheduleInterviewModal` role callout description text color: Update `color: '#a5b4fc'` and `color: '#64748b'` to use `var(--text-primary)` and `var(--text-secondary)`.
  - In `DualLinkModal` scheduled subtitle text:
  ```tsx
  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
    Scheduled for <strong style={{ color: 'var(--text-primary)' }}>{scheduledLabel}</strong>
    {session.roundLabel && <span> · {session.roundLabel}</span>}
  </p>
  ```
  - Update `statusColor` values to look soft and visible in light mode:
  ```typescript
  const statusColor: Record<string, string> = {
    shortlisted: '#10b981',
    rejected:    '#f43f5e',
    pending:     '#f97316',
    interview:   '#0052ff',
    selected:    '#10b981',
  };
  ```
  - In main `HRDashboard` component header: Update logo background, button backgrounds, logout icon colors, and subtexts to align with light theme. Update `createdBy` drive deletions logic and modals.

- [ ] **Step 2: Commit Task 4 changes**
  ```bash
  git add ugskill-web/src/pages/hr/HRDashboard.tsx
  git commit -m "style: remove dark inline styles and update colors in HRDashboard.tsx"
  ```

---

### Task 5: Verify Build & Compile Success

- [ ] **Step 1: Run the local build check in `ugskill-web`**
  Run: `npm run build` in `c:\Users\nikhi\Downloads\ugskill\ugskill-web`
  Expected: Builds successfully with no compilation errors or TypeScript warnings.

- [ ] **Step 2: Verify in browser**
  Ensure localhost portals `http://localhost:5173/hr/dashboard` and logins load and look beautiful.
