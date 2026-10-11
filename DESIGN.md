---
version: alpha
name: The Booty Republic
description: Arabic skin-care storefront and compact Jordanian order management.
colors:
  primary: "#FF7B98"
  action: "#e11d4d"
  actionHover: "#be123e"
  dark: "#2A1820"
  soft: "#FFF5F7"
  border: "#fecdd7"
typography:
  sans:
    fontFamily: "Cairo, Tajawal, system-ui, -apple-system, sans-serif"
  mono:
    fontFamily: "ui-monospace, monospace"
rounded:
  control: "0.75rem"
  card: "1rem"
  dialog: "1.5rem"
spacing:
  fieldGap: "1rem"
  panelGap: "1.5rem"
components:
  productEditor:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.dark}"
  productCard:
    textColor: "{colors.dark}"
  modal:
    textColor: "{colors.dark}"
  saveButton:
    backgroundColor: "{colors.action}"
  saveButtonHover:
    backgroundColor: "{colors.actionHover}"
---

# The Booty Republic design context

## Overview

Preserve the existing rose packaging identity: soft rose surfaces, dark readable names,
and compact product information. The storefront expresses the skin-care brand; admin
routes prioritize accurate catalog and order entry. Bundle contents are the signature
for this feature: a readable list of quantities and products, never a second cart.
Do not rebrand this feature as a dark analytics dashboard or add decorative panels.

The README establishes Jordan, JOD, Arabic and RTL commerce. Arabic is the interface
language; English names, descriptions and SKUs remain editable catalog data. Phone
customers and desktop administrators need the same product composition and price.

Runtime ownership remains in `tailwind.config.ts` (brand palette and font stack) and
`src/app/globals.css` (global behavior). This document records those values; it does
not generate a competing token system. No palette changes accompany bundles.

## Colors

`brand-primary` is packaging color. `brand-600` is the action color and `brand-700`
is its hover state. `brand-dark` supports headings; `brand-soft` and `brand-200`
group bundle contents. Error copy remains explicit text as well as rose coloring.
The existing product has a light theme only. Focus rings use `brand-600`.

## Typography

Cairo with Tajawal and system fallbacks carries Arabic product text. Names and form
labels are bold; supporting text is quieter. Use monospace only for SKUs and numbers.
Never replace an Arabic label with an icon or truncate a selected component name.

## Layout

Use the existing Tailwind spacing, not an independent scale. Product fields become
one column on phones and two on larger screens. Product tables retain horizontal
scrolling. The editor has a bounded, vertically scrollable dialog; component choices
have their own bounded list and must not clip the save controls.

## Elevation & Depth

Keep existing white cards, subtle borders and restrained shadows. Only dialogs use
strong elevation and a dark backdrop. Bundle sections use a tonal surface and border.

## Shapes

Controls use rounded-xl (0.75rem), cards rounded-2xl (1rem), dialogs rounded-3xl
(1.5rem), matching the current catalog. Badges may use pills.

## Components

ProductEditor owns product and bundle creation/editing. Selected component rows use
a rose border and native checkboxes, with a separately labeled quantity input.
Server errors stay in the editor and preserve entered values. Save has a stable
width and a pending label. Native dialog in the shared Modal owns focus trapping,
background inertness and focus restoration. Escape closes clean drafts; dirty drafts
use an application-owned discard dialog, initially focused on returning to edit.

Lucide remains the icon family. The content list is text first and readable without
hover. Storefront bundle badges and component lists appear before cart actions.
No new animation is introduced. Product buttons keep visible focus and disabled
states. Currency follows the existing `formatPrice` helper.

The Instagram section closes the homepage with a rose-and-peach product collage:
three slightly tilted frames use actual catalog imagery alongside an oversized,
quiet Instagram outline. Arabic copy leads; the account handle uses LTR isolation.
InstagramLink owns the follow action and a compact footer variant, with the same
account URL and visible keyboard focus. Both open a new tab. Keep the palette and
font stack unchanged; these are store images, not a simulated Instagram feed.

## Do's and Don'ts

- Show the full bundle price and the quantity of every component.
- Calculate bundle availability from component stock; do not present a second inventory control.
- Preserve order-time contents in order details and Excel exports.
- Do not introduce a separate payment, permission or shipping policy for bundles.
