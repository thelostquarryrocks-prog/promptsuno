import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { MonkeyMethod } from "@/components/learn/MonkeyMethod"
import type { MonkeyMethod as MonkeyMethodData } from "@/content/learn/types"

const staticMethod: MonkeyMethodData = {
  id: "static-test",
  title: "Keep one anchor",
  summary: "A stable coaching idea.",
  kind: "static",
  tips: ["Hold one variable steady."],
}

const rotatingMethod: MonkeyMethodData = {
  id: "rotating-test",
  title: "Try one move",
  summary: "Optional rotating coaching.",
  kind: "rotating",
  tips: ["Tip one", "Tip two", "Tip three"],
}

describe("MonkeyMethod", () => {
  it("opens with the keyboard, closes on Escape, and remembers a static method", async () => {
    const user = userEvent.setup()
    render(<MonkeyMethod method={staticMethod} />)

    const trigger = screen.getByRole("button", { name: /open monkey method/i })
    trigger.focus()
    await user.keyboard("{Enter}")
    expect(screen.getByText("Hold one variable steady.")).toBeVisible()
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(window.localStorage.getItem("promptsuno:monkey-method:v1:static-test")).toBe("opened")

    await user.keyboard("{Escape}")
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("shows every rotating tip before starting another cycle", async () => {
    const user = userEvent.setup()
    const firstView = render(<MonkeyMethod method={rotatingMethod} />)
    await user.click(screen.getByRole("button", { name: /open monkey method/i }))

    const observed = [screen.getByText("Tip one").textContent]
    const next = screen.getByRole("button", { name: "Another idea" })
    await user.click(next)
    observed.push(screen.getByText("Tip two").textContent)
    firstView.unmount()

    render(<MonkeyMethod method={rotatingMethod} />)
    await user.click(screen.getByRole("button", { name: /open monkey method/i }))
    observed.push(screen.getByText("Tip three").textContent)

    expect(new Set(observed)).toEqual(new Set(rotatingMethod.tips))
    await user.click(screen.getByRole("button", { name: "Another idea" }))
    expect(screen.getByText("Tip one")).toBeVisible()
  })
})
