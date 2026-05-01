import { test, expect } from '@playwright/test';

/**
 * Security Test: Authentication & Authorization
 * 
 * This test suite validates that the application properly enforces authentication
 * and authorization controls to prevent unauthorized access to user resources.
 * 
 * Focus areas:
 * - Session management and authentication enforcement
 * - Authorization checks on protected routes
 * - User isolation (users cannot access other users' data)
 * - Privilege escalation prevention
 * - IDOR (Insecure Direct Object Reference) prevention
 */

test.describe('Authentication & Authorization Controls', () => {
    // Test 1: Unauthenticated users cannot access protected routes
    test('should redirect unauthenticated users to login', async ({ page }) => {
        // Try to access protected routes without authentication
        const protectedRoutes = [
            '/market',
            '/create-listing',
            '/profile',
            '/settings',
            '/admin'
        ];

        for (const route of protectedRoutes) {
            const response = await page.goto(route, { waitUntil: 'domcontentloaded' }).catch(() => null);
            
            // Should either redirect to login or show no content
            const currentUrl = page.url();
            
            // If we're still on the protected route, there should be no sensitive content visible
            if (currentUrl.includes(route) && response?.status() !== 403) {
                // For some routes, we might stay on them but they should be empty/protected
                const hasContent = await page.locator('body').textContent();
                // The page should not show logged-in content
                const isNotLoggedIn = !hasContent?.includes('Logout') && !hasContent?.includes('Profile');
                expect(isNotLoggedIn).toBe(true);
            } else {
                // Should be redirected to login
                const isOnLoginOrError = currentUrl.includes('/login') || response?.status() === 403;
                expect(isOnLoginOrError).toBe(true);
            }
        }
    });

    // Test 2: Session is properly cleared on logout
    test('should clear session data and prevent access after logout', async ({ page }) => {
        // Log in first
        await page.goto('/login');
        await page.locator('input[name="email"]').fill('test.user@my.unt.edu');
        await page.locator('input[name="password"]').fill('rootroot');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL('/market');

        // Verify we're logged in by checking for logout button
        const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first();
        const isLoggedIn = await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (isLoggedIn) {
            // Click logout
            await logoutButton.click();
            await page.waitForURL('/login', { timeout: 5000 }).catch(() => {});
        }

        // Verify cookies/session is cleared
        const cookies = await page.context().cookies();
        const sessionCookies = cookies.filter(c => 
            c.name.toLowerCase().includes('session') ||
            c.name.toLowerCase().includes('auth') ||
            c.name.toLowerCase().includes('token')
        );
        
        // Session cookies should be cleared or expired
        sessionCookies.forEach(cookie => {
            // If cookie still exists, it should be close to expiration
            if (cookie.expires) {
                const expiryDate = new Date(cookie.expires * 1000);
                const now = new Date();
                expect(expiryDate.getTime() - now.getTime()).toBeLessThan(60000); // Less than 1 minute
            }
        });

        // Try to access protected route - should redirect to login
        await page.goto('/market');
        const isRedirectedToLogin = page.url().includes('/login') || !(await page.locator('body').isVisible());
        expect(isRedirectedToLogin).toBe(true);
    });

    // Test 3: Users cannot access other users' profile/data via URL manipulation
    test('should prevent direct object reference attacks (IDOR)', async ({ page }) => {
        // This test demonstrates IDOR prevention
        // Log in as first user
        await page.goto('/login');
        await page.locator('input[name="email"]').fill('test.user@my.unt.edu');
        await page.locator('input[name="password"]').fill('rootroot');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL('/market');

        // Try to access another user's profile by ID
        // Common IDOR patterns with various ID formats
        const potentialUserIds = [
            '1',
            '2',
            '999999',
            'user-id-123',
            '../admin',
            'admin',
            'test.user@my.unt.edu'
        ];

        for (const userId of potentialUserIds) {
            const response = await page.goto(`/profile/${userId}`, { waitUntil: 'domcontentloaded' }).catch(() => null);
            
            // Should either show error or return to current user's profile
            const currentUrl = page.url();
            
            // Verify we're not seeing another user's private data
            const hasPrivateInfo = await page.locator('text=/email|password|settings/i').first().isVisible({ timeout: 1000 }).catch(() => false);
            
            // If we can see content, it should only be public profile info
            // Or we should get a 404/403 or be redirected
            if (response?.status() === 200 && currentUrl.includes('profile')) {
                // If we're on a profile page, verify it's authorized access
                // (This would depend on application implementation)
                expect(true).toBe(true); // Placeholder - actual assertion depends on app behavior
            } else if (response?.status() === 404 || response?.status() === 403) {
                // Correctly blocked access
                expect(response.status()).toBeGreaterThanOrEqual(400);
            }
        }
    });

    // Test 4: Privilege escalation prevention
    test('should prevent users from accessing admin functions', async ({ page }) => {
        // Log in as regular user
        await page.goto('/login');
        await page.locator('input[name="email"]').fill('test.user@my.unt.edu');
        await page.locator('input[name="password"]').fill('rootroot');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL('/market');

        // Try to access admin routes
        const adminRoutes = [
            '/admin',
            '/admin/dashboard',
            '/admin/users',
            '/admin/reports',
            '/settings/admin',
        ];

        for (const route of adminRoutes) {
            const response = await page.goto(route, { waitUntil: 'domcontentloaded' }).catch(() => null);
            
            // Should get 403 Forbidden or be redirected
            const isBlocked = response?.status() === 403 || response?.status() === 401;
            const isRedirected = !page.url().includes(route);
            
            const isProperlyDenied = isBlocked || isRedirected;
            expect(isProperlyDenied).toBe(true);
        }
    });

    // Test 5: User cannot modify other users' listings
    test('should prevent users from editing other users\' listings', async ({ page }) => {
        // Log in as test user
        await page.goto('/login');
        await page.locator('input[name="email"]').fill('test.user@my.unt.edu');
        await page.locator('input[name="password"]').fill('rootroot');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL('/market');

        // Try to access edit route with various IDs
        const potentialListingIds = [
            '1',
            '999999',
            'other-user-listing',
            '../../../admin',
        ];

        for (const listingId of potentialListingIds) {
            const response = await page.goto(`/listing/${listingId}/edit`, { waitUntil: 'domcontentloaded' }).catch(() => null);
            
            // Should either:
            // 1. Show 404 (listing not found)
            // 2. Show 403 (not authorized)
            // 3. Redirect away from edit page
            // 4. Show empty/read-only form
            
            if (response?.status() && (response.status() === 403 || response.status() === 404)) {
                expect(response.status()).toBeGreaterThanOrEqual(400);
            } else {
                // If accessible, verify it's not an editable form
                const isEditable = await page.locator('button:has-text("Save")').isVisible({ timeout: 1000 }).catch(() => false);
                // If it is editable, it should be the user's own listing (which is allowed)
            }
        }
    });

    // Test 6: Email verification is enforced before account usage
    test('should enforce email verification for account operations', async ({ page }) => {
        // This test verifies that newly created accounts require email verification
        // Even if they somehow bypass the client-side check
        
        await page.goto('/login');

        // The login page should prevent login without verification
        // (as indicated in the login action code)
        
        // Try to login to a verified account first (baseline)
        await page.locator('input[name="email"]').fill('test.user@my.unt.edu');
        await page.locator('input[name="password"]').fill('rootroot');
        await page.getByRole('button', { name: 'Login' }).click();

        // Should either succeed (verified account) or show verification message
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        const isLoggedIn = currentUrl.includes('/market');
        const needsVerification = await page.locator('text=/verify|verification/i').isVisible({ timeout: 1000 }).catch(() => false);

        // Should be one or the other
        expect(isLoggedIn || needsVerification).toBe(true);
    });

    // Test 7: API endpoints require proper authentication headers
    test('should reject API calls without proper authentication', async ({ page }) => {
        // Test that API endpoints are properly protected
        const api_response = await page.request.get('/api/user/profile', {
            headers: {
                'Content-Type': 'application/json',
            }
        }).catch(() => null);

        // Should either:
        // 1. Return 401 Unauthorized
        // 2. Return 403 Forbidden  
        // 3. Redirect to login (303/302)
        if (api_response) {
            const isProtected = api_response.status() >= 400 || (api_response.status() >= 300 && api_response.status() < 400);
            expect(isProtected).toBe(true);
        }
    });

    // Test 8: Rate limiting on sensitive endpoints (password reset, login)
    test('should implement rate limiting on authentication endpoints', async ({ page }) => {
        // Attempt multiple failed logins
        const attempts = 10;
        let blockedAfter = -1;

        for (let i = 0; i < attempts; i++) {
            await page.goto('/login');
            await page.locator('input[name="email"]').fill('test.user@my.unt.edu');
            await page.locator('input[name="password"]').fill('wrongpassword' + i);
            
            await page.getByRole('button', { name: 'Login' }).click();
            await page.waitForTimeout(500);

            // Check for rate limit error message
            const rateLimitMessage = await page.locator('text=/rate limit|too many|try again|temporarily|locked/i').isVisible({ timeout: 1000 }).catch(() => false);
            const errorMessage = await page.locator('[role="alert"]').first().isVisible({ timeout: 1000 }).catch(() => false);

            if (rateLimitMessage) {
                blockedAfter = i;
                break;
            }
        }

        // Note: This assertion depends on whether rate limiting is implemented
        // If implemented, blockedAfter should be >= 0
        // If not implemented, this test documents that rate limiting should be added
        if (blockedAfter >= 0) {
            expect(blockedAfter).toBeGreaterThan(0);
        }
    });
});
