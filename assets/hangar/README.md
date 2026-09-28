# Hangar environment assets

2026-09-28, generated with the built-in image generation tool for the user-approved hangar redesign. These are environment assets, not character/card images; do not register them in `data/img.json`.

| File | Dimensions | Purpose |
| --- | --- | --- |
| hangar-backdrop-v2.webp | 1672 × 941 | Approved realistic carrier-hangar concept: distant world-space continuation |
| deck-albedo-v2.webp | 1254 × 1254 | Gray worn steel plate base color, screws and subtle scratches |
| enamel-albedo-v2.webp | 1254 × 1254 | Off-white enamel maintenance panels with restrained weathering |

The two material maps were generated using the approved concept as visual reference, with flat lighting and a front-facing view. Original full dimensions are retained; PNGs were only encoded to WebP for delivery. Normal and roughness channels are authored analytically at runtime, independently of the generated images. Repetition is hidden with geometry, drainage grilles, tracks and equipment, but the base colors are not guaranteed mathematically seamless.

The existing archive artwork remains loaded by its canonical catalog URL and is not changed by this environment update.

## Wall elevations v3

2026-09-28: three new wall images generated with the built-in image generation tool, using the approved v2 concept only as a style/material reference. Exact prompts, full-size source paths, WebP hashes and dimensions are in `walls-v3-prompts.json`.

| File | Dimensions | Purpose |
| --- | --- | --- |
| port-wall-v3.webp | 1983 × 793 | Left wall with three empty servicing recesses |
| starboard-wall-v3.webp | 1983 × 793 | Right wall with matching servicing bays and equipment |
| rear-wall-v3.webp | 1635 × 962 | Closed rear entrance shutter and maintenance wall |

All three are frontal wall elevations rather than perspective room photographs. They are encoded to WebP at original dimensions without cropping. The renderer uses the native image aspect ratios on fixed wall planes. Nearby structural geometry remains three-dimensional, while depth and lighting inside the generated pictures are baked into the imagery. Original character images are displayed unchanged in six paired side berths.
