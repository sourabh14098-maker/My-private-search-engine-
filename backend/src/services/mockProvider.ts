import type {
  SearchVertical,
  SearchApiResponse,
  WebSearchResult,
  DiscussionItem,
  ImageResult,
  VideoResult,
  NewsResult,
  PlaceResult,
  ProductResult,
  BookResult,
  AISummaryData,
} from '../types/api.js'

export class MockSearchProvider {
  static search(query: string, vertical: SearchVertical): SearchApiResponse {
    const startTime = Date.now()
    const trimmed = query.trim()

    switch (vertical) {
      case 'images':
        return this.getImages(trimmed, startTime)
      case 'videos':
        return this.getVideos(trimmed, startTime)
      case 'news':
        return this.getNews(trimmed, startTime)
      case 'maps':
        return this.getMaps(trimmed, startTime)
      case 'shopping':
        return this.getShopping(trimmed, startTime)
      case 'books':
        return this.getBooks(trimmed, startTime)
      case 'ai':
        return this.getAI(trimmed, startTime)
      case 'all':
      default:
        return this.getWeb(trimmed, startTime)
    }
  }

  private static getWeb(query: string, startTime: number): SearchApiResponse<WebSearchResult> {
    const queryDisplay = query || 'Search'
    const capitalized = queryDisplay.charAt(0).toUpperCase() + queryDisplay.slice(1)
    const cleanTopic = queryDisplay.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'topic'

    const results: WebSearchResult[] = [
      {
        id: 'web-1',
        domain: 'wikipedia.org',
        metadata: 'Wikipedia',
        breadcrumb: `en.wikipedia.org > wiki > ${capitalized}`,
        displayUrl: `en.wikipedia.org > wiki > ${capitalized}`,
        title: `${capitalized} - Wikipedia`,
        url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(queryDisplay)}`,
        destinationUrl: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(queryDisplay)}`,
        date: 'August 12, 2024',
        description: `${capitalized} overview: history, fundamentals, technical specifications, and global impact across technology, science, and open-source ecosystems.`,
        sitelinks: ['Overview', 'History & Origin', 'Applications', 'References'],
        isDemo: true,
      },
      {
        id: 'web-2',
        domain: 'github.com',
        metadata: 'GitHub Topics',
        breadcrumb: `github.com > topics > ${cleanTopic}`,
        displayUrl: `github.com > topics > ${cleanTopic}`,
        title: `Top open-source projects for "${queryDisplay}" on GitHub`,
        url: `https://github.com/search?q=${encodeURIComponent(queryDisplay)}`,
        destinationUrl: `https://github.com/search?q=${encodeURIComponent(queryDisplay)}`,
        description: `Browse trending repositories, developer tools, libraries, and open-source packages related to ${queryDisplay}. Starred and maintained by the developer community.`,
        sitelinks: ['Repositories', 'Collections', 'Trending', 'Discussions'],
        isDemo: true,
      },
      {
        id: 'web-3',
        domain: 'developer.mozilla.org',
        metadata: 'MDN Web Docs',
        breadcrumb: 'developer.mozilla.org > docs > reference',
        displayUrl: 'developer.mozilla.org > docs > reference',
        title: `${capitalized} Developer Reference & Documentation`,
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(queryDisplay)}`,
        destinationUrl: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(queryDisplay)}`,
        date: 'April 4, 2024',
        description: `Standards, architectural guidelines, browser compatibilities, and code examples for building fast, privacy-respecting modern web applications.`,
        isDemo: true,
      },
      {
        id: 'web-4',
        domain: 'stackoverflow.com',
        metadata: 'Stack Overflow',
        breadcrumb: `stackoverflow.com > questions > tagged > ${cleanTopic}`,
        displayUrl: `stackoverflow.com > questions > tagged > ${cleanTopic}`,
        title: `Frequently asked questions and solutions about ${queryDisplay}`,
        url: `https://stackoverflow.com/search?q=${encodeURIComponent(queryDisplay)}`,
        destinationUrl: `https://stackoverflow.com/search?q=${encodeURIComponent(queryDisplay)}`,
        description: `Peer-reviewed engineering answers, architectural trade-offs, and debugging solutions contributed by experienced practitioners worldwide.`,
        isDemo: true,
      },
    ]

    const discussions: DiscussionItem[] = [
      {
        id: 'disc-1',
        title: `What are the best workflows and modern toolchains for ${queryDisplay}?`,
        community: 'r/technology',
        comments: 38,
        upvotes: 182,
        date: 'May 16, 2024',
        preview: `Curated thoughts, modern toolchains, and community recommendations for getting the best outcomes with ${queryDisplay}.`,
        isDemo: true,
      },
      {
        id: 'disc-2',
        title: `Real-world lessons learned when adopting ${queryDisplay} at scale`,
        community: 'r/programming',
        comments: 72,
        upvotes: 310,
        date: 'April 3, 2024',
        preview: `Deep dive into production bottlenecks, architecture decisions, and what we wish we had known before deploying.`,
        isDemo: true,
      },
      {
        id: 'disc-3',
        title: `Community discussion & future roadmap for ${queryDisplay}`,
        community: 'r/webdev',
        comments: 15,
        upvotes: 64,
        date: 'January 28, 2024',
        preview: `Analyzing upcoming trends, ecosystem shifts, and developer tooling integrations.`,
        isDemo: true,
      },
      {
        id: 'disc-4',
        title: `Beginner tips and common pitfalls with ${queryDisplay}`,
        community: 'r/learnprogramming',
        comments: 8,
        upvotes: 19,
        date: 'November 12, 2023',
        preview: `Key advice from experienced practitioners to avoid common early architectural mistakes.`,
        isDemo: true,
      },
    ]

    return {
      query,
      vertical: 'all',
      isDemo: true,
      provider: 'mock-index',
      resultCount: `Demo results · ${results.length} sample entries for "${queryDisplay}" (Mock index)`,
      results,
      discussions,
      relatedSearches: [
        `${queryDisplay} tutorial`,
        `${queryDisplay} architecture`,
        `${queryDisplay} vs alternatives`,
        `best practices for ${queryDisplay}`,
      ],
      questions: [
        {
          question: `What is the primary use case for ${queryDisplay}? (Sample Q&A)`,
          answer: `${capitalized} is widely used to solve core workflow, data, and performance requirements with clean modular architecture.`,
        },
        {
          question: `How does ${queryDisplay} compare to industry standards? (Sample Q&A)`,
          answer: `It prioritizes user control, simplicity, and efficiency, minimizing overhead without sacrificing capability.`,
        },
      ],
      metadata: {
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        isIndexedData: false,
        notice: 'Demo data from mock index. Independent crawler and index are planned.',
        totalEstimate: 4,
      },
    }
  }

  private static getImages(query: string, startTime: number): SearchApiResponse<ImageResult> {
    const seeds = [
      { seed: 'photo-1516321318423-f06f85e504b3', title: `${query} concepts & design` },
      { seed: 'photo-1555066931-4365d14bab8c', title: `${query} code architecture` },
      { seed: 'photo-1498050108023-c5249f4df085', title: `${query} developer workspace` },
      { seed: 'photo-1515879218367-8466d910aaa4', title: `${query} digital infrastructure` },
      { seed: 'photo-1558655146-d09347e92766', title: `${query} visual documentation` },
      { seed: 'photo-1461749280684-dccba630e2f6', title: `${query} open source project` },
    ]

    const results: ImageResult[] = seeds.map((item, index) => ({
      id: `img-${index + 1}`,
      title: item.title,
      source: ['Unsplash', 'Wikimedia Commons', 'Pexels'][index % 3],
      domain: ['unsplash.com', 'commons.wikimedia.org', 'pexels.com'][index % 3],
      imageUrl: `https://images.unsplash.com/${item.seed}?auto=format&fit=crop&w=720&q=80`,
      width: 720,
      height: index % 2 ? 480 : 540,
      destinationUrl: `https://images.unsplash.com/${item.seed}`,
    }))

    return {
      query,
      vertical: 'images',
      isDemo: true,
      provider: 'mock-index',
      resultCount: `Demo results · ${results.length} sample images for "${query}" (Mock index)`,
      results,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        isIndexedData: false,
        notice: 'Demo image results from mock catalog.',
      },
    }
  }

  private static getVideos(query: string, startTime: number): SearchApiResponse<VideoResult> {
    const results: VideoResult[] = [
      {
        id: 'vid-1',
        title: `${query} in 10 Minutes: Complete Guide`,
        source: 'Code Lab',
        domain: 'video.example',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=720&q=80',
        duration: '10:24',
        description: `A concise visual overview of key architectural patterns, syntax, and principles for ${query}.`,
        published: '2 weeks ago',
        destinationUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      },
      {
        id: 'vid-2',
        title: `Building Maintainable Systems with ${query}`,
        source: 'The Systems Room',
        domain: 'video.example',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=720&q=80',
        duration: '24:08',
        description: `A practical engineering walk-through on avoiding technical debt and managing complexity.`,
        published: '1 month ago',
        destinationUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+architecture`,
      },
      {
        id: 'vid-3',
        title: `Visual Walkthrough & Code Review: ${query}`,
        source: 'Open Lecture',
        domain: 'video.example',
        thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=720&q=80',
        duration: '18:52',
        description: `Practical patterns, test automation setups, and common pitfalls to watch for.`,
        published: '3 months ago',
        destinationUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+tutorial`,
      },
    ]

    return {
      query,
      vertical: 'videos',
      isDemo: true,
      provider: 'mock-index',
      resultCount: `Demo results · ${results.length} sample videos for "${query}" (Mock index)`,
      results,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        isIndexedData: false,
        notice: 'Demo video listings from mock provider.',
      },
    }
  }

  private static getNews(query: string, startTime: number): SearchApiResponse<NewsResult> {
    const results: NewsResult[] = [
      {
        id: 'news-1',
        headline: `Open Source Communities Expand Standards for ${query}`,
        publisher: 'The Independent Ledger',
        timestamp: '2 hours ago',
        description: 'Maintainers and developers are focusing on durable tools, transparent governance, and sustainable digital infrastructure.',
        destinationUrl: `https://duckduckgo.com/?q=${encodeURIComponent(query)}+news&ia=news`,
      },
      {
        id: 'news-2',
        headline: `Why Privacy & Control Are Reshaping ${query} Ecosystems`,
        publisher: 'Signal Journal',
        timestamp: 'Yesterday',
        description: 'Engineers and researchers advocate for user control and verifiable software layers.',
        destinationUrl: `https://duckduckgo.com/?q=${encodeURIComponent(query)}+privacy&ia=news`,
      },
      {
        id: 'news-3',
        headline: `Next-Generation Infrastructure Evolves Around ${query}`,
        publisher: 'Protocol Review',
        timestamp: '3 days ago',
        description: 'A survey of architectural shifts toward decentralized, privacy-focused information systems.',
        destinationUrl: `https://duckduckgo.com/?q=${encodeURIComponent(query)}+infrastructure&ia=news`,
      },
    ]

    return {
      query,
      vertical: 'news',
      isDemo: true,
      provider: 'mock-index',
      resultCount: `Demo results · ${results.length} sample articles for "${query}" (Mock index)`,
      results,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        isIndexedData: false,
        notice: 'Demo editorial news feed from sample publication concepts.',
      },
    }
  }

  private static getMaps(query: string, startTime: number): SearchApiResponse<PlaceResult> {
    const results: PlaceResult[] = [
      {
        id: 'place-1',
        name: `Northstar ${query} Hub`,
        category: 'Workspace / Lab',
        rating: 4.8,
        address: '14 Mercer Street, Downtown',
        openingStatus: 'Open until 6:00 PM',
        distance: '0.4 mi',
        website: 'northstar.example',
        destinationUrl: `https://www.openstreetmap.org/search?query=${encodeURIComponent(query + ' Mercer Street')}`,
      },
      {
        id: 'place-2',
        name: `The Workshop Reference Space`,
        category: 'Independent Library',
        rating: 4.7,
        address: '88 Orchard Avenue, East Village',
        openingStatus: 'Open until 8:00 PM',
        distance: '1.1 mi',
        website: 'workshop.example',
        destinationUrl: `https://www.openstreetmap.org/search?query=${encodeURIComponent(query + ' Orchard Avenue')}`,
      },
      {
        id: 'place-3',
        name: `Field Notes Lab & Commons`,
        category: 'Study Commons',
        rating: 4.6,
        address: '201 Franklin Road, Midtown',
        openingStatus: 'Opens at 11:30 AM',
        distance: '1.8 mi',
        website: 'fieldnotes.example',
        destinationUrl: `https://www.openstreetmap.org/search?query=${encodeURIComponent(query + ' Franklin Road')}`,
      },
    ]

    return {
      query,
      vertical: 'maps',
      isDemo: true,
      provider: 'mock-index',
      resultCount: `Demo results · ${results.length} sample places for "${query}" (Mock index)`,
      results,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        isIndexedData: false,
        notice: 'Demo geographic entries (mock locations).',
      },
    }
  }

  private static getShopping(query: string, startTime: number): SearchApiResponse<ProductResult> {
    const results: ProductResult[] = [
      {
        id: 'prod-1',
        name: `The Art of Engineering Systems (${query})`,
        price: '$24.00',
        store: 'Independent Bookshop',
        rating: 4.8,
        availability: 'In stock',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=360&q=80',
        destinationUrl: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=shopping`,
      },
      {
        id: 'prod-2',
        name: `Mechanical Workstation Hardware Edition`,
        price: '$129.00',
        store: 'Hardware Collective',
        rating: 4.6,
        availability: 'Ships tomorrow',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=360&q=80',
        destinationUrl: `https://duckduckgo.com/?q=${encodeURIComponent(query)}+hardware&ia=shopping`,
      },
      {
        id: 'prod-3',
        name: `Desk Study Fixture / Minimal Edition`,
        price: '$88.00',
        store: 'Object Studio',
        rating: 4.9,
        availability: 'Limited stock',
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=360&q=80',
        destinationUrl: `https://duckduckgo.com/?q=${encodeURIComponent(query)}+minimal&ia=shopping`,
      },
    ]

    return {
      query,
      vertical: 'shopping',
      isDemo: true,
      provider: 'mock-index',
      resultCount: `Demo results · ${results.length} sample products for "${query}" (Mock index)`,
      results,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        isIndexedData: false,
        notice: 'Sample catalog products (demo pricing and availability).',
      },
    }
  }

  private static getBooks(query: string, startTime: number): SearchApiResponse<BookResult> {
    const results: BookResult[] = [
      {
        id: 'book-1',
        title: `The Pragmatic Programmer: ${query} Edition`,
        author: 'David Thomas & Andrew Hunt',
        publicationDate: '1999',
        description: 'A classic guide to the habits, techniques, and principles that make software engineering more durable.',
        source: 'Library Index',
        coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=320&q=80',
        destinationUrl: `https://openlibrary.org/search?q=${encodeURIComponent(query)}`,
      },
      {
        id: 'book-2',
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        publicationDate: '2017',
        description: 'A deep exploration of storage engines, distributed consensus, transactions, and reliability tradeoffs.',
        source: 'Library Index',
        coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=320&q=80',
        destinationUrl: `https://openlibrary.org/search?q=Designing+Data-Intensive+Applications`,
      },
      {
        id: 'book-3',
        title: 'The Elements of Computing Systems',
        author: 'Noam Nisan & Shimon Schocken',
        publicationDate: '2005',
        description: 'Build a modern computer system from first principles: from logic gates to operating system hierarchy.',
        source: 'Library Index',
        coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=320&q=80',
        destinationUrl: `https://openlibrary.org/search?q=The+Elements+of+Computing+Systems`,
      },
    ]

    return {
      query,
      vertical: 'books',
      isDemo: true,
      provider: 'mock-index',
      resultCount: `Demo results · ${results.length} sample books for "${query}" (Mock index)`,
      results,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        isIndexedData: false,
        notice: 'Sample catalog publications from mock index.',
      },
    }
  }

  private static getAI(query: string, startTime: number): SearchApiResponse<WebSearchResult> {
    const web = this.getWeb(query, startTime)

    const aiSummary: AISummaryData = {
      answer: `"${query}" is an illustrative query in this prototype. This preview demonstrates the planned surface for our future search intelligence layer, which will synthesize independently indexed documents with full provenance and zero user profiling.`,
      sources: [
        { title: `${query} - Wikipedia Overview`, domain: 'en.wikipedia.org', url: 'https://en.wikipedia.org' },
        { title: `Developer Reference for ${query}`, domain: 'developer.mozilla.org', url: 'https://developer.mozilla.org' },
      ],
      relatedQuestions: [
        `What are the core fundamentals of ${query}?`,
        `How does ${query} compare with modern alternatives?`,
      ],
      status: 'mock',
    }

    return {
      ...web,
      vertical: 'ai',
      resultCount: `Demo AI answer & simulated web sources for "${query}" (Mock index)`,
      aiSummary,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        isIndexedData: false,
        notice: 'Simulated AI synthesis and sample web citations (prototype preview).',
      },
    }
  }
}
