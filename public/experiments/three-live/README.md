# Dense portfolio particles in Three-Live

## Current dense version

The page now uses `shapes.js` (the original shape generators) and `particle-model.js` to generate a standard GLB for `loadModel()`. It renders 4,200 particles on phones or 6,000 on desktop. Batched primitives stay below the morph texture width limit. Three GPU morph targets provide shape interpolation, gentle drift and an outward burst; keyframe animation also adds slight rotation. Shape selection frames the camera around a fixed target.

The CDN loader initializes its animation array to an empty array, preventing its keyframes plugin from parsing the weight tracks. A confined workaround in `pilot.js` uses the bundle's exported `parseAnimations` helper and assigns the clips to the runtime before calling `play()`. This runtime-state workaround should be removed when the upstream loader is fixed.

Reduced motion starts with transitions disabled. The idle animation wraps after 120 seconds. Soft GLSL sprites, cursor repulsion and page scroll coupling remain absent. The old sandbox script below is retained for comparison; it is no longer the active renderer.

```mermaid
flowchart TD
  Controls[Shape and motion controls] --> Shapes[Original seeded shape generators]
  Shapes --> GLB[Batched particles and GPU morph targets in GLB]
  GLB --> Loader[Three-Live model loader]
  Loader --> Adapter[Animation parser compatibility adapter]
  Adapter --> Viewer[GPU morph animation and orbit controls]
```

## Earlier sandbox version

Run `npm run dev -- --host 127.0.0.1 --port 4177` from the portfolio repository, then open `/experiments/three-live/index.html`.

`portfolio-scene.js` is a standalone sandbox script adapted from `src/scene/makeShapes.ts`. It preserves the deterministic sphere, orbit, dial, floor and speedometer generators. The page substitutes numeric stage and reduced-motion settings before passing the script to `executeScript()`.

The original custom GLSL `Points` renderer is replaced by 240 small mesh particles sharing geometry and a material. Each mesh uses a declarative `KHR_interactivity` onStart translation to move from the previous shape into the selected shape over 1.6 seconds. The full Three-Live bundle includes the interactivity runtime. Disabling transitions compiles the final positions directly. Browser reduced-motion preference starts with transitions disabled.

The web sandbox worker exits after compilation; defining `animate(t)` or starting a timer inside it does not keep a web animation alive. This is why this pilot uses behavior graphs. It does not preserve the original shader's cursor repulsion, soft discs, continuous drift, or scroll-stage coupling. Camera orbit and zoom use Three-Live's controls. Native AR remains unverified.

```mermaid
flowchart TD
  Controls[Shape selection and motion preference] --> Script[Standalone shape script]
  Script --> Worker[Three-Live sandbox compiler]
  Worker --> GLB[Geometry and KHR_interactivity graph]
  GLB --> Viewer[WebGL2 viewer and transition runtime]
  Viewer --> Camera[Orbit and zoom controls]
```

The original portfolio entry page is separate from this noindex experiment. No application API or authentication is involved.

Vendor: Google Three-Live, Apache-2.0, downloaded 2026-11-06 from https://google.github.io/three-live/dist/three-live-full.min.js, saved as `vendor/three-live.min.js`. License is beside the bundle. Upstream source inspected at commit `3c554bf8c26da37b1f8b6ed8ebb982f8bde7a5f0`; the CDN artifact may have a different build revision.
