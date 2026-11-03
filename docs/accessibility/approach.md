# Accessibility review scope

Atlas aims for WCAG 2.1 AA. Automated checks are evidence about tested states, not a certification.

- Native form controls retain browser keyboard and touch behavior.
- Dialogs, menus, popovers, and tooltips use Radix primitives.
- Dialogs trap focus, restore it when possible, and dismiss with Escape.
- Tabs use roving tabIndex and left/right arrow keys.
- The application has a skip link, navigation landmarks, visible focus rings, and text status labels.
- Light/dark semantic tokens support contrast. Nonessential motion stops for reduced-motion preferences.
- The editor provides a node/connection list with ordinary buttons and labelled selects. Every node kind can be added without dragging, selected, configured, connected, and removed.
- A graph remains a complex spatial tool. XYFlow's canvas is supplementary to the node/connection list. Screen-reader review of every graph interaction is still needed.

`pnpm test:e2e` runs axe against representative light/dark landing, overview, library, and accessible-editor states. Component tests exercise labels, status text, tab keys, dialog Escape, and inspector edits. Browser tests also exercise command search and mobile navigation.

Manual work still required: VoiceOver/NVDA review, high zoom/reflow review, touch-device editor testing, and a full audit of every dialog/story. Automated axe results must not be presented as comprehensive WCAG conformance. Screenshot artifacts document observed states; they are not cross-platform pixel baselines.
