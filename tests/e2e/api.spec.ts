import { test, expect } from '@playwright/test'

test.describe('KM-Portal E2E', () => {
  test('health check via API', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('KM-Portal')
  })

  test('home page loads (SPA index.html)', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBeLessThan(500)
    await expect(page).toHaveTitle(/KM-Portal|知识库|Vite|React/i)
  })

  test('list skills via API', async ({ request }) => {
    const res = await request.get('/api/skill')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('create + delete skill via API', async ({ request }) => {
    const create = await request.post('/api/skill', {
      data: {
        name: 'E2E Test Skill',
        description: 'Playwright test',
        kbId: 1,
        kbName: 'E2EKB',
        permission: 'read',
      },
    })
    expect(create.status()).toBe(200)
    const created = await create.json()
    expect(created.success).toBe(true)
    expect(created.data.id).toBeDefined()

    const del = await request.delete(`/api/skill/${created.data.id}`)
    expect(del.status()).toBe(200)
  })

  test('list tokens via API', async ({ request }) => {
    const res = await request.get('/api/admin/tokens')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('stats overview via API', async ({ request }) => {
    const res = await request.get('/api/stats/overview')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })
})
