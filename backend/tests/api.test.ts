import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { app } from '../src/app.js'

describe('Backend Foundation API Tests', () => {
  describe('GET /api/health', () => {
    it('should return 200 with healthy status and metadata', async () => {
      const res = await request(app).get('/api/health')

      assert.equal(res.status, 200)
      assert.equal(res.body.status, 'healthy')
      assert.equal(typeof res.body.uptimeSeconds, 'number')
      assert.equal(typeof res.body.demoMode, 'boolean')
      assert.ok(Array.isArray(res.body.supportedVerticals))
      assert.ok(res.body.supportedVerticals.includes('all'))
      assert.ok(res.body.supportedVerticals.includes('images'))
      assert.ok(res.body.supportedVerticals.includes('news'))
    })

    it('should include privacy security headers in response', async () => {
      const res = await request(app).get('/api/health')
      assert.equal(res.headers['x-content-type-options'], 'nosniff')
      assert.equal(res.headers['x-frame-options'], 'DENY')
      assert.equal(res.headers['referrer-policy'], 'no-referrer')
    })
  })

  describe('GET /api/search validation', () => {
    it('should reject missing query with 400', async () => {
      const res = await request(app).get('/api/search')

      assert.equal(res.status, 400)
      assert.equal(res.body.error, true)
      assert.equal(res.body.code, 'INVALID_QUERY')
      assert.ok(res.body.message.toLowerCase().includes('query parameter'))
    })

    it('should reject empty or whitespace query with 400', async () => {
      const res = await request(app).get('/api/search?q=   ')

      assert.equal(res.status, 400)
      assert.equal(res.body.error, true)
      assert.equal(res.body.code, 'INVALID_QUERY')
    })

    it('should reject excessively long queries with 400', async () => {
      const longQuery = 'a'.repeat(501)
      const res = await request(app).get(`/api/search?q=${longQuery}`)

      assert.equal(res.status, 400)
      assert.equal(res.body.error, true)
      assert.equal(res.body.code, 'INVALID_QUERY')
      assert.ok(res.body.message.includes('maximum allowed length'))
    })

    it('should reject unsupported vertical with 400', async () => {
      const res = await request(app).get('/api/search?q=privacy&v=crypto')

      assert.equal(res.status, 400)
      assert.equal(res.body.error, true)
      assert.equal(res.body.code, 'INVALID_VERTICAL')
      assert.ok(res.body.message.includes('Unsupported vertical'))
    })
  })

  describe('GET /api/search verticals (Demo Mode)', () => {
    it('should return valid Web (All) results explicitly marked as demo', async () => {
      const res = await request(app).get('/api/search?q=open%20source&v=all')

      assert.equal(res.status, 200)
      assert.equal(res.body.query, 'open source')
      assert.equal(res.body.vertical, 'all')
      assert.equal(res.body.isDemo, true)
      assert.equal(res.body.provider, 'mock-index')
      assert.equal(res.body.metadata.isIndexedData, false)
      assert.ok(Array.isArray(res.body.results))
      assert.ok(res.body.results.length > 0)
      assert.ok(Array.isArray(res.body.discussions))
      assert.ok(Array.isArray(res.body.relatedSearches))
    })

    it('should default to "all" vertical when v parameter is omitted', async () => {
      const res = await request(app).get('/api/search?q=linux')

      assert.equal(res.status, 200)
      assert.equal(res.body.vertical, 'all')
      assert.equal(res.body.isDemo, true)
    })

    it('should return valid Image results with dimensions', async () => {
      const res = await request(app).get('/api/search?q=design&v=images')

      assert.equal(res.status, 200)
      assert.equal(res.body.vertical, 'images')
      assert.equal(res.body.isDemo, true)
      assert.ok(res.body.results.length > 0)
      assert.ok(res.body.results[0].imageUrl)
      assert.ok(res.body.results[0].width)
    })

    it('should return valid Video results with durations', async () => {
      const res = await request(app).get('/api/search?q=tutorials&v=videos')

      assert.equal(res.status, 200)
      assert.equal(res.body.vertical, 'videos')
      assert.equal(res.body.isDemo, true)
      assert.ok(res.body.results.length > 0)
      assert.ok(res.body.results[0].duration)
    })

    it('should return valid News results with publishers', async () => {
      const res = await request(app).get('/api/search?q=technology&v=news')

      assert.equal(res.status, 200)
      assert.equal(res.body.vertical, 'news')
      assert.equal(res.body.isDemo, true)
      assert.ok(res.body.results.length > 0)
      assert.ok(res.body.results[0].publisher)
    })

    it('should return valid Maps results with address and status', async () => {
      const res = await request(app).get('/api/search?q=coworking&v=maps')

      assert.equal(res.status, 200)
      assert.equal(res.body.vertical, 'maps')
      assert.equal(res.body.isDemo, true)
      assert.ok(res.body.results.length > 0)
      assert.ok(res.body.results[0].address)
      assert.ok(res.body.results[0].openingStatus)
    })

    it('should return valid Shopping results with price and availability', async () => {
      const res = await request(app).get('/api/search?q=hardware&v=shopping')

      assert.equal(res.status, 200)
      assert.equal(res.body.vertical, 'shopping')
      assert.equal(res.body.isDemo, true)
      assert.ok(res.body.results.length > 0)
      assert.ok(res.body.results[0].price)
    })

    it('should return valid Books results with author and cover', async () => {
      const res = await request(app).get('/api/search?q=algorithms&v=books')

      assert.equal(res.status, 200)
      assert.equal(res.body.vertical, 'books')
      assert.equal(res.body.isDemo, true)
      assert.ok(res.body.results.length > 0)
      assert.ok(res.body.results[0].author)
    })

    it('should return valid AI preview results with honest simulated status', async () => {
      const res = await request(app).get('/api/search?q=architecture&v=ai')

      assert.equal(res.status, 200)
      assert.equal(res.body.vertical, 'ai')
      assert.equal(res.body.isDemo, true)
      assert.ok(res.body.aiSummary)
      assert.equal(res.body.aiSummary.status, 'mock')
    })
  })

  describe('404 Route handling', () => {
    it('should return 404 for unknown endpoints in standardized JSON format', async () => {
      const res = await request(app).get('/api/unknown-endpoint')

      assert.equal(res.status, 404)
      assert.equal(res.body.error, true)
      assert.equal(res.body.code, 'NOT_FOUND')
    })
  })

  describe('SearchService provider decoupling and non-demo handling', () => {
    it('should return 501 Not Implemented if live search is requested without active crawler/indexer', async () => {
      const { SearchService } = await import('../src/services/search.service.js')
      const { AppError } = await import('../src/middleware/errorHandler.js')

      // Instantiate a search service with a stubbed provider representing disabled demo mode
      const offlineService = new SearchService({
        search: () => {
          throw new AppError(
            'Live search index is not yet operational. Independent crawler and indexing pipeline are in development.',
            501,
            'NOT_IMPLEMENTED'
          )
        },
      })

      await assert.rejects(
        async () => {
          await offlineService.search('test', 'all')
        },
        (err: any) => {
          assert.equal(err.statusCode, 501)
          assert.equal(err.code, 'NOT_IMPLEMENTED')
          assert.ok(err.message.includes('not yet operational'))
          return true
        }
      )
    })
  })

  describe('BraveSearchProvider adapter & normalizer', () => {
    it('should normalize raw Brave web and discussion results cleanly into typed contracts', async () => {
      const {
        normalizeBraveWebResults,
        normalizeBraveDiscussions,
      } = await import('../src/services/providers/brave.provider.js')

      const rawWeb = [
        {
          title: 'Wikipedia, the free encyclopedia',
          url: 'https://en.wikipedia.org/wiki/Main_Page',
          description: 'A free online encyclopedia created and edited by volunteers.',
          page_age: '2024-05-01',
          profile: {
            name: 'Wikipedia',
            long_name: 'en.wikipedia.org',
          },
          extra_snippets: ['History', 'Community portal'],
        },
      ]

      const normalizedWeb = normalizeBraveWebResults(rawWeb)
      assert.equal(normalizedWeb.length, 1)
      assert.equal(normalizedWeb[0].title, 'Wikipedia, the free encyclopedia')
      assert.equal(normalizedWeb[0].domain, 'en.wikipedia.org')
      assert.equal(normalizedWeb[0].metadata, 'Wikipedia')
      assert.equal(normalizedWeb[0].isDemo, false)
      assert.deepEqual(normalizedWeb[0].sitelinks, ['History', 'Community portal'])

      const rawDiscussions = [
        {
          title: 'How to build privacy-first search engines?',
          url: 'https://reddit.com/r/privacy/comments/12345',
          forum_name: 'Reddit',
          num_answers: 42,
          pubdate: '2024-06-15',
        },
      ]

      const normalizedDisc = normalizeBraveDiscussions(rawDiscussions)
      assert.equal(normalizedDisc.length, 1)
      assert.equal(normalizedDisc[0].title, 'How to build privacy-first search engines?')
      assert.equal(normalizedDisc[0].community, 'Reddit')
      assert.equal(normalizedDisc[0].comments, 42)
      assert.equal(normalizedDisc[0].isDemo, false)
    })

    it('should throw 503 PROVIDER_NOT_CONFIGURED when API key is missing', async () => {
      const { BraveSearchProvider } = await import('../src/services/providers/brave.provider.js')
      const unconfiguredProvider = new BraveSearchProvider('', 'https://api.search.brave.com/res/v1/web/search', 5000)

      await assert.rejects(
        async () => {
          await unconfiguredProvider.search('privacy')
        },
        (err: any) => {
          assert.equal(err.statusCode, 503)
          assert.equal(err.code, 'PROVIDER_NOT_CONFIGURED')
          assert.ok(err.message.includes('not configured'))
          return true
        }
      )
    })
  })
})

