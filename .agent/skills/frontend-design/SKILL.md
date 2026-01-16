---
name: frontend-design
description: Universal suite for creating distinctive, production-grade frontend interfaces and standalone HTML artifacts. Optimized for React, Tailwind CSS, and shadcn/ui with integrated Gemini image generation.
---

# Universal Frontend Design Skill

This skill guides the creation of distinctive, production-grade frontend interfaces—both within an existing project and as standalone HTML artifacts. It focuses on functional excellence, bold aesthetics, and unique visual assets.

## Core Design Philosophy: "Intentional Minimalism"

- **Anti-AI Slop**: Reject generic layouts, overused fonts (Inter, Roboto), and predictable color schemes (purple gradients on white).
- **Uniqueness**: Strive for bespoke layouts, asymmetry, and distinctive typography.
- **Precision**: Match implementation complexity to the aesthetic vision. Minimalism requires restraint; maximalism requires elaborate code.

## Workflow 1: Project-Based Development

Use this when building components, pages, or features directly within the current codebase.

1. **Aesthetic Direction**: Commit to a bold tone (Refined Minimalism, Brutalist, Retro-Futuristic, etc.).
2. **Typography**: Pair characterful display fonts with refined body fonts.
3. **Motion**: Prioritize high-impact orchestrated page loads over scattered micro-interactions.
4. **Implementation**: Build semantic, functional code that follows project standards (React, Bun, Convex).

## Workflow 2: Standalone Artifacts Builder

Use this for creating complex, multi-component standalone HTML artifacts for demonstration or quick prototyping.

### Step 1: Initialize Project
Run the initialization script to create a new React project:
```bash
bash .agent/skills/frontend-design/scripts/init-artifact.sh <project-name>
```
- Creates a React 18 + TypeScript + Vite + Tailwind + shadcn/ui environment.

### Step 2: Build & Preview
Develop your artifact, then bundle it into a single self-contained HTML file:
```bash
bash .agent/skills/frontend-design/scripts/bundle-artifact.sh
```
- Share the generated `bundle.html` in the conversation.

## Visual Assets: Nano Banana System

When the design requires unique images or placeholders, use the integrated Gemini image generation:

### Local Generation Script
Use the Python generator to create high-fidelity assets using Gemini 3 Pro:
```bash
python .agent/skills/frontend-design/scripts/generate_images.py "Your prompt here" "output_filename"
```
- **Reference**: See [nanobananaskill.md](file:///d:/Coders/gpus/.agent/skills/frontend-design/nanobananaskill.md) for advanced prompting strategies.

### Asset Guidelines
- **No text, logos, or recognizable faces**.
- **Simple composition**: Soft gradients, subtle grain, minimal detail.
- **Workflow**: Plan image requirements → Generate using the script → Integrate into the implementation.

---

## Technical Reference
- **Stack**: React, Tailwind CSS, shadcn/ui (Radix UI).
- **Resources**: [shadcn/ui Docs](https://ui.shadcn.com/docs/components)
