import assert from "node:assert/strict";
import { test } from "node:test";
import { groundInterviewIdeas } from "./idea-generation";
import { GenerateInterviewIdeasResponse } from "@workspace/api-zod";

const notes = 'Interview 1\n"I spend hours on invoices."';
function result() {
  return GenerateInterviewIdeasResponse.parse({
    ideas: [{
      title: "Invoices", problem: "I spend hours on invoices.",
      participantCount: 1, participants: [{ label: "Interview 1", excerpt: notes }],
      quotes: [{ text: "I spend hours on invoices.", participant: "Interview 1" }],
      evidenceCaveat: "", targetSegment: "Not established", painIntensity: "Not established",
      solution: "Try a manual reminder service.", workarounds: "Not established",
      willingnessToPay: "Not established", riskiestAssumption: "This repeats",
      cheapestTest: "Ask about the previous invoice.", painSeverity: 2,
      frequency: 1, evidenceStrength: 3, scoreRationale: "One labeled source.",
    }], gaps: ["Frequency unknown"], followUpQuestions: ["When did this last happen?", "What did you do?"],
  });
}

test("preserves source-backed speech, attribution and distinct counts", () => {
  const output = groundInterviewIdeas(result(), notes);
  assert.equal(output.ideas[0]!.participantCount, 1);
  assert.equal(output.ideas[0]!.quotes[0]!.participant, "Interview 1");
});

test("deduplicates people and removes unsupported quotes and paraphrased problems", () => {
  const input = result();
  const idea = input.ideas[0]!;
  idea.participants.push({ label: "Interview 1", excerpt: notes });
  idea.participants.push({ label: "Interview 2", excerpt: "Interview 2: This is invented" });
  idea.participantCount = 3;
  idea.quotes.push({ text: "I would pay $1000", participant: "Interview 2" });
  idea.problem = "Invoice processing is extremely costly";
  const output = groundInterviewIdeas(input, notes).ideas[0]!;
  assert.equal(output.participantCount, 1);
  assert.equal(output.quotes.length, 1);
  assert.equal(output.problem, "Not established verbatim in the notes.");
});

test("unlabeled summaries cannot manufacture a participant count", () => {
  const output = groundInterviewIdeas(result(), "Some people mentioned invoices.").ideas[0]!;
  assert.equal(output.participantCount, null);
  assert.equal(output.quotes.length, 0);
  assert.equal(output.evidenceStrength, 2);
  assert.match(output.evidenceCaveat, /unknown/);
});

test("repairs incorrect model attribution using labeled source blocks", () => {
  const input = result();
  input.ideas[0]!.quotes[0]!.participant = "Interview 2";
  const output = groundInterviewIdeas(input, notes);
  assert.equal(output.ideas[0]!.quotes[0]!.participant, "Interview 1");
});

test("recognizes role-suffixed headings even when model omits participant excerpts", () => {
  const source = 'Interview 1 — practice manager\n"I spend hours on invoices."\n\nInterview 2 — clinic owner\n"Invoices take every Friday."';
  const input = result();
  input.ideas[0]!.participants = [];
  input.ideas[0]!.participantCount = null;
  input.ideas[0]!.quotes.push({ text: "Invoices take every Friday.", participant: null });
  const output = groundInterviewIdeas(input, source).ideas[0]!;
  assert.equal(output.participantCount, 2);
  assert.deepEqual(output.quotes.map((q) => q.participant), ["Interview 1", "Interview 2"]);
});
