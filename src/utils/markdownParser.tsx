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

export const COLLAPSED_HEIGHT_PX = 280
export const EXPANSION_THRESHOLD_PX = 340

/**
 * Evaluates whether an answer container genuinely overflows the available space
 * and warrants a Show More / Show Less toggle control.
 *
 * Rules:
 * - Short answers (<= 280px) and Medium answers (280px - 340px) fit naturally: isTruncated = false (no toggle button).
 * - Long answers (> 340px) genuinely overflow: isTruncated = true, collapsed at COLLAPSED_HEIGHT_PX (280px).
 */
export function evaluateAnswerTruncation(scrollHeight: number): {
  isTruncated: boolean
  collapsedHeight: number
} {
  const isTruncated = typeof scrollHeight === 'number' && scrollHeight > EXPANSION_THRESHOLD_PX
  return {
    isTruncated,
    collapsedHeight: COLLAPSED_HEIGHT_PX,
  }
}

/**
 * Strips raw model wrapper tags (<markdown>, </markdown>, <think>...</think>, <answer>...</answer>, etc.)
 * that local models like Llama 3.2 emit around output or reasoning blocks.
 */
export function stripModelWrapperTags(text: string): string {
  if (!text || typeof text !== 'string') return ''

  return text
    // 1. Strip reasoning/thinking blocks
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think\b[^>]*>/gi, '')
    // 2. Strip raw <markdown>...</markdown> wrappers
    .replace(/<\/?markdown\b[^>]*>/gi, '')
    // 3. Strip <answer>...</answer>, <response>...</response>, <output>...</output>
    .replace(/<\/?(?:answer|response|content|result|output)\b[^>]*>/gi, '')
    // 4. Strip echoed <untrusted_search_results> block if any
    .replace(/<untrusted_search_results>[\s\S]*?<\/untrusted_search_results>/gi, '')
    .replace(/<\/?untrusted_search_results\b[^>]*>/gi, '')
    .trim()
}

/**
 * Repairs malformed programming code answers:
 * - Ensures Java and other programming examples are complete, syntactically coherent, and in fenced code blocks.
 * - Removes duplicate language tags (```java java -> ```java, or redundant "java" line).
 * - Removes stray syntax fragments like `");`, `');`, broken braces, or unmatched quotes.
 * - Completes missing closing curly braces or unclosed code fences.
 * - If source evidence is minimal, provides a short correct example rather than a broken one.
 */
/**
 * Detects if a user query is asking for programming assistance, code examples, or software engineering concepts.
 */
export function isProgrammingQuery(query?: string): boolean {
  if (!query || typeof query !== 'string') return false
  const q = query.trim().toLowerCase()
  if (!q) return false

  // Exceptions for queries using terms like "java" or "python" in geographical, biological, or food contexts
  const isGeographicalOrBiological =
    /\b(?:island\s+of\s+java|java\s+island|java\s+sea|java\s+sparrow|java\s+rhino|java\s+indonesia|coffee\s+bean|coffee\s+roast|burmese\s+python|ball\s+python|reticulated\s+python|python\s+snake)\b/i.test(q)
  if (isGeographicalOrBiological && !/\b(?:code|programming|script|class|function|syntax|developer|software)\b/i.test(q)) {
    return false
  }

  // Known programming languages (handling c++ and c# where trailing non-word chars break \b)
  const languagePattern =
    /\b(?:java|python|javascript|typescript|cpp|csharp|golang|rust|ruby|php|swift|kotlin|scala|sql|html|css|bash|powershell|perl|dart|r\s+programming)\b|(?:\b(?:c\+\+|c#)(?!\w))/i

  // Programming actions, syntax concepts, and keywords
  const actionPattern =
    /\b(?:code|coding|program|programming|script|syntax|compile|compiler|runtime|debugging|debug|exception|stack\s*trace|algorithm|data\s+structure|binary\s+search|implement|implementation|regex|regular\s+expression|api|sdk|library|framework|function|method|variable|class|interface|inheritance|polymorphism|encapsulation|recursion|array|pointer|json|xml|async|await|promise|loop|import|export|react|angular|vue|node\.?js|spring\s+boot|django|flask|fastapi)\b/i

  // Colloquial Hinglish coding phrases
  const colloquialCodingPattern =
    /\b(?:code\s+(?:de|do|likho|likhein|banao|samjhao)|program\s+(?:banao|karo|likho)|syntax\s+kya\s+hai)\b/i

  // Devanagari Hindi coding terms
  const devanagariCodingPattern = /(?:कोड|प्रोग्राम|सिंटैक्स|इनहेरिटेंस|कंपाइलर|फंक्शन|क्लास)/

  return languagePattern.test(q) || actionPattern.test(q) || colloquialCodingPattern.test(q) || devanagariCodingPattern.test(q)
}

/**
 * Ensures Java code examples are complete, demonstrate requested concepts like inheritance,
 * and include a runnable main() method.
 */
function ensureRunnableJavaMain(
  lines: string[],
  cleanLang: string,
  isJavaInheritanceContext: boolean
): string[] {
  if (cleanLang !== 'java') return lines

  const joined = lines.join('\n')
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0)

  // 1. Lone class header stub without body, methods, or inheritance
  if (
    nonEmptyLines.length <= 2 &&
    /^\s*public\s+class\s+\w+\s*\{?\s*$/.test(nonEmptyLines[0] || '') &&
    (nonEmptyLines.length === 1 || /^\s*\}\s*$/.test(nonEmptyLines[1] || ''))
  ) {
    if (isJavaInheritanceContext) {
      return [
        '// Parent class (Superclass)',
        'class Animal {',
        '    void eat() {',
        '        System.out.println("This animal eats food.");',
        '    }',
        '}',
        '',
        '// Child class (Subclass) inheriting from Animal',
        'class Dog extends Animal {',
        '    void bark() {',
        '        System.out.println("The dog barks.");',
        '    }',
        '}',
        '',
        'public class Main {',
        '    public static void main(String[] args) {',
        '        Dog myDog = new Dog();',
        '        myDog.eat(); // Inherited method from Animal',
        '        myDog.bark(); // Subclass own method',
        '    }',
        '}',
      ]
    }

    const classMatch = lines.join(' ').match(/public\s+class\s+(\w+)/)
    const className = classMatch ? classMatch[1] : 'Main'
    return [
      `public class ${className} {`,
      '    public static void main(String[] args) {',
      '        System.out.println("Hello, World!");',
      '    }',
      '}',
    ]
  }

  // 2. Inheritance code block missing a runnable main() method
  const hasInheritance = lines.some((l) => /\bclass\s+\w+\s+extends\s+\w+/.test(l))
  const hasMain = lines.some((l) => /public\s+static\s+void\s+main/.test(l))

  if (hasInheritance && !hasMain) {
    const subClassMatch = joined.match(/\bclass\s+([A-Za-z0-9_]+)\s+extends\s+([A-Za-z0-9_]+)/)
    if (subClassMatch) {
      const subClass = subClassMatch[1]
      const varName = subClass.charAt(0).toLowerCase() + subClass.slice(1)

      // Find zero-argument method names defined in the classes
      const methodMatches = [...joined.matchAll(/(?:void|[A-Za-z0-9_<>]+)\s+([a-z][A-Za-z0-9_]*)\s*\(\s*\)\s*\{/g)].map(
        (m) => m[1]
      )
      const excluded = new Set(['main', 'if', 'for', 'while', 'switch', 'catch', 'super', 'this'])
      const methodNames = [...new Set(methodMatches.filter((m) => !excluded.has(m)))]
      const calls = methodNames.slice(0, 3).map((m) => `        ${varName}.${m}();`)

      const hasPublicClass = lines.some((l) => /public\s+class\s+\w+/.test(l))
      const mainClassDecl = hasPublicClass ? 'class Main {' : 'public class Main {'

      const mainLines = [
        '',
        mainClassDecl,
        '    public static void main(String[] args) {',
        `        ${subClass} ${varName} = new ${subClass}();`,
        ...calls,
        '    }',
        '}',
      ]

      return [...lines, ...mainLines]
    }
  }

  return lines
}

/**
 * Repairs malformed programming code answers:
 * - Ensures Java and other programming examples are complete, syntactically coherent, and in fenced code blocks.
 * - Removes duplicate language tags (```java java -> ```java, or redundant "java" line).
 * - Removes stray syntax fragments like `");`, `');`, broken braces, or unmatched quotes.
 * - Completes missing closing curly braces or unclosed code fences.
 * - If source evidence is minimal, provides a short correct example rather than a broken one.
 */
export function repairCodeBlocks(text: string, query?: string): string {
  if (!text) return ''

  const isCoding = query ? isProgrammingQuery(query) : true
  const isJavaInheritanceContext = query
    ? isCoding && /java\b/i.test(query) && (/inheritance/i.test(query) || /इनहेरिटेंस/.test(query))
    : (/inheritance/i.test(text) || /इनहेरिटेंस/.test(text)) && /java\b/i.test(text)

  // 1. Normalize code fences with duplicated language tags on the same line: e.g. ```java java -> ```java
  let result = text.replace(/^```[ \t]*([a-zA-Z0-9_#+-]+)(?:[ \t,:]+([a-zA-Z0-9_#+-]+))+[^\r\n]*$/gm, '```$1')

  // 2. Remove stray fragments immediately before or after code fences (e.g. `");` or `);` alone on a line)
  result = result.replace(/(?:^|\r?\n)[ \t]*(?:["']?\s*\);?|["']\s*;)[ \t]*\r?\n(?=[ \t]*```)/g, '\n')
  result = result.replace(/(```[^\r\n]*\r?\n[\s\S]*?```)[ \t]*\r?\n[ \t]*(?:["']?\s*\);?|["']\s*;)[ \t]*(?=\r?\n|$)/g, '$1')

  // 3. Process each code block individually
  const codeBlockRegex = /```([a-zA-Z0-9_#+-]*)[ \t]*\r?\n([\s\S]*?)```/g
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
      const withoutStringsOrComments = l
        .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '')
        .replace(/\/\/.*$/, '')
      openBraces += (withoutStringsOrComments.match(/\{/g) || []).length
      closeBraces += (withoutStringsOrComments.match(/\}/g) || []).length
    }

    if (openBraces > closeBraces) {
      const diff = openBraces - closeBraces
      for (let i = diff - 1; i >= 0; i--) {
        const indent = ' '.repeat(Math.max(0, i * 4))
        lines.push(`${indent}}`)
      }
    }

    // Ensure runnable Java code and demonstrate inheritance when applicable
    lines = ensureRunnableJavaMain(lines, cleanLang, isJavaInheritanceContext)

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
      const withoutStringsOrComments = l
        .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '')
        .replace(/\/\/.*$/, '')
      openBraces += (withoutStringsOrComments.match(/\{/g) || []).length
      closeBraces += (withoutStringsOrComments.match(/\}/g) || []).length
    }
    if (openBraces > closeBraces) {
      const diff = openBraces - closeBraces
      for (let i = diff - 1; i >= 0; i--) {
        const indent = ' '.repeat(Math.max(0, i * 4))
        lines.push(`${indent}}`)
      }
    }

    lines = ensureRunnableJavaMain(lines, lang, isJavaInheritanceContext)

    result = `${beforeFence}\`\`\`${lang}\n${lines.join('\n')}\n\`\`\``
  }

  // 5. Clean trailing stray `");` or `);` lines right after closing fence
  result = result.replace(/```[ \t]*\r?\n[ \t]*["']?\s*\);?[ \t]*$/g, '```')

  return result
}

/**
 * Corrects programming inaccuracies in AI synthesized answers:
 * - Ensures Java is never described as supporting multiple inheritance of classes.
 * - Explains that Java avoids ambiguity (such as the diamond problem) by not supporting multiple class inheritance,
 *   and supports implementing multiple interfaces instead.
 */
export function correctProgrammingInaccuracies(text: string, languageStyle?: string): string {
  if (!text) return ''

  // Isolate fenced code blocks to ensure code identifiers/comments are never modified
  const codeBlocks: string[] = []
  let masked = text.replace(/```[a-zA-Z0-9_#+-]*[ \t]*\r?\n[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  const style = languageStyle || 'english'

  let replacement: string
  if (style === 'hinglish') {
    replacement = 'Java classes ke multiple inheritance ko support nahi karta (diamond problem se bachne ke liye); balki Java multiple interfaces implement karne ki suvidha deta hai'
  } else if (style === 'hindi') {
    replacement = 'Java classes के multiple inheritance को support नहीं करता (diamond problem से बचने के लिए); इसके बजाय Java multiple interfaces implement करने की सुविधा देता है'
  } else {
    replacement = 'Java does not support multiple inheritance of classes (to avoid ambiguity like the diamond problem); instead, Java supports implementing multiple interfaces'
  }

  // Patterns that falsely assert Java supports multiple inheritance of classes
  const falseClassInheritancePatterns = [
    // "Java supports/allows/enables/provides multiple inheritance of classes" / "through classes" / "with classes" / "using classes"
    /(?<!(?:not|n't|never|no|doesn't|does\s+not|cannot|won't)\s+)\b(?:Java|java)\s+(?:supports?|allows?|enables?|provides?)\s+multiple\s+inheritance\s+(?:of|through|with|using)\s+classes/gi,
    // "Java supports/allows multiple class inheritance"
    /(?<!(?:not|n't|never|no|doesn't|does\s+not|cannot|won't)\s+)\b(?:Java|java)\s+(?:supports?|allows?|enables?|provides?)\s+multiple\s+class\s+inheritance/gi,
    // "multiple inheritance of classes is supported/allowed/possible in Java"
    /(?:In\s+Java,?\s+)?multiple\s+inheritance\s+of\s+classes\s+is\s+(?:supported|allowed|possible)(?!\s+not)/gi,
    // "Java allows/lets a class to extend multiple classes"
    /(?<!(?:not|n't|never|no|doesn't|does\s+not|cannot|won't)\s+)\b(?:Java|java)\s+(?:allows?|lets?)\s+(?:a\s+class\s+to\s+)?(?:extend|inherit\s+from)\s+multiple\s+classes/gi,
    // "a class in Java can extend multiple classes"
    /(?<!(?:not|n't|never|no|cannot)\s+)\b(?:a\s+class\s+in\s+Java\s+can\s+(?:extend|inherit\s+from)\s+multiple\s+classes)/gi,
    // Hinglish patterns
    /(?<!(?:nahi|nahin|mat)\s+)\b(?:Java|java)\s+(?:classes\s+ka\s+multiple\s+inheritance|multiple\s+inheritance\s+of\s+classes)\s+support\s+karta\s+hai/gi,
    /(?<!(?:nahi|nahin|mat)\s+)\b(?:Java|java)\s+(?:mein\s+)?classes\s+multiple\s+inheritance\s+support\s+karti\s+hain/gi,
    // Hindi patterns
    /(?<!(?:नहीं|न|मत)\s+)(?:जावा|Java)\s+(?:क्लासेज\s+के\s+मल्टीपल\s+इनहेरिटेंस\s+को|मल्टीपल\s+क्लास\s+इनहेरिटेंस\s+को)\s+सपोर्ट\s+करता\s+है/gi,
  ]

  for (const pattern of falseClassInheritancePatterns) {
    masked = masked.replace(pattern, replacement)
  }

  // Also catch unqualified statements: "Java supports multiple inheritance." without mentioning interfaces or negation
  const unqualifiedMultipleInheritance = /(?<!(?:not|n't|never|no|doesn't|does\s+not|cannot|won't)\s+)\b(?:Java|java)\s+(?:supports?|allows?)\s+multiple\s+inheritance\b(?!\s+(?:only\s+)?(?:through|via|by|using)\s+interfaces?)(?!\s+(?:is\s+not|is\s+unsupported))/gi
  masked = masked.replace(unqualifiedMultipleInheritance, replacement)

  // Restore code blocks
  return masked.replace(/__CODE_BLOCK_(\d+)__/g, (_m, idx) => codeBlocks[Number(idx)] || '')
}

/**
 * Normalizes raw LLM output before block parsing:
 * 1. Corrects programming inaccuracies (e.g. Java multiple class inheritance claims).
 * 2. Repairs malformed code answers (fencing, stray fragments, braces, quotes, runnable main).
 * 3. Strips URL-tracking strings (utm_*, v=) and scraped navigation fragments.
 * 4. Strips leading artifact lines such as standalone '**', '***', '###', '====', '----'.
 * 5. Preprocesses Setext heading underlines ('===', '---') into ATX headings ('##', '###').
 * 6. Cleans orphaned leading '** ' or unclosed '**' markers at the start of sentences or labels.
 * 7. Normalizes hash-prefixed citation badges ([#1] -> [1], [#1, #2] -> [1, 2]).
 * 8. Strips internal citation/metadata artifacts ([#operation], [#result], [operation: ...]).
 * 9. Strips conversational sign-offs, orphaned trailing headings, and incomplete dangling fragments.
 */
export function cleanRawMarkdown(text: string, query?: string): string {
  if (!text) return ''

  // 0. Strip raw model wrapper tags (<markdown>, <think>, <answer>, etc.)
  let cleaned = stripModelWrapperTags(text)

  // 1. Correct programming inaccuracies first
  cleaned = correctProgrammingInaccuracies(cleaned)

  // 2. Repair code blocks
  cleaned = repairCodeBlocks(cleaned.replace(/\r\n/g, '\n'), query).trim()

  // 3. Strip unsolicited Java code blocks from non-programming answers
  if (query && !isProgrammingQuery(query)) {
    cleaned = cleaned.replace(/```(?:java|code)?[ \t]*\r?\n[\s\S]*?(?:public\s+class|class\s+\w+|System\.out\.print)[\s\S]*?```/gi, '').trim()
  }

  // 2. Isolate code blocks during prose markdown cleaning
  const codeBlocks: string[] = []
  cleaned = cleaned.replace(/```[a-zA-Z0-9_#+-]*[ \t]*\r?\n[\s\S]*?```/g, (match) => {
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
export function parseMarkdownBlocks(rawText: string, query?: string): MarkdownBlock[] {
  const cleaned = cleanRawMarkdown(rawText, query)
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
    const codeFenceMatch = trimmed.match(/^```([a-zA-Z0-9_#+-]*)/)
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
