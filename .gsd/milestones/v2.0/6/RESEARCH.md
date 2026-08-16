# Phase 6 Research: Mobile-First UI Redesign

## Discovery Level 1.5

### Analysis of Roadmap Tasks
The roadmap outlines a comprehensive mobile-first UI overhaul emphasizing a "liquid glass" aesthetic. It references tools like `npx stitch generate` and `npx motion-ai` which appear to be conceptual shorthand for generating design tokens and animation variants. To maintain the "Ponytail Ultra" philosophy of robust, dependency-minimal code, we will implement these concepts directly using Tailwind CSS and Framer Motion (which is already installed).

### Approach

**1. Design Tokens & Glass CSS**
Instead of relying on external generation tools, we will define the Aurora Forest and Liquid Glass tokens directly in `index.css` and `tailwind.config.js`.
- **Glass CSS**: Implement `backdrop-filter: blur(12px)` selectively on floating elements (bottom nav, sticky header, modals) to preserve performance.
- **Fallbacks**: Use `@media (prefers-reduced-transparency: reduce)` to gracefully degrade to solid colors.
- **Colors**: Tint: `rgba(235, 250, 219, 0.72)`, Border: `1px solid rgba(194, 203, 201, 0.4)`.

**2. Motion Presets**
Create a central `client/src/utils/motion.js` file to store reusable Framer Motion variants for:
- Page transitions (slide-up/fade-out 150ms)
- Card hovers
- Spring scales for FABs
- Drag gestures (swipe-to-delete)

**3. Component Redesign**
- **AppLayout**: Move to a mobile-centric bottom navigation bar (using glass effect).
- **Dashboard & ExpenseLogger**: Adopt full-width mobile cards, horizontal scrolling for charts, and implement Framer Motion `drag` for swipe actions.
- **Performance**: Apply `will-change: transform` only on actively animating elements to prevent GPU memory bloat.

### Wave Planning
- **Wave 1**: Global Styles, Tokens, and Motion Presets.
- **Wave 2**: Core Layouts (`AppLayout`, `Landing`, `GroupSetup`).
- **Wave 3**: Data Views & Interactions (`Dashboard`, `ExpenseLogger`, `SettlementHistory`).
