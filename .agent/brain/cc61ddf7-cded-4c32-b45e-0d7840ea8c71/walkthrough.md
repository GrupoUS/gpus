# Walkthrough: Stitch Integration

> **Goal:** Integrate Google Stitch (Gemini 3.0) and Nano Banana Pro into the design workflow.

## Changes Implemented

### 1. Frontend Design Skill (`.agent/skills/frontend-design/SKILL.md`)
- **Added Section 2.5:** "AI Prototyping (Stitch)"
    - Documented `stitch_create_project` and `stitch_generate_screen_from_text`.
    - Added Prompt Engineering guide for Stitch.
- **Updated Section 3:** "Visual Asset Generation"
    - Explicitly mandated `gemini-3-pro` for high-fidelity assets (Nano Banana Pro).

### 2. Design Workflow (`.agent/workflows/design.md`)
- **Added Phase 1.5:** "AI Prototyping (Stitch)"
    - Added workflow steps to generate prototypes using Stitch.
    - Added requirement to create `docs/DESIGN-{slug}.md`.
    - Included step to capture full Stitch code output.
    - Included step to generate assets with Nano Banana Pro.

## Verification
- **Manual Check:** Verified markdown syntax and logical flow in both files.
- **Tool Usage:** Confirmed `gemini-3-pro` flag is documented correctly.
