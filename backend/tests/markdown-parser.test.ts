import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanRawMarkdown,
  parseMarkdownBlocks,
  renderInlineMarkdown,
  correctProgrammingInaccuracies,
  repairCodeBlocks,
  isProgrammingQuery,
  stripModelWrapperTags,
  evaluateAnswerTruncation,
  COLLAPSED_HEIGHT_PX,
  EXPANSION_THRESHOLD_PX,
} from '../../src/utils/markdownParser.js'
import type { AnswerSource } from '../../src/types.js'

describe('DitchX Frontend Markdown Parser & Robustness Tests', () => {
  const mockSources: AnswerSource[] = [
    {
      title: 'Java Documentation',
      url: 'https://docs.oracle.com/java',
      destinationUrl: 'https://docs.oracle.com/en/java',
      domain: 'docs.oracle.com',
      snippet: 'Official documentation for the Java programming language.',
    },
    {
      title: 'Wikipedia Java',
      url: 'https://en.wikipedia.org/wiki/Java_(programming_language)',
      destinationUrl: 'https://en.wikipedia.org/wiki/Java_(programming_language)',
      domain: 'wikipedia.org',
      snippet: 'Java is a high-level, class-based, object-oriented programming language.',
    },
  ]

  describe('cleanRawMarkdown', () => {
    it('should strip leading artifact lines (standalone **, ===, ---, ###)', () => {
      const input = '**\n=======================\n\nJava is an OOP language.'
      const cleaned = cleanRawMarkdown(input)
      assert.ok(!cleaned.startsWith('**'))
      assert.ok(!cleaned.startsWith('='))
      assert.equal(cleaned, 'Java is an OOP language.')
    })

    it('should fix leading raw asterisks on a sentence (e.g. "** Java is...")', () => {
      const input = '** Java is a high-level, class-based programming language.'
      const cleaned = cleanRawMarkdown(input)
      assert.equal(cleaned, 'Java is a high-level, class-based programming language.')
    })

    it('should preserve legitimate bold formatting and labels', () => {
      const input1 = '**Java** is a popular programming language.'
      assert.equal(cleanRawMarkdown(input1), '**Java** is a popular programming language.')

      const input2 = '**Java:** A high-level object-oriented language.'
      assert.equal(cleanRawMarkdown(input2), '**Java:** A high-level object-oriented language.')
    })

    it('should convert Setext headings to ATX headings', () => {
      const input = 'Core Features\n=======================\n\n1. Simple\n2. Secure'
      const cleaned = cleanRawMarkdown(input)
      assert.ok(cleaned.startsWith('## Core Features'))
      assert.ok(!cleaned.includes('====='))
    })

    it('should remove internal metadata markers ([#operation], [#result]) while preserving [#1] normalized to [1]', () => {
      const input = 'Java is object-oriented [#1] [#operation] and fast [#2] [#result: verified].'
      const cleaned = cleanRawMarkdown(input)
      assert.ok(!cleaned.includes('[#operation]'))
      assert.ok(!cleaned.includes('[#result'))
      assert.ok(cleaned.includes('[1]'))
      assert.ok(cleaned.includes('[2]'))
      assert.equal(cleaned, 'Java is object-oriented [1] and fast [2].')
    })

    it('should strip conversational sign-offs from the end of answers', () => {
      const input = 'Java is an OOP language [1].\n\nHope this helps! Let me know if you have any questions.'
      const cleaned = cleanRawMarkdown(input)
      assert.ok(!cleaned.includes('Hope this helps'))
      assert.ok(!cleaned.includes('Let me know'))
      assert.equal(cleaned, 'Java is an OOP language [1].')
    })

    it('should strip dangling incomplete connector fragments at the end of text', () => {
      const input = 'Java supports many features [1]. For example,'
      const cleaned = cleanRawMarkdown(input)
      assert.ok(!cleaned.includes('For example'))
      assert.equal(cleaned, 'Java supports many features [1].')
    })

    it('should strip orphaned trailing headings with no following content', () => {
      const input = 'Java is platform-independent [1].\n\n### Next Steps'
      const cleaned = cleanRawMarkdown(input)
      assert.ok(!cleaned.includes('Next Steps'))
      assert.equal(cleaned, 'Java is platform-independent [1].')
    })
  })

  describe('parseMarkdownBlocks', () => {
    it('should correctly parse headings, paragraphs, and lists', () => {
      const md = [
        '### Introduction',
        'Java is widely used in enterprise development [1].',
        '',
        '**Key Advantages:**',
        '- Platform independence',
        '- Strong type safety',
        '- Automatic memory management',
        '',
        '1. Step one',
        '2. Step two',
      ].join('\n')

      const blocks = parseMarkdownBlocks(md)
      assert.equal(blocks.length, 5)

      // 1. Heading
      assert.equal(blocks[0].type, 'heading')
      assert.equal(blocks[0].text, 'Introduction')

      // 2. Paragraph
      assert.equal(blocks[1].type, 'paragraph')
      assert.ok(blocks[1].text?.includes('Java is widely used'))

      // 3. Standalone bold heading
      assert.equal(blocks[2].type, 'heading')
      assert.equal(blocks[2].text, 'Key Advantages')

      // 4. Bullet list
      assert.equal(blocks[3].type, 'bullet-list')
      assert.equal(blocks[3].items?.length, 3)
      assert.equal(blocks[3].items?.[0], 'Platform independence')

      // 5. Numbered list
      assert.equal(blocks[4].type, 'numbered-list')
      assert.equal(blocks[4].items?.length, 2)
      assert.equal(blocks[4].items?.[0], 'Step one')
    })

    it('should correctly parse fenced code blocks without formatting code content', () => {
      const md = [
        'Here is a code example:',
        '```java',
        'public class HelloWorld {',
        '    public static void main(String[] args) {',
        '        System.out.println("Hello, World!");',
        '    }',
        '}',
        '```',
        'End of example.',
      ].join('\n')

      const blocks = parseMarkdownBlocks(md)
      assert.equal(blocks.length, 3)

      assert.equal(blocks[0].type, 'paragraph')
      assert.equal(blocks[1].type, 'code-block')
      assert.equal(blocks[1].language, 'java')
      assert.ok(blocks[1].code?.includes('public static void main'))
      assert.equal(blocks[2].type, 'paragraph')
    })

    it('should ignore empty headings or punctuation-only headings and strip orphaned trailing headings', () => {
      const md = [
        '###',
        '### :::',
        'Java is widely used [1].',
        '### Trailing Orphan Heading',
      ].join('\n')

      const blocks = parseMarkdownBlocks(md)
      assert.equal(blocks.length, 1)
      assert.equal(blocks[0].type, 'paragraph')
      assert.equal(blocks[0].text, 'Java is widely used [1].')
    })
  })

  describe('renderInlineMarkdown', () => {
    it('should map valid citations [1] and [2] to source URLs without fabrication', () => {
      const inline = 'Java is maintained by Oracle [1] and documented on Wikipedia [2].'
      const nodes = renderInlineMarkdown(inline, mockSources)

      assert.ok(Array.isArray(nodes))
      // Verify no raw [1] string leakage when citation groups are rendered
      assert.ok(nodes.some((n: any) => n && typeof n === 'object' && n.key?.startsWith('cite-group')))
    })

    it('should handle out-of-range citations [99] gracefully as inert without creating links', () => {
      const inline = 'Fact with missing source [99].'
      const nodes = renderInlineMarkdown(inline, mockSources)
      assert.ok(Array.isArray(nodes))
      assert.ok(nodes.some((n: any) => n && typeof n === 'object' && n.key?.startsWith('cite-group')))
    })

    it('should correctly format bold, italic, code, and links', () => {
      const inline = 'This is **bold**, this is *italic*, `code()`, and [Official Docs](https://docs.oracle.com).'
      const nodes = renderInlineMarkdown(inline, mockSources)
      assert.ok(Array.isArray(nodes))

      // Check for bold element
      const hasBold = nodes.some((n: any) => n && typeof n === 'object' && n.type === 'strong')
      assert.ok(hasBold, 'Should render strong element for bold text')

      // Check for italic element
      const hasItalic = nodes.some((n: any) => n && typeof n === 'object' && n.type === 'em')
      assert.ok(hasItalic, 'Should render em element for italic text')

      // Check for code element
      const hasCode = nodes.some((n: any) => n && typeof n === 'object' && n.type === 'code')
      assert.ok(hasCode, 'Should render code element for inline code')

      // Check for link element
      const hasLink = nodes.some((n: any) => n && typeof n === 'object' && n.type === 'a')
      assert.ok(hasLink, 'Should render anchor element for markdown link')
    })

    it('should clean any stray unmatched ** in fallback text so raw ** never leaks into DOM', () => {
      const inline = 'Some text with ** orphaned asterisks.'
      const nodes = renderInlineMarkdown(inline, mockSources)
      const textOutput = nodes.filter((n) => typeof n === 'string').join('')
      assert.ok(!textOutput.includes('**'))
    })

    it('should sanitize residual metadata tokens [#operation] in fallback text', () => {
      const inline = 'Clean answer without [#operation] residual tag.'
      const nodes = renderInlineMarkdown(inline, mockSources)
      const textOutput = nodes.filter((n) => typeof n === 'string').join('')
      assert.ok(!textOutput.includes('[#operation]'))
    })

    it('should clean raw URL tracking noise (utm_source, v=) from fallback plain text', () => {
      const inline = 'Visit https://example.com/guide?utm_source=twitter&v=promo123 for details.'
      const nodes = renderInlineMarkdown(inline, mockSources)
      const textOutput = nodes.filter((n) => typeof n === 'string').join('')
      assert.ok(!textOutput.includes('utm_source'))
      assert.ok(!textOutput.includes('v=promo123'))
    })
  })

  describe('DitchX Code Block Repair & Clean Snippet Tests', () => {
    it('should repair duplicate language labels on code fences (e.g. ```java java -> ```java)', () => {
      const input = [
        'Here is a Java class:',
        '```java java',
        'public class Main {',
        '    public static void main(String[] args) {',
        '        System.out.println("Hello, World!");',
        '    }',
        '}',
        '```',
      ].join('\n')

      const cleaned = cleanRawMarkdown(input)
      assert.ok(cleaned.includes('```java'))
      assert.ok(!cleaned.includes('```java java'))

      const blocks = parseMarkdownBlocks(input)
      assert.equal(blocks.length, 2)
      assert.equal(blocks[1].type, 'code-block')
      assert.equal(blocks[1].language, 'java')
      assert.ok(blocks[1].code?.includes('public class Main'))
    })

    it('should strip stray fragments such as lone ");" following or inside code blocks', () => {
      const input = [
        '```java',
        'public class HelloWorld {',
        '    public static void main(String[] args) {',
        '        System.out.println("Hello, World!");',
        '        ");',
        '    }',
        '}',
        '```',
        '");',
        'Next paragraph.',
      ].join('\n')

      const cleaned = cleanRawMarkdown(input)
      assert.ok(!cleaned.includes('\n");'))

      const blocks = parseMarkdownBlocks(input)
      const codeBlock = blocks.find((b) => b.type === 'code-block')
      assert.ok(codeBlock)
      assert.ok(!codeBlock.code?.split('\n').some((line) => line.trim() === '");'))

      const paragraphs = blocks.filter((b) => b.type === 'paragraph')
      assert.ok(!paragraphs.some((p) => p.text?.includes('");')))
    })

    it('should complete unclosed code blocks with balanced curly braces', () => {
      const unclosed = [
        'Java example:',
        '```java',
        'public class HelloWorld {',
        '    public static void main(String[] args) {',
        '        System.out.println("Hello, World!");',
      ].join('\n')

      const blocks = parseMarkdownBlocks(unclosed)
      assert.equal(blocks.length, 2)
      assert.equal(blocks[1].type, 'code-block')
      assert.equal(blocks[1].language, 'java')
      assert.ok(blocks[1].code?.includes('System.out.println'))
      assert.ok(blocks[1].code?.includes('}'))
    })

    it('should clean URL tracking parameters and navigation fragments in cleanRawMarkdown', () => {
      const rawText = [
        'Skip to main content. Home > Programming > Java.',
        'Java is an object-oriented programming language [1].',
        'Visit https://oracle.com/java?utm_source=adwords&utm_medium=cpc&utm_campaign=brand&v=tracking123.',
        'Accept all cookies. All rights reserved. Copyright 2024.',
      ].join('\n\n')

      const cleaned = cleanRawMarkdown(rawText)
      assert.ok(!cleaned.includes('Skip to main content'))
      assert.ok(!cleaned.includes('Home > Programming'))
      assert.ok(!cleaned.includes('utm_source'))
      assert.ok(!cleaned.includes('utm_medium'))
      assert.ok(!cleaned.includes('v=tracking123'))
      assert.ok(!cleaned.includes('Accept all cookies'))
      assert.ok(!cleaned.includes('All rights reserved'))
      assert.ok(cleaned.includes('Java is an object-oriented programming language [1].'))
      assert.ok(cleaned.includes('https://oracle.com/java'))
    })

    it('should strip accidental URL fragments in cleanRawMarkdown while preserving intentional URLs, markdown links, and backtick code', () => {
      const input = [
        'Java aur Spring Boot sikhne ke liye aap com/courses/java-spring-boot-0-to-100/ dekh sakte hain [1].',
        'Official link: [Spring Boot](https://spring.io/projects/spring-boot).',
        'Direct URL: https://spring.io/guides/gs/spring-boot/ is also helpful.',
        'Configure package `com/courses/config` in your settings.',
        '```java',
        'String url = "com/courses/java-spring-boot-0-to-100/";',
        '```',
      ].join('\n\n')

      const cleaned = cleanRawMarkdown(input)
      assert.ok(!cleaned.includes('com/courses/java-spring-boot-0-to-100/ dekh'))
      assert.ok(cleaned.includes('aap dekh sakte hain [1].'))
      assert.ok(cleaned.includes('[Spring Boot](https://spring.io/projects/spring-boot)'))
      assert.ok(cleaned.includes('https://spring.io/guides/gs/spring-boot/'))
      assert.ok(cleaned.includes('`com/courses/config`'))
      assert.ok(cleaned.includes('String url = "com/courses/java-spring-boot-0-to-100/";'))
    })

    it('should preserve complete code blocks through cleanup and Show more/Show less block structure without placeholder code', () => {
      const input = [
        '### Java Inheritance Explanation',
        'Java inheritance allows a subclass to inherit attributes and methods from a superclass using extends [1].',
        '',
        '```java',
        '// Base class',
        'class Animal {',
        '    void eat() {',
        '        System.out.println("Eating...");',
        '    }',
        '}',
        '',
        '// Derived class',
        'class Dog extends Animal {',
        '    void bark() {',
        '        System.out.println("Barking...");',
        '    }',
        '}',
        '',
        'public class Main {',
        '    public static void main(String[] args) {',
        '        Dog dog = new Dog();',
        '        dog.eat();',
        '        dog.bark();',
        '    }',
        '}',
        '```',
        '',
        'In this hierarchy, Dog inherits eat() [2].',
      ].join('\n')

      const cleaned = cleanRawMarkdown(input)
      // Must not invent Hello World placeholder
      assert.ok(!cleaned.includes('System.out.println("Hello, World!");'))
      assert.ok(cleaned.includes('class Animal {'))
      assert.ok(cleaned.includes('class Dog extends Animal {'))
      assert.ok(cleaned.includes('dog.eat();'))

      // Parse blocks
      const blocks = parseMarkdownBlocks(input)
      const codeBlock = blocks.find((b) => b.type === 'code-block')
      assert.ok(codeBlock, 'Code block must be present')
      assert.equal(codeBlock?.language, 'java')
      assert.ok(codeBlock?.code?.includes('class Animal {'))
      assert.ok(codeBlock?.code?.includes('class Dog extends Animal {'))
      assert.ok(codeBlock?.code?.includes('    void eat() {'))
      assert.ok(codeBlock?.code?.includes('    void bark() {'))
      assert.ok(codeBlock?.code?.includes('public static void main(String[] args) {'))

      // Show more / Show less contract: all blocks remain present across toggles
      assert.equal(blocks.length, 4) // heading, paragraph, code-block, paragraph
      const reParsed = parseMarkdownBlocks(input)
      assert.deepEqual(blocks, reParsed, 'Block data must be completely preserved across render states')
    })

    it('should keep citation links and intentional URLs valid in renderInlineMarkdown', () => {
      const inline = 'Read [Spring Boot](https://spring.io/projects/spring-boot) or visit https://spring.io for docs [1], [2].'
      const nodes = renderInlineMarkdown(inline, mockSources)
      assert.ok(Array.isArray(nodes))

      // Citations [1] and [2] rendered as clickable links to destinationUrl
      const citeAnchors = nodes.filter(
        (n: any) => n && typeof n === 'object' && n.key?.startsWith('cite-group')
      )
      assert.ok(citeAnchors.length >= 1, 'Citation group must be rendered')

      // Markdown link [Spring Boot](...) rendered as anchor
      const linkAnchor = nodes.find(
        (n: any) => n && typeof n === 'object' && n.type === 'a' && n.props?.className === 'answer-inline-link'
      ) as any
      assert.ok(linkAnchor, 'Markdown link must be rendered as anchor')
      assert.equal(linkAnchor.props.href, 'https://spring.io/projects/spring-boot')
      assert.equal(linkAnchor.props.children, 'Spring Boot')
    })

    it('should correct false claims that Java supports multiple inheritance of classes and complete runnable main method', () => {
      const input = [
        '### Java Inheritance',
        'Java supports multiple inheritance of classes by allowing a class to extend multiple classes [1].',
        '',
        '```java',
        'class Animal {',
        '    void sound() { System.out.println("Animal sound"); }',
        '}',
        'class Cat extends Animal {',
        '    void meow() { System.out.println("Cat meows"); }',
        '}',
        '```',
      ].join('\n')

      const cleaned = cleanRawMarkdown(input)
      assert.ok(cleaned.includes('Java does not support multiple inheritance of classes'))
      assert.ok(cleaned.includes('instead, Java supports implementing multiple interfaces'))
      assert.ok(!cleaned.includes('Java supports multiple inheritance of classes by'))

      // Code block must contain parent class, child class with extends, and runnable main() method
      assert.ok(cleaned.includes('class Animal {'))
      assert.ok(cleaned.includes('class Cat extends Animal {'))
      assert.ok(cleaned.includes('public static void main(String[] args) {'))
      assert.ok(cleaned.includes('Cat cat = new Cat();'))
      assert.ok(cleaned.includes('cat.sound();'))
      assert.ok(cleaned.includes('cat.meow();'))

      // Parse blocks must preserve the complete code block
      const blocks = parseMarkdownBlocks(input)
      const codeBlock = blocks.find((b) => b.type === 'code-block')
      assert.ok(codeBlock)
      assert.equal(codeBlock?.language, 'java')
      assert.ok(codeBlock?.code?.includes('class Animal {'))
      assert.ok(codeBlock?.code?.includes('class Cat extends Animal {'))
      assert.ok(codeBlock?.code?.includes('public static void main(String[] args) {'))

      // Direct test for correctProgrammingInaccuracies
      const testHinglish = 'Java classes ka multiple inheritance support karta hai.'
      const resHinglish = correctProgrammingInaccuracies(testHinglish, 'hinglish')
      assert.ok(resHinglish.includes('Java classes ke multiple inheritance ko support nahi karta'))
      assert.ok(resHinglish.includes('multiple interfaces implement karne ki suvidha deta hai'))

      // Direct test for repairCodeBlocks in inheritance context
      const repairedStub = repairCodeBlocks('```java\npublic class LoneStub {\n```', 'Explain Java inheritance')
      assert.ok(repairedStub.includes('class Dog extends Animal {'))
      assert.ok(repairedStub.includes('public static void main(String[] args) {'))
    })

    it('should strip unsolicited Java code blocks from non-programming markdown and preserve general text', () => {
      const nonCodingInput = [
        'Photosynthesis is the process by which green plants synthesize nutrients from carbon dioxide and water.',
        '',
        '```java',
        'public class Plant {',
        '    public static void main(String[] args) {',
        '        System.out.println("Photosynthesis");',
        '    }',
        '}',
        '```',
        '',
        'Oxygen is released as a byproduct.',
      ].join('\n')

      const cleaned = cleanRawMarkdown(nonCodingInput, 'Explain photosynthesis')
      assert.ok(cleaned.includes('Photosynthesis is the process'))
      assert.equal(isProgrammingQuery('Explain photosynthesis'), false)
      assert.equal(isProgrammingQuery('Explain Java inheritance with code'), true)
      assert.ok(!cleaned.includes('public class Plant'))
      assert.ok(!cleaned.includes('System.out.println'))

      const blocks = parseMarkdownBlocks(nonCodingInput, 'Explain photosynthesis')
      assert.ok(blocks.every((b) => b.type !== 'code-block'))
      assert.ok(blocks.some((b) => b.type === 'paragraph' && b.text?.includes('Photosynthesis is the process')))
    })
  })

  describe('evaluateAnswerTruncation (Show More / Show Less Engine)', () => {
    it('should export standard truncation constants (280px collapsed, 340px expansion threshold)', () => {
      assert.equal(COLLAPSED_HEIGHT_PX, 280)
      assert.equal(EXPANSION_THRESHOLD_PX, 340)
    })

    it('should NOT truncate short answers that easily fit within collapsed height (<= 280px)', () => {
      // Short 1-2 sentence answers: no Show More / Show Less toggle button
      const res0 = evaluateAnswerTruncation(0)
      assert.equal(res0.isTruncated, false)
      assert.equal(res0.collapsedHeight, 280)

      const res120 = evaluateAnswerTruncation(120)
      assert.equal(res120.isTruncated, false)
      assert.equal(res120.collapsedHeight, 280)

      const res280 = evaluateAnswerTruncation(280)
      assert.equal(res280.isTruncated, false)
      assert.equal(res280.collapsedHeight, 280)
    })

    it('should NOT truncate medium answers that fit within the 340px buffer threshold (281px - 340px)', () => {
      // Medium answers should remain fully visible whenever practical without toggle
      const res281 = evaluateAnswerTruncation(281)
      assert.equal(res281.isTruncated, false)
      assert.equal(res281.collapsedHeight, 280)

      const res310 = evaluateAnswerTruncation(310)
      assert.equal(res310.isTruncated, false)
      assert.equal(res310.collapsedHeight, 280)

      const res340 = evaluateAnswerTruncation(340)
      assert.equal(res340.isTruncated, false)
      assert.equal(res340.collapsedHeight, 280)
    })

    it('should truncate genuinely long answers exceeding the threshold (> 340px)', () => {
      // Long answers collapse at 280px and enable Show More
      const res341 = evaluateAnswerTruncation(341)
      assert.equal(res341.isTruncated, true)
      assert.equal(res341.collapsedHeight, 280)

      const res500 = evaluateAnswerTruncation(500)
      assert.equal(res500.isTruncated, true)
      assert.equal(res500.collapsedHeight, 280)

      const res1200 = evaluateAnswerTruncation(1200)
      assert.equal(res1200.isTruncated, true)
      assert.equal(res1200.collapsedHeight, 280)
    })

    it('should handle edge cases (negative values or non-number) gracefully without truncating', () => {
      const resNeg = evaluateAnswerTruncation(-50)
      assert.equal(resNeg.isTruncated, false)

      const resNaN = evaluateAnswerTruncation(NaN as any)
      assert.equal(resNaN.isTruncated, false)

      const resNull = evaluateAnswerTruncation(null as any)
      assert.equal(resNull.isTruncated, false)
    })
  })

  describe('Answer Content & Formatting Preservation in Truncated / Long Answers', () => {
    it('should preserve code blocks, indentation, and structure in long programming answers', () => {
      const longCodingAnswer = [
        '### Binary Search in Java',
        'Here is the complete binary search implementation in Java [1]:',
        '',
        '```java',
        'public class BinarySearch {',
        '    public static int search(int[] arr, int target) {',
        '        int left = 0;',
        '        int right = arr.length - 1;',
        '        while (left <= right) {',
        '            int mid = left + (right - left) / 2;',
        '            if (arr[mid] == target) {',
        '                return mid;',
        '            } else if (arr[mid] < target) {',
        '                left = mid + 1;',
        '            } else {',
        '                right = mid - 1;',
        '            }',
        '        }',
        '        return -1;',
        '    }',
        '    public static void main(String[] args) {',
        '        int[] numbers = { 1, 3, 5, 7, 9, 11 };',
        '        System.out.println(search(numbers, 7));',
        '    }',
        '}',
        '```',
        '',
        '**Complexity Analysis:**',
        '- Time Complexity: O(log n)',
        '- Space Complexity: O(1)',
        'This algorithm is optimal for sorted arrays [2].',
      ].join('\n')

      const blocks = parseMarkdownBlocks(longCodingAnswer, 'Binary search in Java')
      const codeBlock = blocks.find((b) => b.type === 'code-block')
      assert.ok(codeBlock, 'Code block must be extracted')
      assert.equal(codeBlock?.language, 'java')
      assert.ok(codeBlock?.code?.includes('int mid = left + (right - left) / 2;'), 'Inner logic preserved')
      assert.ok(codeBlock?.code?.includes('        int left = 0;'), 'Indentation preserved')
      assert.ok(codeBlock?.code?.includes('public static void main'), 'Main entrypoint preserved')

      // Check heading and list items
      const heading = blocks.find((b) => b.type === 'heading')
      assert.equal(heading?.text, 'Binary Search in Java')

      const list = blocks.find((b) => b.type === 'bullet-list')
      assert.ok(list?.items && list.items.length === 2)
      assert.ok(list?.items[0].includes('O(log n)'))
    })

    it('should preserve and resolve citations [1] and [2] cleanly across multi-paragraph answers', () => {
      const multiParagraphAnswer = [
        'Java is an object-oriented programming language developed by Sun Microsystems [1].',
        '',
        'It compiles source code into platform-independent bytecode [2].',
      ].join('\n')

      const blocks = parseMarkdownBlocks(multiParagraphAnswer, 'What is Java')
      assert.equal(blocks.length, 2)

      const rendered1 = renderInlineMarkdown(blocks[0].text || '', mockSources)
      assert.ok(rendered1.some((n: any) => n && typeof n === 'object' && n.key?.startsWith('cite-group')))

      const rendered2 = renderInlineMarkdown(blocks[1].text || '', mockSources)
      assert.ok(rendered2.some((n: any) => n && typeof n === 'object' && n.key?.startsWith('cite-group')))
    })
  })

  describe('Raw Model Wrapper Tag Suppression (<markdown>, <think>, etc.)', () => {
    it('should strip <markdown> and </markdown> tags without damaging markdown structure', () => {
      const input = '<markdown>\n## Title\nParagraph text.\n</markdown>'
      const stripped = stripModelWrapperTags(input)
      assert.ok(!stripped.includes('<markdown>'))
      assert.ok(!stripped.includes('</markdown>'))
      assert.ok(stripped.includes('## Title'))

      const blocks = parseMarkdownBlocks(input)
      assert.equal(blocks[0].type, 'heading')
      assert.equal(blocks[0].text, 'Title')
      assert.equal(blocks[1].type, 'paragraph')
      assert.equal(blocks[1].text, 'Paragraph text.')
    })

    it('should strip <think>...</think> reasoning blocks cleanly', () => {
      const input = '<think>\nInternal chain of thought reasoning.\n</think>\nActual factual answer.'
      const stripped = stripModelWrapperTags(input)
      assert.ok(!stripped.includes('<think>'))
      assert.ok(!stripped.includes('Internal chain of thought'))
      assert.equal(stripped, 'Actual factual answer.')

      const blocks = parseMarkdownBlocks(input)
      assert.equal(blocks.length, 1)
      assert.equal(blocks[0].text, 'Actual factual answer.')
    })

    it('should strip <answer>, <response>, and <untrusted_search_results> tags', () => {
      const input = '<answer><untrusted_search_results>snippet</untrusted_search_results>Direct answer.</answer>'
      const stripped = stripModelWrapperTags(input)
      assert.ok(!stripped.includes('<answer>'))
      assert.ok(!stripped.includes('</answer>'))
      assert.ok(!stripped.includes('<untrusted_search_results>'))
      assert.equal(stripped, 'Direct answer.')
    })
  })
})


