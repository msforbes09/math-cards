import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DrillScreen } from "./drill-screen";
import type { Problem } from "@/src/domain/problem";

const twoCards: Problem[] = [
  { left: 7, right: 8 }, // 56
  { left: 2, right: 3 }, // 6
];

const answer = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  await user.type(screen.getByLabelText(/answer/i), `${value}{Enter}`);
};

describe("DrillScreen", () => {
  beforeEach(() => localStorage.clear());

  it("shows the first card and the progress position", () => {
    render(<DrillScreen problems={twoCards} />);
    expect(screen.getByTestId("factor-left")).toHaveTextContent("7");
    expect(screen.getByTestId("factor-right")).toHaveTextContent("8");
    expect(screen.getByTestId("progress")).toHaveTextContent("1 / 2");
  });

  it("advances to the next card on a correct answer", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={twoCards} />);
    await answer(user, "56");
    expect(screen.getByTestId("factor-left")).toHaveTextContent("2");
    expect(screen.getByTestId("progress")).toHaveTextContent("2 / 2");
  });

  it("clears the input between cards", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={twoCards} />);
    await answer(user, "56");
    expect(screen.getByLabelText(/answer/i)).toHaveValue("");
  });

  it("keeps the same card and says try again when wrong", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={twoCards} />);
    await answer(user, "12");
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toHaveTextContent("1 / 2");
    expect(screen.getByLabelText(/answer/i)).toHaveValue("");
  });

  it("reveals the answer after three wrong attempts", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={twoCards} />);
    for (let i = 0; i < 3; i++) await answer(user, "12");
    expect(screen.getByTestId("reveal")).toHaveTextContent("56");
  });

  it("only accepts the revealed answer to move on", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={twoCards} />);
    for (let i = 0; i < 3; i++) await answer(user, "12");
    await answer(user, "11");
    expect(screen.getByTestId("progress")).toHaveTextContent("1 / 2");
    await answer(user, "56");
    expect(screen.getByTestId("progress")).toHaveTextContent("2 / 2");
  });

  it("ignores an empty submission", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={twoCards} />);
    await user.type(screen.getByLabelText(/answer/i), "{Enter}");
    expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("progress")).toHaveTextContent("1 / 2");
  });

  it("refuses non-digit characters in the input", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={twoCards} />);
    await user.type(screen.getByLabelText(/answer/i), "abc");
    expect(screen.getByLabelText(/answer/i)).toHaveValue("");
  });

  it("shows the results when every card is done", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={[{ left: 7, right: 8 }]} />);
    await answer(user, "56");
    expect(await screen.findByTestId("score")).toHaveTextContent("1 / 1");
  });

  it("names the missed facts on the results screen", async () => {
    const user = userEvent.setup();
    render(<DrillScreen problems={[{ left: 7, right: 8 }]} />);
    await answer(user, "12");
    await answer(user, "56");
    expect(await screen.findByTestId("score")).toHaveTextContent("0 / 1");
    expect(screen.getByText(/7 × 8 = 56/)).toBeInTheDocument();
  });
});
