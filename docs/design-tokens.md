# Design tokens

Ported from the Arcwell mobile app so both products look like one product.
These are the only values to use. No raw hex outside this file.

## Palette

```
ink900  #0A0A0A    ink800  #151515    ink700  #1F1F1F    ink650 #1A1A1A
ink600  #2B2B2B    ink500  #5C5C5C    ink450  #8A8A8A    ink400 #767676
mist300 #A3A3A3    mist50  #F2F2F2    mist25  #F5F5F5    mist0  #FFFFFF
mist100 #E0E0E0    mist75  #EBEBEB
red600  #B71C1C    red550  #C62828    red500  #D32F2F    red400 #FF5A52
green400 #7BD389   green700 #2E7D32
blue400 #8AB4F8    amber400 #F5B841   amber700 #9A5B00
```

## Semantic roles

Light theme is the web default.

| Role | Light | Dark |
|---|---|---|
| bg | #FBFBFA | #0A0A0A |
| surface | #F4F4F1 | #151515 |
| surfaceRaised | #EBEBEB | #1F1F1F |
| text | #0A0A0A | #F2F2F2 |
| textMuted | #5C5C5C | #A3A3A3 |
| textDisabled | #A3A3A3 | #5C5C5C |
| brand (accent, used rarely) | #B93A31 | #FF5A52 |
| brandHover | #B71C1C | #B71C1C |
| onBrand | #FFFFFF | #FFFFFF |
| accent | #C62828 | #FF5A52 |
| training | #C62828 | #FF5A52 |
| nutrition | #2E7D32 | #7BD389 |
| recovery | #C62828 | #FF5A52 |
| success | #2E7D32 | #7BD389 |
| warning | #9A5B00 | #F5B841 |
| danger | #C62828 | #FF5A52 |
| border | #E4E4DF | #2B2B2B |
| borderStrong | #8A8A8A | #767676 |
| focus | #C62828 | #FF5A52 |

Rules:
- Primary buttons are **brand** with **onBrand** text.
- Never use colour alone to carry meaning — pair it with a label or an icon.

## Spacing (4-point grid, only these steps)

```
0 · 4 · 8 · 12 · 16 · 24 · 32 · 48
```

Rhythm: inline gap 8 · rows within a group 8 · card padding 16 · screen gutter 16 ·
between unrelated groups 24.

## Radius

```
sm 10 · md 12 · lg 16 · xl 28 · full 9999
```

Chips and set cells use sm; buttons and inputs md; cards lg; sheets xl; avatars pill full.

## Era

Primary buttons are **ink**, not brand: a page should not have two competing coolers.
The brand red marks one thing per screen — the attention signal — and interactive selection.

## Type

- Family: **Inter** only.
- Weights: 400 regular · 500 medium · 600 semibold · 700 bold.
- Sizes: 12 · 14 · 16 · 18 · 22 · 32.
- Body tracking near 0; display headings at weight 600 with about -0.03em.

## Borders and focus

- Border width 1.
- Focus ring 2 px in the `focus` colour, always visible, never removed.
