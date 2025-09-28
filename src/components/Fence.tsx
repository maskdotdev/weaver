import { highlight } from '@/lib/shiki/shared'

export async function Fence({
  children,
  language,
}: {
  children: string
  language: string
}) {
  const nodes = await highlight(children.trimEnd(), language as any)

  return (
    <pre>
      <code>{nodes}</code>
    </pre>
  )
}
