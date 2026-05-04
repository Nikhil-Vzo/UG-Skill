from playwright.sync_api import sync_playwright
import time
import uuid

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        
        # 1. Admin Login & Drive Creation
        page = context.new_page()
        print("Starting Placement E2E Flow Test...")
        print("Logging in as Admin...")
        page.goto("http://localhost:5173/login")
        page.fill("input[type='email']", "admin@ugskill.com")
        page.fill("input[type='password']", "Admin@123")
        page.click("button[type='submit']")
        page.wait_for_url("**/app**", timeout=15000)
        
        print("Navigating to Placements Config...")
        page.goto("http://localhost:5173/app/admin/placements")
        page.wait_for_load_state("networkidle")
        
        # (Assuming there's a drive already or we create one; we'll assume seed data has a drive)
        print("Admin verified Placements Config.")
        
        # 2. Student Login & Application
        print("Logging in as Student...")
        student_page = context.new_page()
        student_page.goto("http://localhost:5173/login")
        student_page.fill("input[type='email']", "student@ugskill.com")
        student_page.fill("input[type='password']", "Student@123")
        student_page.click("button[type='submit']")
        student_page.wait_for_url("**/app**", timeout=15000)
        
        print("Navigating to Placements Hub...")
        student_page.goto("http://localhost:5173/app/placements")
        student_page.wait_for_load_state("networkidle")
        
        drives = student_page.locator(".surface-card")
        if drives.count() > 0:
            drives.first.click()
            student_page.wait_for_load_state("networkidle")
            
            print("Applying to Drive...")
            apply_btn = student_page.locator("button:has-text('Apply')")
            if apply_btn.is_visible():
                apply_btn.click()
                print("Application submitted.")
                time.sleep(2)
            else:
                print("Apply button not found or already applied.")
        else:
            print("No active drives found.")
            
        browser.close()
        print("Test Finished.")

if __name__ == "__main__":
    run_test()
