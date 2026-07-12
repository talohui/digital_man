import type { ReactNode } from 'react'

type ChatMarkdownProps = {
  content: string
}

type MarkdownBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'heading'; text: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }

const unorderedItemPattern = /^\s*[-*+]\s+(.+)$/
const orderedItemPattern = /^\s*\d+[.)]\s+(.+)$/
const headingPattern = /^\s{0,3}#{1,3}\s+(.+)$/

function parseBlocks(content: string): MarkdownBlock[] {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())

  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    const headingMatch = line.match(headingPattern)
    if (headingMatch) {
      blocks.push({ type: 'heading', text: headingMatch[1].trim() })
      index += 1
      continue
    }

    const unorderedItems: string[] = []
    while (index < lines.length) {
      const match = lines[index].match(unorderedItemPattern)
      if (!match) break
      unorderedItems.push(match[1].trim())
      index += 1
    }
    if (unorderedItems.length) {
      blocks.push({ type: 'unordered-list', items: unorderedItems })
      continue
    }

    const orderedItems: string[] = []
    while (index < lines.length) {
      const match = lines[index].match(orderedItemPattern)
      if (!match) break
      orderedItems.push(match[1].trim())
      index += 1
    }
    if (orderedItems.length) {
      blocks.push({ type: 'ordered-list', items: orderedItems })
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length) {
      const current = lines[index]
      if (!current.trim()) break
      if (headingPattern.test(current) || unorderedItemPattern.test(current) || orderedItemPattern.test(current)) {
        break
      }
      paragraphLines.push(current.trim())
      index += 1
    }

    if (paragraphLines.length) {
      blocks.push({ type: 'paragraph', lines: paragraphLines })
    }
  }

  return blocks
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let rest = text
  let key = 0

  while (rest.length) {
    const boldIndex = rest.indexOf('**')
    const codeIndex = rest.indexOf('`')
    const candidates = [boldIndex, codeIndex].filter((value) => value >= 0)
    const nextIndex = candidates.length ? Math.min(...candidates) : -1

    if (nextIndex < 0) {
      nodes.push(rest)
      break
    }

    if (nextIndex > 0) {
      nodes.push(rest.slice(0, nextIndex))
      rest = rest.slice(nextIndex)
      continue
    }

    if (rest.startsWith('**')) {
      const endIndex = rest.indexOf('**', 2)
      if (endIndex > 2) {
        nodes.push(<strong key={`strong-${key++}`}>{rest.slice(2, endIndex)}</strong>)
        rest = rest.slice(endIndex + 2)
        continue
      }
    }

    if (rest.startsWith('`')) {
      const endIndex = rest.indexOf('`', 1)
      if (endIndex > 1) {
        nodes.push(<code key={`code-${key++}`}>{rest.slice(1, endIndex)}</code>)
        rest = rest.slice(endIndex + 1)
        continue
      }
    }

    nodes.push(rest[0])
    rest = rest.slice(1)
  }

  return nodes
}

function renderLines(lines: string[]) {
  return lines.flatMap((line, lineIndex) => {
    const inlineNodes = renderInline(line)
    if (lineIndex === 0) return inlineNodes
    return [<br key={`br-${lineIndex}`} />, ...inlineNodes]
  })
}

function ChatMarkdown({ content }: ChatMarkdownProps) {
  const blocks = parseBlocks(content)

  if (!blocks.length) {
    return null
  }

  return (
    <div className="chat-bubble__content chat-markdown">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <p className="chat-markdown__heading" key={`${block.type}-${index}`}>
              {renderInline(block.text)}
            </p>
          )
        }

        if (block.type === 'unordered-list') {
          return (
            <ul key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item}`}>{renderInline(item)}</li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ordered-list') {
          return (
            <ol key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item}`}>{renderInline(item)}</li>
              ))}
            </ol>
          )
        }

        return <p key={`${block.type}-${index}`}>{renderLines(block.lines)}</p>
      })}
    </div>
  )
}

export default ChatMarkdown
