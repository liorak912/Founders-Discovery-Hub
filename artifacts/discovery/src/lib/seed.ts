import type { Project } from './store';

const BRIEF = `> **Illustrative sample.** Everything below is example content written to show what a Discovery brief looks like. The pain points are hypotheses to test, not findings. Verify figures and names before relying on them.

## Industry overview

Independent veterinary clinics are general-practice or specialty animal hospitals that are not owned by a corporate consolidator. In the US, a large share of practices remain independently owned, typically by one to three veterinarians, though consolidators have been buying practices steadily for over a decade.

A typical independent small-animal clinic:

- Runs **2-4 veterinarians**, 8-20 support staff (credentialed vet techs, assistants, client service reps), and a practice manager
- Earns most revenue from **exams, vaccines, diagnostics, surgery, dentistry, and in-house pharmacy**
- Runs on a **practice information management system (PIMS)** that handles scheduling, medical records, invoicing, and inventory
- Is often **owner-operated**: the owner is both the lead clinician and the business decision-maker

The environment right now is shaped by three forces: a persistent shortage of veterinarians and technicians, consolidation pressure from corporate groups offering to buy practices, and clients who expect consumer-grade convenience (online booking, texting, transparent pricing).

## Key players

| Category | Who they are | Why they matter to you |
|---|---|---|
| Practice owners | Veterinarians who own one or two clinics | Final say on spending; time-starved |
| Practice managers | Run operations, staffing, vendors | Often feel the daily pain first; may influence or own purchases |
| Corporate consolidators | Groups that acquire practices | Set the benchmark independents compete against |
| PIMS vendors | Cloud and on-premise practice software | Your integration point or your competitor |
| Distributors | Large animal-health product distributors | Control supply, pricing, and many vendor relationships |
| Buying groups | Cooperatives that negotiate pricing for independents | Trusted channel; can bundle new tools |
| Labs and diagnostics | Reference labs and in-house analyzer makers | Deep relationships and data access |
| Pet insurers | Reimburse owners after care | Influence what clients can afford |

## How money flows

1. **Pet owner pays the clinic** at checkout, usually by card, sometimes with financing or a wellness plan.
2. **Insurance reimburses the pet owner**, not the clinic, in most cases. The clinic often helps with paperwork without being paid for it.
3. **Clinic pays suppliers**: drugs and consumables via distributors (often the largest cost after labor), diagnostics via labs, software via monthly subscription.
4. **Labor is the biggest expense.** Staffing shortages push wages up and limit how many appointments can be booked.
5. **Practice value** is a long-term financial story for owners. Many think about eventual sale, which shapes what they invest in.

Implication: a new product either has to **increase revenue per appointment**, **free up staff hours**, or **reduce a cost line** owners already watch closely. Anything else is a nice-to-have.

## Pain points to test (hypotheses, not facts)

1. **Phone overload at the front desk.** Hypothesis: client service reps spend a large part of each day on calls that could be handled another way (refill requests, appointment changes, "is this an emergency?"). *Test by asking:* "Walk me through yesterday at the front desk. What were the calls about?"
2. **Missed and late-cancelled appointments.** Hypothesis: no-shows meaningfully cut daily revenue and reminders do not fully fix it. *Test by asking:* "Last time someone did not show up, what happened next?"
3. **Technician burnout and turnover.** Hypothesis: losing a credentialed tech is costly, and much of their time goes to tasks below their training. *Test by asking:* "Tell me about the last time a tech left. What did it take to replace them?"
4. **Inventory and pharmacy leakage.** Hypothesis: clinics lose money through expired stock, unbilled items, and clients filling prescriptions online. *Test by asking:* "When did you last count inventory? What did you find?"
5. **Medical record writing after hours.** Hypothesis: vets finish SOAP notes at night or on weekends. *Test by asking:* "When did you write up your last few appointments? Where were you?"
6. **Estimate and payment friction.** Hypothesis: clients decline recommended care at the estimate stage, and staff dread those conversations. *Test by asking:* "Think about the last estimate a client declined. What happened?"
7. **Software sprawl.** Hypothesis: clinics juggle a PIMS plus several bolt-on tools that do not talk to each other. *Test by asking:* "Show me what you have open on screen during a normal shift."

## What would change your mind

- If front-desk staff describe phones as annoying but not costly, pain point 1 is weaker than it looks.
- If owners already pay for a tool in your space and are happy, look for the gap they still work around manually.
- If practice managers have no budget authority, your buyer may be the owner even when the user is the manager.
`;

const PEOPLE = `> **Illustrative sample.** These are segment and channel suggestions, not a contact list. Discovery never lists private individuals. Find people yourself through the public channels below.

## Segments and roles

### Segment A: Owner-operated general practices (1-3 vets)
- **Practice owner (DVM):** decides on spend, cares about time and practice value
- **Practice manager or office manager:** runs staffing, vendors, scheduling
- **Lead client service rep:** knows exactly what the phones and front desk are like

### Segment B: Growing independents (4+ vets or 2+ locations)
- **Hospital administrator / practice manager:** owns operations, often has budget
- **Medical director:** sets clinical workflows
- **Lead credentialed vet tech:** sees inefficiency in the treatment area

### Segment C: Recently consolidated or near-sale practices
- **Former owners now employed by a group:** can compare life before and after
- Useful for understanding what consolidators provide that independents lack

**Start with Segment A practice managers.** They are the most reachable, feel operational pain daily, and can tell you who actually signs off on spending.

## Where to find them

### Practice managers (Segments A and B)
- **Associations:** Veterinary Hospital Managers Association (VHMA) and state or regional practice manager groups
- **Conferences (types):** large multi-day veterinary conferences with management tracks (for example VMX and WVC in the US), regional state VMA meetings, and practice management summits
- **Communities:** private Facebook groups for vet practice managers, practice management podcast audiences, and buying group member forums
- **LinkedIn search strategy:** search titles "Practice Manager" OR "Hospital Administrator" with keyword "veterinary" or "animal hospital", filter by your region, and exclude company names of large consolidators to keep it independent

### Practice owners
- **Associations:** your state veterinary medical association; AVMA and AAHA for broader context
- **Conferences (types):** state VMA annual meetings, continuing education weekends, buying group member events
- **Communities:** veterinary professional forums, alumni groups of veterinary schools, local veterinary medical associations that meet monthly
- **LinkedIn search strategy:** "Owner" OR "Medical Director" AND "DVM" with "animal hospital" or "veterinary clinic"; check the company page to confirm it is a single- or two-location practice

### Vet techs and front desk staff
- **Associations:** NAVTA and state veterinary technician associations
- **Communities:** large vet tech subreddits and Facebook groups, technician CE events
- **Approach:** these people are rarely buyers but describe the workflow honestly. Ask for 15 minutes, not 30.

## Outreach tips

- Calling or walking into a local clinic in a quiet mid-afternoon slot works surprisingly often. Ask for the practice manager.
- Lead with curiosity about their work, never with your product.
- Aim for **8-12 conversations** in one segment before switching segments.
`;

const KIT_SCRIPT = `> **Illustrative sample.** A Mom Test style script: questions focus on past behavior, avoid pitching, and do not lead toward your idea.

## Before the call
- Goal: learn how front-desk and operational work actually happens today, and what it costs.
- Do **not** describe your idea unless they ask at the very end.
- Write down the exact words they use. Quotes are worth more than summaries.

## Opening (2 minutes)
- "Thanks for making time. I'm researching how independent clinics run day to day. I'm not selling anything. Can I ask about your recent experience?"
- "What's your role, and how long have you been at this practice?"

## Recent past behavior (15 minutes)
1. "Walk me through yesterday from when you arrived. What took the most time?"
2. "Tell me about the last time the front desk got overwhelmed. What happened?"
3. "When did a client last cancel late or not show up? What did you do next?"
4. "How did you handle the last prescription refill request?"
5. "Think about the last time you stayed late. What were you working on?"

## Digging into one problem (8 minutes)
- "You mentioned [problem]. When did that last happen?"
- "What did it cost you, in time, money, or staff frustration?"
- "What have you tried to fix it? What happened with that?"
- "Are you paying for anything related to this today? How did you choose it?"
- "Who else is involved when you decide to change how this works?"

## Closing (3 minutes)
- "Is there anything I should have asked but didn't?"
- "Who else should I talk to? Could you introduce me?"
- "Can I follow up if I have one or two more questions?"

## Avoid
- "Would you use a tool that...?" (hypothetical, invites politeness)
- "Don't you hate it when...?" (leading)
- "How much would you pay for...?" (future speculation)
`;

const OUTREACH = `Hi [Name],

I'm [Your name], and I'm researching how independent veterinary clinics handle front-desk and scheduling work. I'm not selling anything. I'm trying to learn from people who do this every day.

Would you be open to a 20-minute call in the next two weeks? I'd ask about your recent experience, and I'm happy to share what I learn across other clinics.

Thanks for considering it,
[Your name]
[Contact]`;

const NOTES = `FICTIONAL EXAMPLE NOTES - these interviews never happened. They exist only to demonstrate synthesis. Replace them with your own real notes.

Interview 1 (fictional) - Practice manager, 3-vet clinic, suburban
- Front desk has 2 people; phones "ring nonstop 9-11am"
- Last Tuesday: 3 no-shows, one surgery slot lost
- Uses PIMS reminders by text; "helps some, not enough"
- Tried an online booking widget last year, stopped because clients booked the wrong appointment types
- Owner signs anything over a few hundred dollars a month

Interview 2 (fictional) - Owner DVM, 2-vet clinic, rural
- Writes records at home 3-4 nights a week, about an hour each
- Not worried about phones; staff are long-tenured
- Biggest fear: losing her one credentialed tech
- Gets 2-3 consolidator letters a month; not selling yet

Interview 3 (fictional) - Lead CSR, 4-vet clinic, urban
- Refill requests by phone are "a third of my day"
- Keeps a paper list of callbacks because PIMS tasks get buried
- Estimate conversations are "the worst part"; clients decline dental often
`;

const SYNTHESIS = `> **Illustrative synthesis of FICTIONAL notes.** No real interviews were conducted. This shows the shape of a synthesis only.

## What held up
- **Phone overload (pain 1):** 2 of 3 fictional interviews described heavy call volume, with refill requests named specifically. Strongest signal in this set.
- **No-shows (pain 2):** one concrete recent example with a lost surgery slot. Worth probing cost in more interviews.

## What did not hold up (yet)
- **Software sprawl (pain 7):** nobody mentioned juggling tools. Weak signal.
- **Inventory leakage (pain 4):** never came up. Do not drop it, but deprioritize.

## Surprises
- Record writing at home (pain 5) was intense for the rural owner but absent elsewhere. Could be segment-specific.
- A previous online booking attempt failed because of appointment-type errors. Past failed solutions are valuable evidence.

## Buyer signals
- Owner approves spend above a modest monthly threshold; manager is the user and the champion.

## Suggested next conversations
- 5 more lead CSRs at 3-5 vet clinics, focused on refill and callback workflow
- Ask each: "What did you do the last time a refill request got lost?"

## Confidence
Low. Three interviews, all fictional. Real conversations required before any decision.
`;

export function createSampleProject(): Project {
  const now = Date.now();
  return {
    id: 'sample-vet-clinics',
    name: 'Independent veterinary clinics',
    industry: 'Independent veterinary clinics',
    idea: 'Something that takes repetitive work off the front desk at small animal clinics, maybe refills and appointment changes.',
    customer: 'Practice managers at 1-4 vet independent clinics',
    createdAt: now,
    updatedAt: now,
    step: 2,
    sections: { brief: BRIEF, people: PEOPLE, kit: KIT_SCRIPT + '\n\n## Outreach message\n\n' + OUTREACH, synthesis: SYNTHESIS },
    sectionUpdatedAt: { brief: now, people: now, kit: now, synthesis: now },
    outreach: OUTREACH,
    notes: NOTES,
    chat: [
      {
        role: 'assistant',
        at: now,
        content:
          'This is the **illustrative sample** project. Click through the five steps to see what a finished discovery looks like. Ask me anything about it, or start your own project from the switcher at the top.',
      },
    ],
    sample: true,
  };
}
