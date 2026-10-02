export type LearnPillar = "build" | "fix"

export type LearnSource = {
  id: string
  title: string
  href?: string
  kind: "official" | "research"
  note: string
}

export type MonkeyMethod = {
  id: string
  title: string
  summary: string
  kind: "static" | "rotating"
  tips: readonly string[]
}

export type LearnBlock =
  | {
      type: "fast-answer"
      title: string
      body: string
      points?: readonly string[]
    }
  | {
      type: "why"
      title: string
      body: readonly string[]
    }
  | {
      type: "workflow"
      title: string
      steps: readonly { title: string; body: string }[]
    }
  | {
      type: "example"
      title: string
      label: string
      prompt: string
      explanation: string
    }
  | {
      type: "comparison"
      title: string
      before: { label: string; text: string }
      after: { label: string; text: string }
      takeaway: string
    }
  | {
      type: "caveat"
      title: string
      body: string
      tone: "note" | "warning"
    }
  | {
      type: "mistakes"
      title: string
      items: readonly { title: string; fix: string }[]
    }
  | {
      type: "advanced"
      title: string
      intro: string
      items: readonly { title: string; body: string }[]
    }
  | {
      type: "monkey-method"
      method: MonkeyMethod
    }

export type LearnAction = {
  pillar: LearnPillar
  title: string
  description: string
  href: string
}

export type LearnPage = {
  slug: string
  number: string
  title: string
  shortTitle: string
  description: string
  question: string
  readTime: string
  accent: "violet" | "cyan" | "amber" | "rose" | "lime"
  blocks: readonly LearnBlock[]
  sources: readonly LearnSource[]
  related: readonly string[]
  actions: readonly LearnAction[]
}
