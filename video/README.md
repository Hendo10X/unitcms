# UnitCMS promo video

A 55-second, 1920×1080, 30fps promo built with [Remotion](https://www.remotion.dev). It uses the app's palette,
Instrument Sans, and the wireframe animations from the site. Text rises through masks, wireframes draw on,
and scenes change with a blue wipe. There are no fades.

```bash
cd video
npm install
npm run studio    # preview and scrub the timeline
npm run render    # writes out/unitcms-promo.mp4
```

Scenes live in `src/scenes`, and their lengths are listed in `src/Promo.tsx` (they add up to 1650 frames).
Colours and fonts are in `src/theme.ts`, shared animation pieces in `src/ui.tsx`.
