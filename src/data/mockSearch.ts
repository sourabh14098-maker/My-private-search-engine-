import type { SearchResponse, SearchResult, DiscussionItem } from '../types'

export function getMockSearchResponse(query: string): SearchResponse {
  const normalized = query.trim().toLowerCase()

  // Match the screenshot query (sBpidubgg, sb, seiko, watch, or wikipedia)
  const isBraveScreenshotQuery =
    normalized.includes('sbpi') ||
    normalized.includes('dubgg') ||
    normalized.includes('sbp') ||
    normalized.includes('seiko') ||
    normalized === 'sb'

  if (isBraveScreenshotQuery) {
    const results: SearchResult[] = [
      {
        id: 'sb-wiki',
        domain: 'ja.wikipedia.org',
        metadata: 'Wikipedia',
        breadcrumb: 'ja.wikipedia.org > wiki > SBペイメントサービス',
        displayUrl: 'ja.wikipedia.org > wiki > SBペイメントサービス',
        title: 'SBペイメントサービス - Wikipedia',
        url: 'https://ja.wikipedia.org/wiki/SB%E3%83%9A%E3%82%A4%E3%83%A1%E3%83%B3%E3%83%88%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9',
        destinationUrl: 'https://ja.wikipedia.org/wiki/SB%E3%83%9A%E3%82%A4%E3%83%A1%E3%83%B3%E3%83%88%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9',
        date: 'June 7, 2026',
        description:
          'ソフトバンクグループ > ソフトバンク > SBペイメントサービス・SBペイメントサービス株式会社 (英: SB Payment Service Corp.) は、オンライン決済代行サービス・カード事業を取り扱うソフトバンクの子会社。',
        sitelinks: ['沿革', '出典', '関連項目', '外部リンク'],
        isDemo: true,
      },
      {
        id: 'sbi-bank',
        domain: 'sbi.bank.in',
        metadata: 'Sbi',
        breadcrumb: 'sbi.bank.in > web > personal-banking',
        displayUrl: 'sbi.bank.in > web > personal-banking',
        title: 'SBI - Loans, Accounts, Cards, Investment, Deposits, Net Banki...',
        url: 'https://sbi.bank.in/web/personal-banking',
        destinationUrl: 'https://sbi.bank.in/web/personal-banking',
        description:
          'State Bank of India, a financial powerhouse, provides banking services like saving account, fixed deposits, personal loans, education loan, SME loans, agricultural banking, etc. to meet all your needs.',
        isDemo: true,
      },
      {
        id: 'seiko-official',
        domain: 'seikowatches.com',
        metadata: 'Seiko Watch Corporation',
        breadcrumb: 'seikowatches.com > global-en > products > selections',
        displayUrl: 'seikowatches.com > global-en > products > selections',
        title: 'Seiko Selection Solar Quartz Series [SBPX / SBTM]',
        url: 'https://www.seikowatches.com/global-en/products/selection',
        destinationUrl: 'https://www.seikowatches.com/global-en/products/selection',
        date: 'May 14, 2024',
        description:
          'Discover Japanese craftsmanship with the Seiko Solar Quartz series. Featuring sapphire crystal, clean dials, solar power cells, and timeless daily-wear proportions.',
        sitelinks: ['Specifications', 'Manuals & Guides', 'Service Centers', 'Retail Network'],
        isDemo: true,
      },
    ]

    const discussions: DiscussionItem[] = [
      {
        id: 'disc-1',
        title: '[SBPX147] what do you think of this piece ?',
        community: 'r/Seiko',
        comments: 27,
        upvotes: 114,
        date: 'June 21, 2024',
        preview:
          'Looking at picking up this solar quartz reference as a clean daily wear watch. Dial finishing and sapphire crystal punch way above the price. Anyone who owns it, how has it held up?',
        isDemo: true,
      },
      {
        id: 'disc-2',
        title: 'Help me pick my one do-it-all watch: [SBTM323] vs [SBPX147]',
        community: 'r/Seiko',
        comments: 0,
        upvotes: 0,
        date: 'June 10, 2024',
        preview:
          'Trying to decide between the radio-controlled SBTM323 and the clean solar SBPX147. Both look versatile on a 6.75 inch wrist.',
        isDemo: true,
      },
      {
        id: 'disc-3',
        title: 'Seiko SBPX147 : r/JapaneseWatches',
        community: 'r/JapaneseWatches',
        comments: 0,
        upvotes: 0,
        date: 'January 15, 2024',
        preview:
          'Natural light macro shots of the sapphire dial, indices reflection, and solid link bracelet on the JDM reference.',
        isDemo: true,
      },
      {
        id: 'disc-4',
        title: '[Identify] SBPX147 Solar Quartz',
        community: 'r/Seiko',
        comments: 7,
        upvotes: 7,
        date: 'October 7, 2023',
        preview:
          'Can anyone confirm the exact lug-to-lug distance and if aftermarket 20mm leather straps fit without gap?',
        isDemo: true,
      },
    ]

    return {
      query,
      resultCount: `Demo results · ${results.length} sample entries for "${query}" (Mock index)`,
      results,
      discussions,
      relatedSearches: [
        'seiko sbpx147 review',
        'sb payment service api',
        'sbi net banking login',
        'seiko sbtm323 solar quartz',
      ],
      questions: [
        {
          question: 'What is the case diameter of the Seiko SBPX147? (Sample Q&A)',
          answer:
            'The Seiko SBPX147 has a case diameter of 38.7mm with a thickness of 9.5mm, making it ideal for everyday casual and dress wear.',
        },
        {
          question: 'What services does SB Payment Service provide? (Sample Q&A)',
          answer:
            'SB Payment Service provides integrated online payment gateway solutions, credit card processing, QR code payments, and carrier billing.',
        },
      ],
    }
  }

  const isJava = normalized.includes('java') || normalized.includes('oop') || normalized.includes('object')

  if (isJava) {
    const results: SearchResult[] = [
      {
        id: 'java-1',
        domain: 'dev.java',
        metadata: 'Oracle Dev.java',
        breadcrumb: 'dev.java > learn > oop > concepts',
        displayUrl: 'dev.java > learn > oop > concepts',
        title: 'Object-Oriented Programming Concepts in Modern Java',
        url: 'https://dev.java/learn/oop/',
        destinationUrl: 'https://dev.java/learn/oop/',
        date: 'March 14, 2024',
        description:
          'Explore core building blocks: objects, classes, inheritance, polymorphism, and encapsulation. Includes interactive examples with modern records and sealed interfaces.',
        sitelinks: ['Classes & Objects', 'Inheritance', 'Interfaces', 'Pattern Matching'],
        isDemo: true,
      },
      {
        id: 'java-2',
        domain: 'docs.oracle.com',
        metadata: 'Oracle Java Documentation',
        breadcrumb: 'docs.oracle.com > en > java > javase > 21 > docs',
        displayUrl: 'docs.oracle.com > en > java > javase > 21 > docs',
        title: 'Java Platform Standard Edition 21 Documentation',
        url: 'https://docs.oracle.com/en/java/javase/21/docs/',
        destinationUrl: 'https://docs.oracle.com/en/java/javase/21/docs/',
        description:
          'The official documentation contains API specifications, developer guides, feature highlights, and migration notes for the Java SE 21 LTS release.',
        sitelinks: ['API Specification', 'Language Specification', 'Virtual Threads', 'Tools & Utilities'],
        isDemo: true,
      },
      {
        id: 'java-3',
        domain: 'openjdk.org',
        metadata: 'OpenJDK Community',
        breadcrumb: 'openjdk.org > projects > jdk > 21',
        displayUrl: 'openjdk.org > projects > jdk > 21',
        title: 'The OpenJDK Community & JDK Enhancements',
        url: 'https://openjdk.org/projects/jdk/21/',
        destinationUrl: 'https://openjdk.org/projects/jdk/21/',
        date: 'January 22, 2024',
        description:
          'The open-source development home of the Java Platform. Track JDK Enhancement Proposals (JEPs), compiler developments, and runtime optimizations.',
        isDemo: true,
      },
      {
        id: 'java-4',
        domain: 'baeldung.com',
        metadata: 'Baeldung',
        breadcrumb: 'baeldung.com > java-oop-design-patterns',
        displayUrl: 'baeldung.com > java-oop-design-patterns',
        title: 'Design Patterns & OOP Architecture in Modern Java',
        url: 'https://www.baeldung.com/java-oop-design-patterns',
        destinationUrl: 'https://www.baeldung.com/java-oop-design-patterns',
        date: 'November 18, 2023',
        description:
          'Practical guide to implementing Creational, Structural, and Behavioral design patterns in Java with clean code, testability, and enterprise architecture principles.',
        sitelinks: ['Factory Pattern', 'Builder Pattern', 'Dependency Injection', 'Clean Code'],
        isDemo: true,
      },
    ]

    const discussions: DiscussionItem[] = [
      {
        id: 'disc-java-1',
        title: 'What are the best practices for structuring modern Java 21 microservices?',
        community: 'r/java',
        comments: 64,
        upvotes: 342,
        date: 'July 14, 2024',
        preview:
          'With records, pattern matching, virtual threads, and Spring Boot 3 / Quarkus, what does your preferred module and package architecture look like?',
        isDemo: true,
      },
      {
        id: 'disc-java-2',
        title: 'Inheritance vs Composition: When do you still use abstract classes in production?',
        community: 'r/programming',
        comments: 112,
        upvotes: 490,
        date: 'May 28, 2024',
        preview:
          'Most modern style guides strongly advocate composition over inheritance. Where do inheritance hierarchies still make genuine sense?',
        isDemo: true,
      },
      {
        id: 'disc-java-3',
        title: 'Virtual Threads (Project Loom) in real-world benchmarks',
        community: 'r/java',
        comments: 41,
        upvotes: 218,
        date: 'March 2, 2024',
        preview:
          'Replaced fixed thread pools with virtual threads on a high-throughput HTTP proxy. Here are the memory latency measurements.',
        isDemo: true,
      },
      {
        id: 'disc-java-4',
        title: 'What are the top books or courses for mastering advanced Java concurrency?',
        community: 'r/learnprogramming',
        comments: 29,
        upvotes: 105,
        date: 'November 19, 2023',
        preview:
          'Looking for in-depth resources beyond basics — covering memory models, happens-before guarantees, and non-blocking data structures.',
        isDemo: true,
      },
    ]

    return {
      query,
      resultCount: `Demo results · ${results.length} sample entries for "${query}" (Mock index)`,
      results,
      discussions,
      relatedSearches: [
        'Java 21 new features',
        'Java OOP concepts with examples',
        'Spring Boot 3 best practices',
        'Java virtual threads tutorial',
      ],
      questions: [
        {
          question: 'What are the 4 core principles of OOP in Java? (Sample Q&A)',
          answer:
            'The four pillars are Encapsulation (hiding internal state), Inheritance (reusing parent class logic), Polymorphism (multiple implementations of one interface), and Abstraction (exposing only essential details).',
        },
        {
          question: 'How do Java 21 Records improve data modeling? (Sample Q&A)',
          answer:
            'Records provide concise syntax to declare immutable data carriers with automatic implementations of getters, equals(), hashCode(), and toString().',
        },
      ],
    }
  }

  // Generic query response
  const queryDisplay = query.trim() || 'Search'
  const capitalized = queryDisplay.charAt(0).toUpperCase() + queryDisplay.slice(1)
  // Clean readable breadcrumb path without %20 or encoded parameters
  const cleanTopicPath = queryDisplay.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'topic'

  const genericResults: SearchResult[] = [
    {
      id: 'gen-1',
      domain: 'wikipedia.org',
      metadata: 'Wikipedia',
      breadcrumb: `en.wikipedia.org > wiki > ${capitalized}`,
      displayUrl: `en.wikipedia.org > wiki > ${capitalized}`,
      title: `${capitalized} - Wikipedia`,
      url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(queryDisplay)}`,
      destinationUrl: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(queryDisplay)}`,
      date: 'August 12, 2024',
      description: `${capitalized} overview: history, fundamentals, technical specifications, and global impact across science, technology, and industry.`,
      sitelinks: ['Overview', 'History & Origin', 'Applications', 'References'],
      isDemo: true,
    },
    {
      id: 'gen-2',
      domain: 'github.com',
      metadata: 'GitHub Topics',
      breadcrumb: `github.com > topics > ${cleanTopicPath}`,
      displayUrl: `github.com > topics > ${cleanTopicPath}`,
      title: `Top open-source projects for "${queryDisplay}" on GitHub`,
      url: `https://github.com/search?q=${encodeURIComponent(queryDisplay)}`,
      destinationUrl: `https://github.com/search?q=${encodeURIComponent(queryDisplay)}`,
      description: `Browse trending repositories, libraries, SDKs, and developer tools related to ${queryDisplay}. Starred and maintained by the global developer community.`,
      sitelinks: ['Repositories', 'Collections', 'Trending', 'Discussions'],
      isDemo: true,
    },
    {
      id: 'gen-3',
      domain: 'developer.mozilla.org',
      metadata: 'MDN Web Docs',
      breadcrumb: 'developer.mozilla.org > docs > reference',
      displayUrl: 'developer.mozilla.org > docs > reference',
      title: `${capitalized} Developer Reference & Documentation`,
      url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(queryDisplay)}`,
      destinationUrl: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(queryDisplay)}`,
      date: 'April 4, 2024',
      description: `Standards, guides, architectural best practices, and code examples for building fast, privacy-respecting modern web applications.`,
      isDemo: true,
    },
    {
      id: 'gen-4',
      domain: 'stackoverflow.com',
      metadata: 'Stack Overflow',
      breadcrumb: `stackoverflow.com > questions > tagged > ${cleanTopicPath}`,
      displayUrl: `stackoverflow.com > questions > tagged > ${cleanTopicPath}`,
      title: `Frequently asked questions and solutions about ${queryDisplay}`,
      url: `https://stackoverflow.com/search?q=${encodeURIComponent(queryDisplay)}`,
      destinationUrl: `https://stackoverflow.com/search?q=${encodeURIComponent(queryDisplay)}`,
      description: `Peer-reviewed answers, architectural trade-offs, and troubleshooting solutions contributed by experienced engineers worldwide.`,
      isDemo: true,
    },
  ]

  const genericDiscussions: DiscussionItem[] = [
    {
      id: `disc-gen-1`,
      title: `What are the best resources and workflows for ${queryDisplay}?`,
      community: 'r/technology',
      comments: 38,
      upvotes: 182,
      date: 'May 16, 2024',
      preview: `Curated thoughts, modern toolchains, and community recommendations for getting the best outcomes with ${queryDisplay}.`,
      isDemo: true,
    },
    {
      id: `disc-gen-2`,
      title: `Real-world lessons learned when adopting ${queryDisplay} at scale`,
      community: 'r/programming',
      comments: 72,
      upvotes: 310,
      date: 'April 3, 2024',
      preview: `Deep dive into production bottlenecks, architecture decisions, and what we wish we had known before deploying.`,
      isDemo: true,
    },
    {
      id: `disc-gen-3`,
      title: `Community discussion & future roadmap for ${queryDisplay}`,
      community: 'r/webdev',
      comments: 15,
      upvotes: 64,
      date: 'January 28, 2024',
      preview: `Analyzing the upcoming trends, ecosystem changes, and developer tooling integrations.`,
      isDemo: true,
    },
    {
      id: `disc-gen-4`,
      title: `Beginner tips and common pitfalls with ${queryDisplay}`,
      community: 'r/learnprogramming',
      comments: 8,
      upvotes: 19,
      date: 'November 12, 2023',
      preview: `Key advice from experienced practitioners to avoid common early mistakes.`,
      isDemo: true,
    },
  ]

  return {
    query,
    resultCount: `Demo results · ${genericResults.length} sample entries for "${queryDisplay}" (Mock index)`,
    results: genericResults,
    discussions: genericDiscussions,
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
  }
}
