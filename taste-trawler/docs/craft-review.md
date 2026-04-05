# Craft Review Checklist

Run through this 12-point checklist before merging any PR that touches a user-facing surface. Every box must be ticked or explicitly waived in the PR description.

## The twelve points

1. **Skeleton** — every async surface has a content-shaped skeleton, not a spinner.
2. **Empty state** — every zero-data surface renders `<EmptyState>` with copy in MG's voice.
3. **Error state** — every route segment has an `error.tsx`, and inline failures use `<ErrorState>` or a themed toast.
4. **Success feedback** — destructive and mutating actions fire a Sonner toast on success.
5. **Type scale** — all text sizes use Tailwind `text-*` utilities backed by the tokens in `globals.css`. No `text-[17px]`.
6. **Spacing grid** — all paddings/gaps/margins are multiples of 4px. No `p-[13px]`.
7. **Alignment** — page content sits inside `<PageContainer>`; numeric columns are right-aligned and use `font-mono` with `[font-feature-settings:'tnum']`.
8. **Hover states** — every interactive element has a distinct hover that isn't the CSS default.
9. **Focus states** — every interactive element has `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (or equivalent).
10. **Image treatment** — every user photo goes through `next/image` with a locked aspect ratio per surface.
11. **Responsive at three breakpoints** — sm (375), md (768), lg (1280). No horizontal scroll, no layout breakage.
12. **60fps on mid-phone** — scrolling and hover transitions do not drop frames on a 2-year-old Android (Chrome DevTools → Performance → CPU 4x slowdown as a proxy).

## When to waive

A waiver is acceptable if:
- The surface is behind a feature flag only James uses, or
- The craft work is explicitly scheduled in a later phase and the PR is a scaffolding commit.

Any other waiver requires a one-line justification in the PR description.
