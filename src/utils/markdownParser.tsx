import React from 'react'
import type { AnswerSource } from '../types'
import { sanitizeSafeUrl } from './url'

export interface MarkdownBlock {
  type: 'heading' | 'numbered-list' | 'bullet-list' | 'paragraph' | 'code-block'
  level?: number
  items?: string[]
  text?: string
  code?: string
  language?: string
}

/**
 * Normalizes raw LLM output before block parsing:
 * 1. Strips leading artifact lines such as standalone '**', '***', '###', '====', '----'.
 * 2. Preprocesses Setext heading underlines ('===', '---') into ATX headings ('##', '###').
 * 3. Cleans orphaned leading '** ' or unclosed '**' markers at the start of sentences or labels.
 */
export function cleanRawMarkdown(text: string): string {
  if (!text) return ''
  let cleaned = text.replace(/\r\n/g, '\n').trim()

  // Repeatedly remove leading standalone artifact/divider lines
  cleaned = cleaned.replace(/^(\s*(?:\*{1,}|#{1,6}|={3,}|-{3,})\s*\n)+/g, '').trim()

  // Preprocess Setext headings: "Title\n====" -> "## Title", "Title\n----" -> "### Title"
  cleaned = cleaned.replace(/^([^\n#`*-][^\n]*)\n\s*={3,}\s*$/gm, '## $1')
  cleaned = cleaned.replace(/^([^\n#`*-][^\n]*)\n\s*-{3,}\s*$/gm, '### $1')

  // Clean leading orphaned "** " or unclosed "**" markers on individual lines
  const lines = cleaned.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Line starts with "** " followed by space, but has no closing "**"
    if (/^\*\*\s+/.test(trimmed)) {
      const rest = trimmed.replace(/^\*\*\s+/, '')
      if (!rest.includes('**')) {
        lines[i] = line.replace(/^\s*\*\*\s+/, '')
      }
    } else if (trimmed.startsWith('**') && !trimmed.slice(2).includes('**')) {
      // Unclosed "**Word..." on a line
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx > 2 && colonIdx < 35) {
        // e.g. "**Word: rest" -> "**Word:** rest"
        const term = trimmed.slice(2, colonIdx).trim()
        lines[i] = `**${term}:**` + trimmed.slice(colonIdx + 1)
      } else {
        // Remove orphaned leading "**"
        lines[i] = trimmed.slice(2).trimStart()
      }
    }
  }

  return lines.join('\n').trim()
}

/**
 * Parses markdown text into structured semantic blocks (headings, code blocks, lists, paragraphs).
 */
export function parseMarkdownBlocks(rawText: string): MarkdownBlock[] {
  const cleaned = cleanRawMarkdown(rawText)
  const lines = cleaned.split('\n')
  const blocks: MarkdownBlock[] = []
  let currentBlock: MarkdownBlock | null = null

  const flushBlock = () => {
    if (currentBlock) {
      blocks.push(currentBlock)
      currentBlock = null
    }
  }

  let inCodeBlock = false
  let codeLanguage = ''
  let codeLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // 1. Fenced code block check (```lang or ```)
    const codeFenceMatch = trimmed.match(/^```([a-zA-Z0-9_-]*)/)
    if (codeFenceMatch) {
      if (inCodeBlock) {
        // Closing code fence
        flushBlock()
        blocks.push({
          type: 'code-block',
          language: codeLanguage || 'code',
          code: codeLines.join('\n'),
        })
        inCodeBlock = false
        codeLanguage = ''
        codeLines = []
      } else {
        // Opening code fence
        flushBlock()
        inCodeBlock = true
        codeLanguage = codeFenceMatch[1].trim()
        codeLines = []
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(rawLine)
      continue
    }

    // 2. Empty line flushes current block
    if (!trimmed) {
      flushBlock()
      continue
    }

    // 3. Skip standalone markdown horizontal rules
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushBlock()
      continue
    }

    // 4. ATX Headings: # Heading to ###### Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushBlock()
      blocks.push({
        type: 'heading',
        level: Math.min(6, Math.max(2, headingMatch[1].length)),
        text: headingMatch[2].trim(),
      })
      continue
    }

    // 5. Standalone bold line as heading: **Heading Text** or **Heading Text:**
    const boldHeadingMatch = trimmed.match(/^\*\*([^*]+)\*\*[:.]?$/)
    if (boldHeadingMatch) {
      flushBlock()
      blocks.push({
        type: 'heading',
        level: 3,
        text: boldHeadingMatch[1].replace(/[:.]\s*$/, '').trim(),
      })
      continue
    }

    // 6. Numbered list item: 1. Item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (numMatch) {
      if (!currentBlock || currentBlock.type !== 'numbered-list') {
        flushBlock()
        currentBlock = { type: 'numbered-list', items: [] }
      }
      currentBlock.items?.push(numMatch[2].trim())
      continue
    }

    // 7. Bullet list item: - Item, * Item, • Item, + Item
    const bulletMatch = trimmed.match(/^[-*•+]\s+(.+)$/)
    if (bulletMatch) {
      if (!currentBlock || currentBlock.type !== 'bullet-list') {
        flushBlock()
        currentBlock = { type: 'bullet-list', items: [] }
      }
      currentBlock.items?.push(bulletMatch[1].trim())
      continue
    }

    // 8. Regular paragraph
    if (!currentBlock || currentBlock.type !== 'paragraph') {
      flushBlock()
      currentBlock = { type: 'paragraph', text: trimmed }
    } else {
      currentBlock.text += ' ' + trimmed
    }
  }

  // Handle unclosed code fence gracefully
  if (inCodeBlock && codeLines.length > 0) {
    flushBlock()
    blocks.push({
      type: 'code-block',
      language: codeLanguage || 'code',
      code: codeLines.join('\n'),
    })
  }

  flushBlock()
  return blocks
}

/**
 * Safely renders inline formatting (bold, italic, links, inline code, citations)
 * into native React elements without dangerouslySetInnerHTML.
 */
export function renderInlineMarkdown(text: string, sources: AnswerSource[]): React.ReactNode[] {
  if (!text) return []

  // Token pattern matches:
  // 1. Citation group: [1] or [1, 2]
  // 2. Markdown link: [Text](https://example.com)
  // 3. Bold-italic: ***text*** or ___text___
  // 4. Bold: **text** or __text__
  // 5. Inline code: `code`
  // 6. Italic: *text* or _text_
  const tokenPattern =
    /(\[\d+(?:\s*,\s*\d+)*\]|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n*]+\*|_[^_\n_]+_)/g

  const parts = text.split(tokenPattern)

  return parts.map((part, index) => {
    if (!part) return null

    // 1. Citation marker match: [1] or [1, 2]
    if (/^\[\d+(?:\s*,\s*\d+)*\]$/.test(part)) {
      const nums = part
        .slice(1, -1)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))

      return (
        <span key={`cite-group-${index}`} className="answer-citation-group">
          {nums.map((num) => {
            const sourceIndex = num - 1
            const source = sources[sourceIndex]
            if (!source) {
              return (
                <span key={`cite-invalid-${num}`} className="answer-citation-ref inert">
                  [{num}]
                </span>
              )
            }
            const safeUrl = sanitizeSafeUrl(source.destinationUrl || source.url)
            return (
              <a
                key={`cite-${num}-${sourceIndex}`}
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="answer-citation-ref"
                title={`${source.title || 'Source'} (${source.domain || ''})`}
                aria-label={`Citation [${num}]: ${source.title || source.domain || 'Source'}`}
              >
                [{num}]
              </a>
            )
          })}
        </span>
      )
    }

    // 2. Markdown link: [Anchor text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (linkMatch) {
      const anchorText = linkMatch[1].trim()
      const rawUrl = linkMatch[2].trim()
      const safeUrl = sanitizeSafeUrl(rawUrl)
      return (
        <a
          key={`link-${index}`}
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="answer-inline-link"
        >
          {anchorText}
        </a>
      )
    }

    // 3. Bold-italic: ***text*** or ___text___
    if (
      (part.startsWith('***') && part.endsWith('***') && part.length >= 6) ||
      (part.startsWith('___') && part.endsWith('___') && part.length >= 6)
    ) {
      return (
        <strong key={`bold-em-${index}`}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      )
    }

    // 4. Bold text: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return <strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>
    }

    // 5. Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={`code-${index}`} className="answer-inline-code">
          {part.slice(1, -1)}
        </code>
      )
    }

    // 6. Italics text: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return <em key={`em-${index}`}>{part.slice(1, -1)}</em>
    }

    // 7. Plain text fallback: Clean any leftover orphan "**" to prevent raw markdown leaks
    const sanitizedPart = part.replace(/\*\*/g, '')
    return sanitizedPart
  })
}
