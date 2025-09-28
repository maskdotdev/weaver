'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { BundledLanguage } from 'shiki/bundle/web'
import { highlight } from '@/lib/shiki/shared'
import clsx from 'clsx'

interface CodeSnippetItem {
  name: string
  code: string
  language: string
  isActive: boolean
  initial?: JSX.Element | null
}

interface CodeSnippetProps {
  snippets: CodeSnippetItem[]
  onTabChange?: (index: number) => void
  scrambleDuration?: number
}

function TrafficLightsIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 42 10" fill="none" {...props}>
      <circle cx="5" cy="5" r="4.5" />
      <circle cx="21" cy="5" r="4.5" />
      <circle cx="37" cy="5" r="4.5" />
    </svg>
  )
}

export function CodeSnippet({
  snippets,
  onTabChange,
  scrambleDuration = 500,
}: CodeSnippetProps) {
  const [activeIndex, setActiveIndex] = useState(
    snippets.findIndex((s) => s.isActive),
  )
  const [isScrambling, setIsScrambling] = useState(false)
  const [displayCode, setDisplayCode] = useState(
    snippets[activeIndex]?.code || '',
  )
  const [nodes, setNodes] = useState<JSX.Element | null>(
    snippets[activeIndex]?.initial ?? null,
  )
  const latestRequest = useRef(0)

  useEffect(() => {
    const activeSnippet = snippets[activeIndex]
    if (!activeSnippet) return

    const target = activeSnippet.code
    const glyphs = '!@#$%^&*()_+-=[]{}|;:,./<>?~abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const duration = Math.max(120, scrambleDuration)

    setIsScrambling(true)

    const len = target.length
    const thresholds = Array.from({ length: len }, () => Math.random() * 0.8 + 0.1)
    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      let out = ''
      for (let i = 0; i < len; i++) {
        const ch = target[i]
        if (ch === '\n') {
          out += '\n'
          continue
        }
        if (ch === ' ' || ch === '\t' || t >= thresholds[i]) {
          out += ch
        } else {
          out += glyphs[(Math.random() * glyphs.length) | 0]
        }
      }
      setDisplayCode(out)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setDisplayCode(target)
        setIsScrambling(false)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [activeIndex, snippets, scrambleDuration])

  useEffect(() => {
    const currentSnippet = snippets[activeIndex]
    if (!currentSnippet) return
    // If server provided an initial highlighted tree for this snippet, use it once.
    if (currentSnippet.initial && nodes == null) {
      setNodes(currentSnippet.initial)
      return
    }

    const reqId = ++latestRequest.current
    void highlight(currentSnippet.code, currentSnippet.language as BundledLanguage)
      .then((res) => {
        if (latestRequest.current === reqId) setNodes(res)
      })
      .catch(() => {
        if (latestRequest.current === reqId) setNodes(null)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, snippets])

  const handleTabClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index)
      onTabChange?.(index)
    }
  }

  const currentSnippet = snippets[activeIndex]
  if (!currentSnippet) return null

  const lineCount = currentSnippet.code.split('\n').length

  return (
    <div className="relative rounded-2xl bg-[#0A101F]/80 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="absolute -top-px right-11 left-20 h-px bg-linear-to-r from-sky-300/0 via-sky-300/70 to-sky-300/0" />
      <div className="absolute right-20 -bottom-px left-11 h-px bg-linear-to-r from-blue-400/0 via-blue-400 to-blue-400/0" />
      <div className="pt-4 pl-4">
        <TrafficLightsIcon className="h-2.5 w-auto stroke-slate-500/30" />
        <div className="mt-4 flex space-x-2 text-xs">
          {snippets.map((snippet, index) => (
            <div
              key={snippet.name}
              className={clsx(
                'flex h-6 cursor-pointer rounded-full',
                index === activeIndex
                  ? 'bg-linear-to-r from-sky-400/30 via-sky-400 to-sky-400/30 p-px font-medium text-sky-300'
                  : 'text-slate-500',
              )}
              onClick={() => handleTabClick(index)}
            >
              <div
                className={clsx(
                  'flex items-center rounded-full px-2.5',
                  index === activeIndex && 'bg-slate-800',
                )}
              >
                {snippet.name}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start px-1 text-sm">
          <div
            aria-hidden="true"
            className="border-r border-slate-300/5 pr-4 font-mono text-slate-600 select-none"
          >
            {Array.from({ length: lineCount }).map((_, index) => (
              <Fragment key={index}>
                {(index + 1).toString().padStart(2, '0')}
                <br />
              </Fragment>
            ))}
          </div>
          <div className="relative overflow-hidden">
            <pre
              className={clsx(
                'flex overflow-x-auto pb-6 transition-opacity duration-200',
                isScrambling && 'opacity-70',
              )}
            >
              <code className="px-4 text-white">
                {isScrambling || !nodes ? (
                  <>{displayCode}</>
                ) : (
                  nodes
                )}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
