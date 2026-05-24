from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import time

BASE_URL = "http://localhost:5173"

def login(page, email, password, role_label):
    """Login helper with explicit URL confirmation."""
    page.goto(BASE_URL + "/login")
    page.wait_for_load_state("networkidle")
    print("  [URL after goto] " + page.url)

    page.fill("input[type='email']", email)
    page.fill("input[type='password']", password)
    page.click("button[type='submit']")

    try:
        page.wait_for_url("**/app**", timeout=8000)
        print("[OK] " + role_label + " login successful. URL: " + page.url)
        return True
    except PlaywrightTimeout:
        print("[FAIL] " + role_label + " login failed. Current URL: " + page.url)
        print("  Page snippet: " + page.inner_text("body")[:300])
        return False

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream"
            ]
        )

        print("=" * 50)
        print("  PROCTORING E2E FLOW TEST")
        print("=" * 50)

        # -- PHASE 1: ADMIN --
        print("\n[Phase 1] Admin verification...")
        admin_ctx = browser.new_context()
        admin_page = admin_ctx.new_page()

        admin_ok = login(admin_page, "admin@ugskill.com", "Admin@123", "Admin")

        if admin_ok:
            admin_page.goto(BASE_URL + "/app/admin/exams")
            admin_page.wait_for_load_state("networkidle")
            if admin_page.locator("text=Active Exams").is_visible():
                print("  Exam Operations: 'Active Exams' section visible.")
            else:
                print("  Exam Operations page loaded (no 'Active Exams' text - may be empty).")

        admin_ctx.close()

        # -- PHASE 2: STUDENT LOGIN --
        print("\n[Phase 2] Student login...")
        student_ctx = browser.new_context()
        student_page = student_ctx.new_page()

        student_ok = login(student_page, "student@ugskill.com", "Student@123", "Student")

        if not student_ok:
            print("  Cannot proceed without student login. Aborting.")
            student_ctx.close()
            browser.close()
            return

        # -- PHASE 3: NAVIGATE TO EXAMS --
        print("\n[Phase 3] Navigating to student exams page...")
        student_page.goto(BASE_URL + "/app/exams")
        student_page.wait_for_load_state("networkidle")
        print("  Current URL: " + student_page.url)

        exam_cards = student_page.locator(".surface-card")
        start_buttons = student_page.locator("button:has-text('Enter Exam'), button:has-text('Preview')")
        print("  Exam cards found: " + str(exam_cards.count()))
        print("  Action buttons found: " + str(start_buttons.count()))

        if exam_cards.count() == 0:
            print("  [WARN] No exam cards visible.")
            print("  Page snippet: " + student_page.inner_text("body")[:500])
            student_ctx.close()
            browser.close()
            print("\nTest completed (no exams visible to student).")
            return

        # -- PHASE 4: ENTER EXAM --
        print("\n[Phase 4] Entering exam...")
        start_buttons.first.click()
        student_page.wait_for_load_state("networkidle")
        print("  URL after click: " + student_page.url)

        if "pre-flight" in student_page.url:
            print("  On Pre-Flight page. Checking policies and waiting for hardware diagnostics...")
            try:
                # Click 'Initiate Secure Scan' to trigger getUserMedia and start radar sweep diagnostics
                scan_btn = student_page.locator("button:has-text('Initiate Secure Scan')")
                if scan_btn.is_visible():
                    print("  Clicking Initiate Secure Scan...")
                    scan_btn.click()
                    time.sleep(2) # Give it a brief moment to open the stream
                
                # Check the agreement rules checkbox
                student_page.locator("label[for='agree-rules']").click()
                
                # Locate and wait for 'Begin Examination' to be visible and enabled
                begin_btn = student_page.locator("button:has-text('Begin Examination')")
                begin_btn.wait_for(state="visible", timeout=20000)
                
                # Allow a short duration for video analysis to register 'detected'
                time.sleep(4)
                begin_btn.click()
                student_page.wait_for_load_state("networkidle")
                print("  Pre-flight passed. URL: " + student_page.url)
            except PlaywrightTimeout:
                print("  [WARN] Pre-flight 'Begin Examination' button not found or enabled within 20s.")

        # -- PHASE 5: PROCTORING HUD --
        print("\n[Phase 5] Checking Proctoring HUD...")
        try:
            student_page.wait_for_selector("#proctoring-hud", timeout=15000)
            hud_text = student_page.locator("#proctoring-hud").inner_text()
            print("[OK] Proctoring HUD detected: " + hud_text[:100])
        except PlaywrightTimeout:
            print("[WARN] Proctoring HUD (#proctoring-hud) not found within 15s.")
            print("  Page snippet: " + student_page.inner_text("body")[:400])

        # -- PHASE 6: FRAME CAPTURE WAIT --
        print("\n[Phase 6] Waiting 7s for frame capture cycle...")
        time.sleep(7)

        warning = student_page.locator(".proctoring-warning")
        if warning.is_visible():
            print("[WARN] Proctoring warning triggered: " + warning.inner_text())
        else:
            print("  No proctoring warnings fired (no violations detected).")

        student_ctx.close()
        browser.close()

        print("\n" + "=" * 50)
        print("  TEST COMPLETE")
        print("=" * 50)

if __name__ == "__main__":
    run_test()
