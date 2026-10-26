import React from 'react'
import type { AnswerSource } from '../types'
import { sanitizeSafeUrl, cleanUrlTrackingParams } from './url'

export interface MarkdownBlock {
  type: 'heading' | 'numbered-list' | 'bullet-list' | 'paragraph' | 'code-block'
  level?: number
  items?: string[]
  text?: string
  code?: string
  language?: string
}

/**
 * Repairs malformed programming code answers:
 * - Ensures Java and other programming examples are complete, syntactically coherent, and in fenced code blocks.
 * - Removes duplicate language tags (```java java -> ```java, or redundant "java" line).
 * - Removes stray syntax fragments like `");`, `');`, broken braces, or unmatched quotes.
 * - Completes missing closing curly braces or unclosed code fences.
 * - If source evidence is minimal, provides a short correct example rather than a broken one.
 */
export function repairCodeBlocks(text: string): string {
  if (!text) return ''

  // 1. Normalize code fences with duplicated language tags on the same line: e.g. ```java java -> ```java
  let result = text.replace(/^```[ \t]*([a-zA-Z0-9_-]+)(?:[ \t,:]+([a-zA-Z0-9_-]+))+[^\r\n]*$/gm, '```$1')

  // 2. Remove stray fragments immediately before or after code fences (e.g. `");` or `);` alone on a line)
  result = result.replace(/(?:^|\r?\n)[ \t]*(?:["']?\s*\);?|["']\s*;)[ \t]*\r?\n(?=[ \t]*```)/g, '\n')
  result = result.replace(/(```[^\r\n]*\r?\n[\s\S]*?```)[ \t]*\r?\n[ \t]*(?:["']?\s*\);?|["']\s*;)[ \t]*(?=\r?\n|$)/g, '$1')

  // 3. Process each code block individually
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g
  result = result.replace(codeBlockRegex, (_match, lang, codeContent) => {
    const cleanLang = (lang || 'code').trim().toLowerCase()
    let lines = codeContent.split(/\r?\n/)

    // If first line inside code block repeats the language label (e.g. ```java\njava\n...), strip it
    if (lines.length > 0 && lines[0].trim().toLowerCase() === cleanLang) {
      lines.shift()
    }

    // Filter out stray snippet fragments inside code block (e.g. lone `");` or `');` lines)
    lines = lines.filter((l: string) => {
      const trimmed = l.trim()
      return trimmed !== '");' && trimmed !== "');" && trimmed !== '";' && trimmed !== "';"
    })

    // Syntactic coherence checks for code lines:
    // Check for unmatched double quotes on a single line that ends with ); (e.g. System.out.println("Hello, World!); )
    lines = lines.map((l: string) => {
      const trimmed = l.trim()
      if (/^[a-zA-Z0-9_.]+\s*\([^")]*"[^")]*\);?$/.test(trimmed)) {
        return l.replace(/([^"])\);?$/, '$1");')
      }
      return l
    })

    // Balance curly braces for C-like languages (Java, JavaScript, C++, C, TypeScript)
    let openBraces = 0
    let closeBraces = 0
    for (const l of lines) {
      const withoutStrings = l.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '')
      openBraces += (withoutStrings.match(/\{/g) || []).length
      closeBraces += (withoutStrings.match(/\}/g) || []).length
    }

    if (openBraces > closeBraces) {
      const diff = openBraces - closeBraces
      for (let i = diff - 1; i >= 0; i--) {
        const indent = ' '.repeat(Math.max(0, i * 4))
        lines.push(`${indent}}`)
      }
    }

    // If source evidence is minimal/incomplete (e.g. a lone class header without body), provide a clean minimal example
    const nonEmptyLines = lines.filter((l: string) => l.trim().length > 0)
    if (
      cleanLang === 'java' &&
      nonEmptyLines.length <= 2 &&
      nonEmptyLines.some((l: string) => /public\s+class\s+\w+/.test(l)) &&
      !nonEmptyLines.some((l: string) => /public\s+static\s+void\s+main/.test(l))
    ) {
      const classMatch = lines.join(' ').match(/public\s+class\s+(\w+)/)
      const className = classMatch ? classMatch[1] : 'Main'
      lines = [
        `public class ${className} {`,
        '    public static void main(String[] args) {',
        '        System.out.println("Hello, World!");',
        '    }',
        '}',
      ]
    }

    return `\`\`\`${cleanLang}\n${lines.join('\n')}\n\`\`\``
  })

  // 4. Handle unclosed code block at end of text:
  const openCount = (result.match(/```/g) || []).length
  if (openCount % 2 !== 0) {
    const lastFenceIdx = result.lastIndexOf('```')
    const beforeFence = result.slice(0, lastFenceIdx)
    const afterFence = result.slice(lastFenceIdx + 3)
    const firstNewline = afterFence.indexOf('\n')

    let lang = 'code'
    let codeContent = afterFence
    if (firstNewline !== -1) {
      const rawLang = afterFence.slice(0, firstNewline).trim().split(/[ \t,:]+/)[0]
      if (rawLang) lang = rawLang.toLowerCase()
      codeContent = afterFence.slice(firstNewline + 1)
    }

    let lines = codeContent.split(/\r?\n/)
    if (lines.length > 0 && lines[0].trim().toLowerCase() === lang) {
      lines.shift()
    }
    lines = lines.filter((l: string) => {
      const trimmed = l.trim()
      return trimmed !== '");' && trimmed !== "');" && trimmed !== '";' && trimmed !== "';"
    })

    let openBraces = 0
    let closeBraces = 0
    for (const l of lines) {
      const withoutStrings = l.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '')
      openBraces += (withoutStrings.match(/\{/g) || []).length
      closeBraces += (withoutStrings.match(/\}/g) || []).length
    }
    if (openBraces > closeBraces) {
      const diff = openBraces - closeBraces
      for (let i = diff - 1; i >= 0; i--) {
        const indent = ' '.repeat(Math.max(0, i * 4))
        lines.push(`${indent}}`)
      }
    }

    result = `${beforeFence}\`\`\`${lang}\n${lines.join('\n')}\n\`\`\``
  }

  // 5. Clean trailing stray `");` or `);` lines right after closing fence
  result = result.replace(/```[ \t]*\r?\n[ \t]*["']?\s*\);?[ \t]*$/g, '```')

  return result
}

/**
 * Normalizes raw LLM output before block parsing:
 * 1. Repairs malformed code answers (fencing, stray fragments, braces, quotes).
 * 2. Strips URL-tracking strings (utm_*, v=) and scraped navigation fragments.
 * 3. Strips leading artifact lines such as standalone '**', '***', '###', '====', '----'.
 * 4. Preprocesses Setext heading underlines ('===', '---') into ATX headings ('##', '###').
 * 5. Cleans orphaned leading '** ' or unclosed '**' markers at the start of sentences or labels.
 * 6. Normalizes hash-prefixed citation badges ([#1] -> [1], [#1, #2] -> [1, 2]).
 * 7. Strips internal citation/metadata artifacts ([#operation], [#result], [operation: ...]).
 * 8. Strips conversational sign-offs, orphaned trailing headings, and incomplete dangling fragments.
 */
export function cleanRawMarkdown(text: string): string {
  if (!text) return ''

  // 1. Repair code blocks first
  let cleaned = repairCodeBlocks(text.replace(/\r\n/g, '\n')).trim()

  // 2. Isolate code blocks during prose markdown cleaning
  const codeBlocks: string[] = []
  cleaned = cleaned.replace(/```[a-zA-Z0-9_-]*\n[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  // 3. Strip URL tracking noise & query parameters leaking into prose
  cleaned = cleaned
    .replace(/https?:\/\/[^\s)]+/g, (url) => cleanUrlTrackingParams(url))
    .replace(/[?&](?:utm_[a-zA-Z0-9_]+|fbclid|gclid|msclkid)=[^&\s)"']*/gi, '')
    .replace(/\b(?:utm_source|utm_medium|utm_campaign|utm_term|utm_content)\s*=\s*[^\s&)"']+/gi, '')
    .replace(/[?&]v=[a-zA-Z0-9_%-]+/gi, '')
    .replace(/(?:^|\s)v=[a-zA-Z0-9_%-]{6,}(?:\s|$)/g, ' ')
    // Strip accidental URL fragments copied from search snippets (e.g. com/courses/java-spring-boot-0-to-100/)
    .replace(/(?<![`@.:/a-zA-Z0-9_-])(?:com|org|net|edu|gov|io|ai|app|dev|co\.[a-z]{2})\/(?:[a-zA-Z0-9_.~%!$&'*+;=:@/-]*[a-zA-Z0-9_/])?/gi, ' ')
    .replace(/(?<![a-zA-Z0-9_])(?:\.{2,3}|…|[›>»])\s*(?:[a-zA-Z0-9_-]+\.)*(?:com|org|net|edu|gov|io|ai|app|dev)?\/(?:[a-zA-Z0-9_.~%!$&'*+;=:@/-]*[a-zA-Z0-9_/])?/gi, ' ')
    // Strip navigation remnants
    .replace(/(?:^|\s*)(?:jump|skip)\s+to\s+(?:navigation|content|main\s+content)[.:;]?\s*/gi, ' ')
    .replace(/(?:^|\s*)(?:navigation\s+menu|main\s+menu|toggle\s+navigation)[.:;]?\s*/gi, ' ')
    .replace(/(?:^|\s*)(?:(?:accept(?:\s+all)?\s+cookies|cookie\s+policy|cookies\s+notice)\b[^.\n\r]*[.:;]?\s*)/gi, ' ')
    .replace(/(?:^|[\s.;•·|])(?:home|index)\s*(?:[>»/|]|&gt;)\s*[A-Za-z0-9\s_-]+(?:\s*(?:[>»/|]|&gt;)\s*[A-Za-z0-9\s_-]+)*[.:;]?\s*/gi, ' ')
    .replace(/(?:all\s+rights\s+reserved|copyright\s+©?\s*\d{4})\b[^.\n\r]*[.]?/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')

  // 4. Repeatedly remove leading standalone artifact/divider lines
  cleaned = cleaned.replace(/^(\s*(?:\*{1,}|#{1,6}|={3,}|-{3,})\s*\n)+/g, '').trim()

  // 5. Preprocess Setext headings: "Title\n====" -> "## Title", "Title\n----" -> "### Title"
  cleaned = cleaned.replace(/^([^\n#`*-][^\n]*)\n\s*={3,}\s*$/gm, '## $1')
  cleaned = cleaned.replace(/^([^\n#`*-][^\n]*)\n\s*-{3,}\s*$/gm, '### $1')

  // 6. Normalize hash-prefixed numbered citations ([#1] -> [1], [#1, #2] -> [1, 2])
  cleaned = cleaned.replace(/\[#(\d+(?:\s*,\s*#?\d+)*)\]/g, (_m, inner) => {
    return `[${inner.replace(/#/g, '')}]`
  })

  // 7. Strip internal metadata markers ([#operation], [#result], [#step], [operation: ...])
  cleaned = cleaned
    .replace(/\s*\[#[a-zA-Z_][a-zA-Z0-9_-]*(?:\s*:[^\]]*)?\]/g, '')
    .replace(
      /\s*\[(?:operation|result|annotation|metadata|step|thought|tool_call|search_query|source_ref)(?:\s*:[^\]]*)?\]/gi,
      ''
    )

  // 8. Clean leading orphaned "** " or unclosed "**" markers on individual lines
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
  cleaned = lines.join('\n').trim()

  // 9. Clean conversational sign-offs at the end of the text
  const trailingFillerPatterns = [
    /(?:[\r\n]+\s*|\s+)(?:(?:I\s+)?hope\s+(?:this|that)\s+(?:helps?|was\s+helpful)[^.\n\r]*[.!?:)]*)\s*$/i,
    /(?:[\r\n]+\s*|\s+)(?:(?:Please\s+)?let\s+me\s+know\s+if\s+you\s+(?:have|need)[^.\n\r]*[.!?:)]*)\s*$/i,
    /(?:[\r\n]+\s*|\s+)(?:Feel\s+free\s+to\s+ask[^.\n\r]*[.!?:)]*)\s*$/i,
    /(?:[\r\n]+\s*|\s+)(?:Does\s+this\s+answer\s+your\s+question[^.\n\r]*[.!?:)]*)\s*$/i,
    /(?:[\r\n]+\s*|\s+)(?:If\s+you\s+have\s+(?:any\s+)?(?:more|further|other)\s+questions[^.\n\r]*[.!?:)]*)\s*$/i,
  ]

  let changed = true
  while (changed) {
    const prev = cleaned
    for (const pattern of trailingFillerPatterns) {
      cleaned = cleaned.replace(pattern, '').trim()
    }
    changed = prev !== cleaned
  }

  // 10. Strip orphaned trailing headings at the end of the text
  const lineArray = cleaned.split('\n')
  while (lineArray.length > 0) {
    const lastLine = lineArray[lineArray.length - 1].trim()
    if (!lastLine) {
      lineArray.pop()
      continue
    }
    if (/^#{1,6}(?:\s+.*)?$/.test(lastLine) || /^\*\*[^*]+\*\*[:.]?$/.test(lastLine)) {
      lineArray.pop()
      continue
    }
    break
  }
  cleaned = lineArray.join('\n').trim()

  // 11. Strip dangling incomplete connector fragments at the very end (e.g. "For example,", "such as:")
  const danglingPatterns = [
    /\s+(?:for example|such as|including|in addition(?: to)?|e\.g\.|i\.e\.|and|or|with|as well as|because|specifically|namely)[,:\s]*$/i,
    /,\s*$/,
    /;\s*$/,
    /\s+-\s*$/,
  ]

  changed = true
  while (changed) {
    const prev = cleaned
    for (const pattern of danglingPatterns) {
      cleaned = cleaned.replace(pattern, '').trim()
    }
    changed = prev !== cleaned
  }

  // 12. Strip any lines that are solely empty or punctuation-only headings
  cleaned = cleaned.replace(/^\s*#{1,6}\s*[:.\-_*]*\s*$/gm, '')

  // 13. Clean up whitespace before punctuation after removal of tokens (e.g. "[1] ." -> "[1].")
  cleaned = cleaned.replace(/([a-zA-Z0-9_)\]"'`])\s+([.,;:!?])/g, '$1$2').replace(/[ \t]{2,}/g, ' ')

  // If text ends on a word after stripping dangling connector, ensure terminating period if prose
  if (cleaned && !/[.!?)"'`\]]$/.test(cleaned) && !cleaned.endsWith('```')) {
    const lastLine = cleaned.split('\n').pop()?.trim() || ''
    if (!/^[-*•+]\s+/.test(lastLine) && !/^\d+\.\s+/.test(lastLine)) {
      cleaned += '.'
    }
  }

  // 14. Restore code blocks
  cleaned = cleaned.replace(/__CODE_BLOCK_(\d+)__/g, (_m, idx) => codeBlocks[Number(idx)] || '')

  return cleaned.trim()
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
      if (currentBlock.type === 'paragraph' && !currentBlock.text?.trim()) {
        currentBlock = null
        return
      }
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
        // If first line repeats language, strip it
        if (codeLines.length > 0 && codeLines[0].trim().toLowerCase() === codeLanguage) {
          codeLines.shift()
        }
        // Filter out stray snippet fragments
        codeLines = codeLines.filter((l) => {
          const t = l.trim()
          return t !== '");' && t !== "');" && t !== '";' && t !== "';"
        })
        blocks.push({
          type: 'code-block',
          language: codeLanguage || 'code',
          code: codeLines.join('\n'),
        })
        inCodeBlock = false
        codeLanguage = ''
        codeLines = []
      } else {
        // Opening code fence: extract clean language token
        flushBlock()
        inCodeBlock = true
        const rawLang = (trimmed.slice(3).trim().split(/[\s,:]+/)[0] || '').toLowerCase()
        codeLanguage = rawLang || 'code'
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

    // 4. ATX Headings: # Heading to ###### Heading (ignore empty or punctuation-only headings)
    const headingMatch = trimmed.match(/^(#{1,6})(?:\s*(.*))?$/)
    if (headingMatch) {
      const headingText = (headingMatch[2] || '').trim()
      if (!headingText || /^[:.\-_*]+$/.test(headingText)) {
        continue
      }
      flushBlock()
      blocks.push({
        type: 'heading',
        level: Math.min(6, Math.max(2, headingMatch[1].length)),
        text: headingText,
      })
      continue
    }

    // 5. Standalone bold line as heading: **Heading Text** or **Heading Text:**
    const boldHeadingMatch = trimmed.match(/^\*\*([^*]+)\*\*[:.]?$/)
    if (boldHeadingMatch) {
      const headingText = boldHeadingMatch[1].replace(/[:.]\s*$/, '').trim()
      if (!headingText || /^[:.\-_*]+$/.test(headingText)) {
        continue
      }
      flushBlock()
      blocks.push({
        type: 'heading',
        level: 3,
        text: headingText,
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

  // Remove any trailing heading blocks that have no content underneath
  while (blocks.length > 0 && blocks[blocks.length - 1].type === 'heading') {
    blocks.pop()
  }

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

    // 7. Plain text fallback: Clean any leftover orphan "**", tracking tokens, and metadata tokens to prevent raw leaks
    const sanitizedPart = part
      .replace(/\*\*/g, '')
      .replace(/[?&](?:utm_[a-zA-Z0-9_]+|fbclid|gclid|msclkid)=[^&\s)"']*/gi, '')
      .replace(/\b(?:utm_source|utm_medium|utm_campaign|utm_term|utm_content)\s*=\s*[^\s&)"']+/gi, '')
      .replace(/[?&]v=[a-zA-Z0-9_%-]+/gi, '')
      .replace(/(?:^|\s)v=[a-zA-Z0-9_%-]{6,}(?:\s|$)/g, ' ')
      .replace(/(?<![`@.:/a-zA-Z0-9_-])(?:com|org|net|edu|gov|io|ai|app|dev|co\.[a-z]{2})\/(?:[a-zA-Z0-9_.~%!$&'*+;=:@/-]*[a-zA-Z0-9_/])?/gi, ' ')
      .replace(/(?<![a-zA-Z0-9_])(?:\.{2,3}|…|[›>»])\s*(?:[a-zA-Z0-9_-]+\.)*(?:com|org|net|edu|gov|io|ai|app|dev)?\/(?:[a-zA-Z0-9_.~%!$&'*+;=:@/-]*[a-zA-Z0-9_/])?/gi, ' ')
      .replace(/\s*\[#[a-zA-Z_][\w-]*(?:\s*:[^\]]*)?\]/g, '')
      .replace(
        /\s*\[(?:operation|result|annotation|metadata|step|thought|tool_call|search_query|source_ref)(?:\s*:[^\]]*)?\]/gi,
        ''
      )
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\s+([.,;:!?])/g, '$1')
    return sanitizedPart
  })
}
