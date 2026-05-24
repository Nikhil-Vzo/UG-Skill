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
        page.fill("input[placeholder='Jane Doe']", f"Test Student {unique_id}")
        page.fill("input[type='email']", test_email)
        page.fill("input[type='password']", "Test@1234")
        page.click("button[type='submit']")
        
        page.wait_for_url("**/app**", timeout=15000)
        print("Registration and Login Successful.")

        # 2. Discover Course
        print("Navigating to Discover...")
        page.goto("http://localhost:5173/app/discover")
        page.wait_for_load_state("networkidle")
        
        # Click on the course card with lectures to view details
        course_card = page.locator(".discover-course-card, .discover-featured-card, .surface-card").filter(has_text="Full Stack Web Development").first
        if course_card.is_visible():
            print("Found Full Stack Web Development course card.")
            course_card.click()
            page.wait_for_load_state("networkidle")
            print(f"Current page URL: {page.url}")
            
            # 3. Enroll / Continue learning
            print("Enrolling or starting the course...")
            action_btn = page.locator("button:has-text('Enroll'), button:has-text('Continue'), button:has-text('Start Learning')").first
            action_btn.wait_for(state="visible", timeout=10000)
            action_btn.click()
            print("Enrollment/Continue clicked.")
            time.sleep(2)
            
            # 4. Watch Lecture / Go to Player
            print("Waiting for Video Player...")
            try:
                page.wait_for_url("**/player**", timeout=15000)
                print("In Video Player.")
                
                # Mark Complete
                mark_complete_btn = page.locator("button:has-text('Mark Complete')").first
                mark_complete_btn.wait_for(state="visible", timeout=10000)
                if mark_complete_btn.is_visible():
                    mark_complete_btn.click()
                    print("Lecture marked complete.")
                    time.sleep(2)
                else:
                    print("Mark Complete button not visible.")
            except Exception as e:
                print(f"Could not reach video player or mark complete: {e}")
                page.screenshot(path="c:/Users/nikhi/Downloads/ugskill/screenshots/player_error.png")
                print("Page URL on error:", page.url)
                print("HTML content excerpt on error:", page.content()[:1000])
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
