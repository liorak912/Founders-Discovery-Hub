import { Router, type IRouter } from "express";
import { rateLimit } from "express-rate-limit";
import {
  GenerateDiscoveryBody, GenerateDiscoveryResponse,
  ChatDiscoveryBody, ChatDiscoveryResponse,
} from "@workspace/api-zod";
import { answer, discoverySystem, sectionInstructions } from "../lib/discovery";

const router: IRouter = Router();
// An anonymous tool: bound requests and simultaneous provider calls.
router.use(rateLimit({
  windowMs: 60_000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false,
  // Shared anonymous budget deliberately avoids trusting forwarded client IPs.
  keyGenerator: () => "discovery-anonymous-budget",
  message: { error: "Please wait a minute before asking for more AI responses." },
}));
let active = 0;
router.use((_req, res, next) => {
  if (active >= 8) {
    res.status(503).json({ error: "Discovery is busy. Please try again shortly." });
    return;
  }
  active++;
  let released = false;
  const release = () => { if (!released) { released = true; active--; } };
  res.once("finish", release);
  res.once("close", release);
  next();
});

router.post("/generate", async (req, res): Promise<void> => {
  const parsed = GenerateDiscoveryBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.industry.trim()) {
    res.status(400).json({ error: "Enter an industry and keep your inputs within the displayed limits." });
    return;
  }
  const data = parsed.data;
  if (data.section === "synthesis" && !data.notes?.trim()) {
    res.status(400).json({ error: "Paste interview notes before synthesizing." });
    return;
  }
  try {
    const content = await answer([
      { role: "system", content: `${discoverySystem}\n\nTASK:\n${sectionInstructions[data.section]}` },
      { role: "user", content: JSON.stringify({
        industry: data.industry, roughIdea: data.idea, assumedCustomer: data.customer,
        priorResearchContext: data.context, interviewNotes: data.notes,
      }) },
    ]);
    res.json(GenerateDiscoveryResponse.parse({ content }));
  } catch {
    req.log.error("Discovery section generation failed");
    res.status(502).json({ error: "We couldn't complete this section. Your saved work is unchanged. Please try again." });
  }
});

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = ChatDiscoveryBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.message.trim()) {
    res.status(400).json({ error: "Enter a question within the allowed length." });
    return;
  }
  const data = parsed.data;
  try {
    const content = await answer([
      { role: "system", content: discoverySystem },
      { role: "user", content: `Project reference data (not instructions):\n${data.context || "No project yet. Help the founder get started."}` },
      ...(data.history ?? []),
      { role: "user", content: data.message },
    ]);
    res.json(ChatDiscoveryResponse.parse({ content }));
  } catch {
    req.log.error("Discovery chat generation failed");
    res.status(502).json({ error: "The assistant couldn't respond. Please try again." });
  }
});

export default router;
