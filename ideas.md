# Design directions

## 1. Signal Observatory

**Very Brief Intro:** A precise, high-trust security instrument built around quiet surfaces, calibrated data, and a warm signal accent. The emotional intent is disciplined investigation rather than theatrical hacking.

**Probability:** 0.07

## 2. Containment Room

**Very Brief Intro:** A tactile operations room using dark paper, alert tapes, annotated evidence cards, and crisp operational typography. The emotional intent is controlled pressure with clear accountability.

**Probability:** 0.04

## 3. Research Ledger

**Very Brief Intro:** A light, editorial lab notebook that makes evaluations feel reviewed, evidence-backed, and ready for governance. The emotional intent is calm scientific rigor over dashboard noise.

**Probability:** 0.09

# Chosen direction: Signal Observatory

## Design Movement

This workbench follows the visual language of **scientific instrumentation and observatory control rooms**. It treats model-risk evaluation as an evidence practice: signals are recorded, calibrated, triaged, and explained. It deliberately avoids terminal cosplay and generic cyberpunk aesthetics.

## Core Principles

1. **Evidence before spectacle:** Every visual element should clarify scope, exposure, or next action.
2. **Calibrated contrast:** A dark mineral field lets status colors operate like measured instrumentation rather than decoration.
3. **Progressive disclosure:** The overview surfaces the current risk picture; detailed evidence appears only when the operator opens a run.
4. **Bounded agency:** Interaction language reinforces safe, authorized, and dry-run testing at every decision point.

## Color Philosophy

The interface uses graphite and ink-blue as a stable, low-distraction field. A distinctive **signal lime** is reserved for trusted, live, and passing states, while coral-red marks confirmed exposure and amber marks reviewable uncertainty. The palette is intentionally non-neon: it should feel precise, not sensational.

## Layout Paradigm

The app is an **instrument panel with a persistent mission rail**, not a centered card stack. A narrow left rail anchors scope and operating mode; the main canvas is an asymmetrical field that combines a risk summary, a test matrix, and an evidence stream. On smaller screens, the rail becomes a compact status strip.

## Signature Elements

1. **Orbital signal mark:** Concentric, offset rings around a central observation point used in the header and empty states.
2. **Calibration rulers:** Fine tick marks and reference lines appearing in scores, charts, and section edges.
3. **Evidence strips:** Timestamped, monospace response excerpts with a color-coded detector rail.

## Interaction Philosophy

Actions are explicit and safety-gated. A test run begins only from a named approved target and announces dry-run limits before starting. Operators can drill into a finding or export a redacted report, but all potentially sensitive payload views use a deliberate reveal affordance.

## Animation

Use brief 160–240ms opacity and transform transitions with a crisp ease-out. The orbital mark may rotate almost imperceptibly only when a run is active; test rows should reveal their results with a 40ms stagger. Motion pauses for reduced-motion preferences and never delays keyboard actions.

## Typography System

**Space Grotesk** is the display and interface face, used in semibold and bold for decisive status hierarchy. **IBM Plex Mono** is used for test IDs, timestamps, safety labels, and evidence snippets. Headlines are compact and sentence-case; operational labels use tracked uppercase mono at small sizes.

## Brand Essence

**A controlled observatory for teams that need to prove how their LLM applications behave under pressure.**

Personality: **measured, transparent, resolute**.

## Brand Voice

Headlines should sound direct and scientific; CTAs should name the action and its safety boundary. Microcopy should explain what is recorded or withheld rather than promise magic.

Example lines: “Observe behavior before it reaches production.”

Example lines: “Run the selected suite in dry-run containment.”

## Wordmark & Logo

The mark is an offset orbital aperture: three broken graphite rings orbit a small signal-lime core, suggesting both observation and a controlled boundary. The wordmark pairs the mark with a deliberately spaced “REDLINE / OBSERVATORY” lockup rather than a default font treatment.

## Signature Brand Color

**Signal Lime — `#C7F36B`**. This is the ownable accent used only for verified, operating, and user-initiated states.
