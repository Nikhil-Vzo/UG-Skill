from playwright.sync_api import sync_playwright
import time
import os

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Starting Proctoring E2E Flow Test...")

        # 1. Admin Login
        print("Logging in as Admin...")
        page.goto("http://localhost:5173/admin")
        page.fill("input[type='email']", "admin@ugskill.com")
        page.fill("input[type='password']", "Admin@123")
        page.click("button[type='submit']")
        
        # Wait for dashboard
        page.wait_for_url("**/app**")
        print("Admin Login Successful.")

        # 2. Check Exam Config
        print("Checking Exam Operations...")
        page.goto("http://localhost:5173/app/admin/exams")
        page.wait_for_load_state("networkidle")
        
        # Check if an exam exists, if not we might need to create one (but usually we assume seed data)
        # For now, just verify we are on the page
        if page.locator("text=Active Exams").is_visible():
            print("Exam Operations page loaded.")
        else:
            print("Exam Operations page loaded but no 'Active Exams' found.")

        # 3. Student Login
        print("Logging in as Student...")
        page.goto("http://localhost:5173/login")
        page.fill("input[type='email']", "student@ugskill.com")
        page.fill("input[type='password']", "Student@123")
        page.click("button[type='submit']")
        
        page.wait_for_url("**/app**")
        print("Student Login Successful.")

        # 4. Navigate to Exams
        print("Navigating to Student Exams...")
        page.goto("http://localhost:5173/app/exams")
        page.wait_for_load_state("networkidle")

        # 5. Start Exam
        # Find the first 'Start' button
        start_buttons = page.locator("button:has-text('Start'), button:has-text('Take Exam')")
        if start_buttons.count() > 0:
            print(f"Starting Exam: {start_buttons.first.inner_text()}")
            start_buttons.first.click()
            
            # Wait for Pre-Flight or Interface
            page.wait_for_load_state("networkidle")
            
            # If Pre-Flight, click 'Start Exam'
            if "pre-flight" in page.url:
                print("On Pre-Flight page. Enabling Camera...")
                # Usually there's a camera permission/preview here.
                # Assuming 'Start Exam' button appears after checks.
                start_exam_btn = page.locator("button:has-text('Start Exam')")
                page.wait_for_selector("button:has-text('Start Exam')", timeout=10000)
                start_exam_btn.click()

            # 6. Monitor Proctoring Interface
            print("On Exam Interface. Checking for Proctoring HUD...")
            page.wait_for_selector("#proctoring-hud", timeout=15000)
            
            hud = page.locator("#proctoring-hud")
            if hud.is_visible():
                print("Proctoring HUD detected.")
                status_text = hud.inner_text()
                print(f"HUD Status: {status_text}")
            
            # Wait for at least one frame capture (5s interval)
            print("Waiting for frame capture (5s)...")
            time.sleep(7)
            
            # Check for any alerts (warning banner)
            warning = page.locator(".proctoring-warning")
            if warning.is_visible():
                print(f"WARNING DETECTED: {warning.inner_text()}")
            else:
                print("No immediate warnings (expected if random heuristic didn't fire).")

        else:
            print("No exams found to start.")

        browser.close()
        print("Test Finished.")

if __name__ == "__main__":
    run_test()
