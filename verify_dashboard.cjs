const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set mock session in localStorage
  const session = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'mock-user-id',
      email: 'deepakbhaskarank01@gmail.com', // Admin for full dashboard access
      role: 'authenticated',
      aud: 'authenticated'
    }
  };

  await page.goto('http://localhost:3000');

  await page.evaluate((session) => {
    localStorage.setItem('sb-lqibglpbquybvsrywyhm-auth-token', JSON.stringify(session));
    localStorage.setItem('psc-mcq-questions', JSON.stringify([
        {
            id: '1',
            level: 'Degree',
            name: 'Secretariat Assistant 2023',
            question: 'What is the capital of France?',
            options: ['Paris', 'London', 'Berlin', 'Madrid'],
            correct_answer_index: 0,
            created_at: new Date().toISOString()
        }
    ]));
  }, session);

  // Reload to apply localStorage
  await page.reload();

  // Wait for dashboard to load
  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/home/jules/verification/dashboard_admin.png', fullPage: true });

  // Change to User role via UI toggle if possible
  const adminModeBtn = await page.getByText('Admin Mode');
  if (await adminModeBtn.isVisible()) {
      await adminModeBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/home/jules/verification/dashboard_user.png', fullPage: true });
  }

  // Go to Exams tab
  const examsBtn = await page.getByText('Exams');
  if (await examsBtn.isVisible()) {
      await examsBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/home/jules/verification/exam_library.png', fullPage: true });
  }

  await browser.close();
})();
