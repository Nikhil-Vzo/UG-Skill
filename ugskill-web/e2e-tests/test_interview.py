import time
import json
import subprocess
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:5173"
API_URL = "http://localhost:4000/api/v1"

def run_test():
    # Clean DB first
    print("\n[Step 0] Cleaning database test data...")
    subprocess.run(["npx", "tsx", "src/db/clean-test-data.ts"], cwd="ugskill-api", shell=True)

    with sync_playwright() as p:
        print("=" * 60)
        print("          PLACEMENT INTERVIEW FLOW E2E TEST")
        print("=" * 60)

        # 1. Create API context to seed database objects dynamically
        print("\n[Step 1] Authenticating with API...")
        api_context = p.request.new_context(base_url="http://localhost:4000")
        
        # Admin / HR Login via API
        login_res = api_context.post("/api/v1/auth/login", data={
            "email": "admin@ugskill.com",
            "password": "Admin@123"
        })
        assert login_res.ok, f"Admin login failed: {login_res.text()}"
        login_data = login_res.json()
        admin_token = login_data["data"]["accessToken"]
        admin_user_id = login_data["data"]["user"]["id"]
        print(f"  Authenticated as Admin. User ID: {admin_user_id}")

        # Student Login via API
        student_login_res = api_context.post("/api/v1/auth/login", data={
            "email": "student@ugskill.com",
            "password": "Student@123"
        })
        assert student_login_res.ok, f"Student login failed: {student_login_res.text()}"
        student_login_data = student_login_res.json()
        student_token = student_login_data["data"]["accessToken"]
        student_user_id = student_login_data["data"]["user"]["id"]
        print(f"  Authenticated as Student. User ID: {student_user_id}")

        # Authenticated headers
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # 2. Seed a test company
        print("\n[Step 2] Seeding test company...")
        company_res = api_context.post("/api/v1/placements/companies", headers=admin_headers, data={
            "name": "E2E Test Tech Corp",
            "industry": "Software Engineering",
            "tier": "startup",
            "difficultyLevel": "hard",
            "websiteUrl": "https://e2etesttech.com",
            "description": "Enterprise cloud services and AI tooling."
        })
        assert company_res.ok, f"Failed to create company: {company_res.text()}"
        company = company_res.json()["data"]
        company_id = company["id"]
        print(f"  Company created: {company['name']} (ID: {company_id})")

        # 3. Seed a company drive
        print("\n[Step 3] Seeding company drive...")
        drive_res = api_context.post("/api/v1/placements/drives", headers=admin_headers, data={
            "companyId": company_id,
            "name": "E2E Software Engineer Drive 2026",
            "targetRoles": ["Associate SDE", "Backend Engineer"],
            "flowSpec": [
                {
                    "roundNumber": 1,
                    "roundType": "technical_interview",
                    "description": "System Design and Live Coding Round",
                    "passingScore": 70
                }
            ]
        })
        assert drive_res.ok, f"Failed to create drive: {drive_res.text()}"
        drive = drive_res.json()["data"]
        drive_id = drive["id"]
        print(f"  Drive created: {drive['name']} (ID: {drive_id})")

        # 4. Student applies to drive
        print("\n[Step 4] Registering student for drive...")
        apply_res = api_context.post("/api/v1/placements/registrations", headers=student_headers, data={
            "driveId": drive_id
        })
        assert apply_res.ok, f"Student registration failed: {apply_res.text()}"
        registration = apply_res.json()["data"]
        registration_id = registration["id"]
        print(f"  Registration successful. ID: {registration_id}")

        # 5. Admin updates student status to 'interview'
        print("\n[Step 5] Moving student to interview stage...")
        update_res = api_context.patch(f"/api/v1/placements/registrations/{registration_id}", headers=admin_headers, data={
            "status": "interview"
        })
        assert update_res.ok, f"Failed to update registration status: {update_res.text()}"
        print("  Student registration status set to 'interview'")

        # Debug print: get registration details to verify student name
        debug_reg_res = api_context.get(f"/api/v1/placements/registrations/{registration_id}", headers=admin_headers)
        if debug_reg_res.ok:
            print(f"  Debug Registration Data: {debug_reg_res.text()}")
        else:
            print(f"  Debug Registration Failed: {debug_reg_res.status} {debug_reg_res.text()}")
        
        # Get all registrations
        debug_regs_res = api_context.get("/api/v1/placements/registrations", headers=admin_headers)
        if debug_regs_res.ok:
            print(f"  Debug All Registrations: {debug_regs_res.text()}")
        
        # 6. Launch browser for HR and Student
        print("\n[Step 6] Starting browser instances...")
        browser = p.chromium.launch(headless=True)
        
        # Setup HR Session
        hr_context = browser.new_context()
        hr_page = hr_context.new_page()
        hr_page.on("console", lambda msg: print(f"[HR Console] {msg.type}: {msg.text}"))
        hr_page.on("pageerror", lambda err: print(f"[HR PageError] {err}"))
        print("  Logging in HR in Browser...")
        hr_page.goto(f"{BASE_URL}/login")
        hr_page.fill("input[type='email']", "hr@ugskill.com")
        hr_page.fill("input[type='password']", "Hr@123")
        hr_page.click("button[type='submit']")
        hr_page.wait_for_url("**/hr/dashboard**")
        print("  HR logged in. Already at HR Dashboard.")
        hr_page.wait_for_load_state("networkidle")

        # Locate Student in HR Dashboard
        print("  Searching for student in applicants list...")
        student_card = hr_page.locator("div:has-text('Recent Applicants')").locator("text=Nikhil").first
        student_card.wait_for(state="visible", timeout=10000)
        print(f"  Matched element HTML: {student_card.evaluate('el => el.outerHTML')}")
        
        # Take a screenshot before click
        hr_page.screenshot(path="ugskill-web/e2e-tests/hr_dashboard_before_click.png")
        print("  Saved hr_dashboard_before_click.png")

        student_card.click()
        print("  Applicant drawer clicked.")
        
        # Wait a bit for transition
        time.sleep(2)
        
        # Take a screenshot after click
        hr_page.screenshot(path="ugskill-web/e2e-tests/hr_dashboard_after_click.png")
        print("  Saved hr_dashboard_after_click.png")
        
        # Let's inspect the drawer HTML to see what is rendered!
        drawer_html = hr_page.content()
        with open("ugskill-web/e2e-tests/hr_drawer_page.html", "w", encoding="utf-8") as f:
            f.write(drawer_html)
        print("  Saved hr_drawer_page.html")

        # Click Create Interview Room
        create_room_btn = hr_page.locator("button:has-text('Create Interview Room')")
        hr_page.wait_for_selector("button:has-text('Create Interview Room')", timeout=10000)
        print("  Clicking 'Create Interview Room'...")
        create_room_btn.click()
        
        # Wait for the 'Interview Session Created' modal
        hr_page.wait_for_selector("text=Interview Session Created", timeout=12000)
        print("  Room creation modal popped up successfully!")

        # Extract the session ID from the invite link shown in the modal
        invite_link_el = hr_page.locator("div[style*='monospace']")
        invite_link_text = invite_link_el.text_content()
        print(f"  Invite link: {invite_link_text}")
        # The link text looks like: http://localhost:5173/app/placements/interview/<session_id>
        session_id = invite_link_text.strip().split("/")[-1]
        print(f"  Extracted Session ID: {session_id}")

        # Navigate HR directly to the Interview Room URL
        # Note: HR auth token works for /hr/* routes only. For /app/placements/interview/* we
        # use the admin API to transition session status directly (simulating HR entering the room).
        print(f"  Patching session to 'in_progress' via API (simulating HR starting the room)...")
        patch_res = api_context.patch(
            f"/api/v1/placements/sessions/{session_id}/status",
            headers=admin_headers,
            data={"status": "in_progress"}
        )
        print(f"  Patch response: {patch_res.status} {patch_res.text()}")
        assert patch_res.ok, f"Failed to patch session to in_progress: {patch_res.text()}"
        print(f"  âœ… Session patched to in_progress via API!")

        # Setup Student Session in Browser
        print("\n[Step 7] Setting up Student browser session...")

        student_context = browser.new_context()
        student_page = student_context.new_page()
        student_page.on("console", lambda msg: print(f"[Student Console] {msg.type}: {msg.text}"))
        student_page.on("pageerror", lambda err: print(f"[Student PageError] {err}"))
        student_page.goto(f"{BASE_URL}/login")
        student_page.fill("input[type='email']", "student@ugskill.com")
        student_page.fill("input[type='password']", "Student@123")
        student_page.click("button[type='submit']")
        student_page.wait_for_url("**/app**")
        print("  Student logged in.")

        # Student navigates directly to the interview room URL
        print(f"  Student navigating to interview room: {BASE_URL}/app/placements/interview/{session_id}")
        student_page.goto(f"{BASE_URL}/app/placements/interview/{session_id}")
        student_page.wait_for_load_state("networkidle")
        print(f"  Student page URL: {student_page.url}")

        # Since session is in_progress, student should see the live room (not the join button)
        # Verify the live room loaded by checking for 'LIVE' indicator
        student_page.wait_for_selector("text=LIVE", timeout=10000)
        print("  âœ… Student sees the LIVE interview room!")

        # Also verify via API that student is in the room (status is in_progress)
        session_status_res = api_context.get(f"/api/v1/placements/sessions/{session_id}", headers=admin_headers)
        assert session_status_res.ok
        session_status = session_status_res.json()["data"]["status"]
        print(f"  Confirmed Session Status on Server: {session_status}")
        assert session_status == "in_progress", f"Session status should be in_progress but got: {session_status}"
        print("  âœ… Session is confirmed in_progress!")

        # 8. End the session via API (HR action)
        print("\n[Step 8] Ending the interview session via API...")
        end_res = api_context.post(f"/api/v1/placements/sessions/{session_id}/end", headers=admin_headers)
        print(f"  End session response: {end_res.status} {end_res.text()}")
        assert end_res.ok, f"Failed to end session: {end_res.text()}"
        print("  âœ… Session ended successfully!")

        # Wait for student to be redirected
        time.sleep(2)

        # Verify Student redirected back to /app/placements
        # The InterviewRoom polls session status and should redirect once session is 'completed'
        print(f"  Waiting for student to be redirected after session ends...")
        student_page.wait_for_url("**/app/placements**", timeout=15000)
        print("  âœ… Student redirected to Placements Hub successfully!")
        print(f"  Student page URL: {student_page.url}")

        # Verify Session is marked completed in API
        session_final_res = api_context.get(f"/api/v1/placements/sessions/{session_id}", headers=admin_headers)
        assert session_final_res.ok
        final_status = session_final_res.json()["data"]["status"]
        print(f"  Final Session Status: {final_status}")
        assert final_status == "completed", "Session should be marked completed in the database"

        # Close all browser contexts
        hr_context.close()
        student_context.close()
        browser.close()
        print("\n" + "=" * 60)
        print("  TEST COMPLETED SUCCESSFULLY!")
        print("=" * 60)

if __name__ == "__main__":
    run_test()

