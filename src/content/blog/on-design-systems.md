---
title: "On Design Systems: The Invisible Architecture"
description: "Why the best design systems are the ones you never notice — and how building one forces you to think clearly about everything."
publishDate: 2026-07-15
image: "/images/blog/01-design-systems.jpg"
tags: ["design", "systems", "process"]
views: 1243
---

There is a particular satisfaction in building something that nobody sees. A design system is exactly that — a set of decisions so well made that users experience only the product, never the scaffolding beneath it.

I've spent the better part of two years obsessing over this idea. Not because I think systems are inherently beautiful (though they can be), but because I've watched enough products fall apart to know what absence of structure looks like.

## The Problem with "Just Design It"

Most design decisions start with good intentions. A button is blue because blue felt right. A card has 16px padding because the previous card had 16px padding. A font is Helvetica because Helvetica is safe.

This works until the second designer joins. Or the second screen gets designed. Or someone opens the app on a different device and the button is no longer quite the right shade of blue.

Without a system, decisions that felt like decisions were actually just moments. They don't repeat. They don't scale. They accumulate technical debt in the form of visual inconsistency.

## What a Real System Looks Like

A real design system is not a component library. That is a common mistake. A library is what you end up with. A system is the set of constraints and intentions that produced the library.

Start with tokens. Before any component is designed, you need a vocabulary:

- **Colour tokens**: not `blue-500` but `action-primary`, `surface-elevated`, `text-muted`
- **Spacing scale**: a mathematical progression (4, 8, 12, 16, 24, 32, 48, 64) that every component uses
- **Typography scale**: size, weight, line-height — all derived from a single base
- **Motion tokens**: duration, easing, delay — so animations feel cohesive

With tokens in place, components become nearly automatic. They are just compositions of token values.

## The Hard Part Is People

Building the system is the easy part. Getting people to use it is the challenge.

A design system only works if it is easier to use than it is to ignore. That means documentation that is honest about trade-offs. It means components that handle edge cases gracefully. It means a feedback loop where designers and engineers can propose changes without starting a three-month discussion.

The systems that die are the ones that become monuments. They stop evolving because they were declared finished. A living system is maintained like a garden — pruned, seeded, occasionally redesigned from the root.

## On Invisibility

When someone uses a product and everything feels right — the spacing is comfortable, the transitions feel natural, the language is consistent — they don't think about the system. They just feel at ease.

That invisibility is the point. The system succeeds by disappearing. All the decisions, all the arguments about token naming, all the component reviews — they crystallise into a thing that just works.

That is enough. More than enough.
