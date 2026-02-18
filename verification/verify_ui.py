import asyncio
from playwright.async_api import async_playwright
import os
import json

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        await page.goto('http://localhost:3002')

        mock_questions = [
            {
                "id": "q1",
                "question": "Which Article of the Constitution deals with the fundamental rights of Indian citizens?",
                "options": ["Article 12-35", "Article 36-51", "Article 51A", "Article 370"],
                "correct_answer_index": 0,
                "level": "Degree",
                "name": "Constitutional Law Set 4",
                "subtopic": "Indian Constitution",
                "explanation": "Part III of the Constitution (Articles 12 to 35) specifically deals with Fundamental Rights.",
                "created_at": "2024-01-01T00:00:00.000Z"
            },
            {
                "id": "q2",
                "question": "Who founded the 'Sahodara Sangham' in 1917 at Cherai?",
                "options": ["Sahodaran K. Ayyappan", "C. Kesavan", "T.K. Madhavan", "K. Kelappan"],
                "correct_answer_index": 0,
                "level": "Topic",
                "name": "Kerala Renaissance Mock",
                "subtopic": "History (Kerala)",
                "explanation": "Sahodaran K. Ayyappan founded the Sahodara Sangham in 1917 to advocate for inter-caste dining.",
                "created_at": "2024-01-02T00:00:00.000Z"
            }
        ]

        await page.evaluate("arg => { localStorage.setItem('demo_mode', 'true'); localStorage.setItem(arg.key, arg.val); }", {"key": "psc-mcq-questions", "val": json.dumps(mock_questions)})
        await page.reload()
        await page.wait_for_timeout(3000)

        # 1. Admin Dashboard (Control Center)
        await page.screenshot(path='/home/jules/verification/admin_dashboard.png', full_page=True)
        print("Captured admin_dashboard.png")

        # 2. Metadata Management
        try:
            # Click the Metadata Management card
            await page.get_by_text("Metadata Management", exact=True).click(timeout=5000)
            await page.wait_for_timeout(1000)
            await page.screenshot(path='/home/jules/verification/metadata_management.png', full_page=True)
            print("Captured metadata_management.png")

            # Go back to dashboard using Sidebar
            await page.get_by_role("button", name="Dashboard").click()
            await page.wait_for_timeout(500)
        except Exception as e:
            print(f"Error navigating to Metadata Management: {e}")

        # 3. AI Question Creator
        try:
            # Click the AI Question Creator card
            await page.get_by_text("AI Question Creator", exact=True).click(timeout=5000)
            await page.wait_for_timeout(1000)
            await page.screenshot(path='/home/jules/verification/ai_question_creator.png', full_page=True)
            print("Captured ai_question_creator.png")
        except Exception as e:
            print(f"Error navigating to AI Question Creator: {e}")

        # Toggle to User Role via Sidebar
        try:
            await page.get_by_text("Admin Mode").click()
            await page.wait_for_timeout(1000)
        except Exception as e:
            print(f"Error toggling role: {e}")

        # 4. Student Dashboard
        await page.screenshot(path='/home/jules/verification/student_dashboard.png', full_page=True)
        print("Captured student_dashboard.png")

        # 5. Exam Library
        try:
            await page.get_by_role("button", name="Exams").click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path='/home/jules/verification/exam_library.png', full_page=True)
            print("Captured exam_library.png")
        except Exception as e:
            print(f"Error navigating to Exams: {e}")

        # 6. Test Mode (Quiz)
        try:
            # We expect a "Degree Level" exam to be present in the library
            test_mode_btn = page.get_by_role("button", name="Test Mode").first
            if await test_mode_btn.is_visible():
                await test_mode_btn.click()
                await page.wait_for_timeout(2000) # Give more time to load quiz
                await page.screenshot(path='/home/jules/verification/test_mode.png', full_page=True)
                print("Captured test_mode.png")

                # 7. Answer a question
                await page.wait_for_selector("label", timeout=5000)
                await page.locator("label").first.click()
                await page.wait_for_timeout(500)
                await page.screenshot(path='/home/jules/verification/quiz_answered.png', full_page=True)
                print("Captured quiz_answered.png")

                # Finish test to see Result Page
                finish_btn = page.get_by_role("button", name="Finish Test").first
                if await finish_btn.is_visible():
                    await finish_btn.click()
                    await page.wait_for_timeout(2000)
                    await page.screenshot(path='/home/jules/verification/result_page.png', full_page=True)
                    print("Captured result_page.png")

                # Go back to Dashboard from ScoreScreen first to avoid z-index interception
                await page.get_by_text("Back to Dashboard").click()
                await page.wait_for_timeout(1000)

                # Now go back to Exams for Practice mode
                await page.get_by_role("button", name="Exams").click()
                await page.wait_for_timeout(1000)
            else:
                print("Test Mode button not found")
        except Exception as e:
            print(f"Error in Quiz flow: {e}")

        # 8. Practice Mode
        try:
            # Practice Mode buttons should be visible on the exam card
            practice_btn = page.get_by_role("button", name="Practice").first
            if await practice_btn.is_visible():
                await practice_btn.click()
                await page.wait_for_timeout(2000)
                await page.screenshot(path='/home/jules/verification/practice_mode.png', full_page=True)
                print("Captured practice_mode.png")

                # Answer to see AI Insight
                await page.wait_for_selector("label", timeout=5000)
                await page.locator("label").first.click()
                await page.wait_for_timeout(1000)
                await page.screenshot(path='/home/jules/verification/ai_insight.png', full_page=True)
                print("Captured ai_insight.png")
            else:
                print("Practice button not found")
                # Take a screenshot to see where we are
                await page.screenshot(path='/home/jules/verification/debug_practice_not_found.png')
        except Exception as e:
            print(f"Error in Practice flow: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
