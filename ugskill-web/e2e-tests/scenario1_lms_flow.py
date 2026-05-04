from playwright.sync_api import sync_playwright
import time
import uuid

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Starting LMS E2E Flow Test...")
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"teststudent_{unique_id}@ugskill.com"
        
        # 1. Register new student
        print("Registering new student...")
        page.goto("http://localhost:5173/signup")
        page.fill("input[placeholder='Full Name']", f"Test Student {unique_id}")
        page.fill("input[type='email']", test_email)
        page.fill("input[type='password']", "Test@1234")
        page.click("button[type='submit']")
        
        page.wait_for_url("**/app**", timeout=15000)
        print("Registration and Login Successful.")

        # 2. Discover Course
        print("Navigating to Discover...")
        page.goto("http://localhost:5173/app/discover")
        page.wait_for_load_state("networkidle")
        
        # Click on the first course card to view details
        course_cards = page.locator(".surface-card")
        if course_cards.count() > 0:
            course_cards.first.click()
            page.wait_for_load_state("networkidle")
            
            # 3. Enroll
            print("Enrolling in Course...")
            enroll_btn = page.locator("button:has-text('Enroll')")
            if enroll_btn.is_visible():
                enroll_btn.click()
                print("Enrollment clicked.")
                time.sleep(2)
            
            # 4. Watch Lecture / Go to Player
            print("Navigating to Video Player...")
            start_learning_btn = page.locator("button:has-text('Start Learning'), button:has-text('Continue')")
            if start_learning_btn.is_visible():
                start_learning_btn.click()
                page.wait_for_url("**/player**", timeout=15000)
                print("In Video Player.")
                
                # Mark Complete
                mark_complete_btn = page.locator("button:has-text('Mark Complete')")
                if mark_complete_btn.is_visible():
                    mark_complete_btn.click()
                    print("Lecture marked complete.")
                    time.sleep(2)
            else:
                print("No start learning button found.")
        else:
            print("No courses found in Discover.")

        # 5. Dashboard Progress Verification
        print("Checking Dashboard for Progress...")
        page.goto("http://localhost:5173/app")
        page.wait_for_load_state("networkidle")
        
        progress_text = page.locator("text=Progress").first
        if progress_text.is_visible():
            print("Progress indicator found on Dashboard.")

        browser.close()
        print("Test Finished.")

if __name__ == "__main__":
    run_test()
