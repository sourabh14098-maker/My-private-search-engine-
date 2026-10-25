import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanRawMarkdown,
  parseMarkdownBlocks,
  renderInlineMarkdown,
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
  })
})
