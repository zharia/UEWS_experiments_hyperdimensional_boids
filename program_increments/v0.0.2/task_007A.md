# Task 007A — 4D Landscape Feature Integration

**File:** `program_increments/v0.0.2/task_007A.md`  
**Program Increment:** `v0.0.2`  
**Depends on:** Task 007 — Dynamic 4D Landscape Evolution, Geometry & Topology  
**Status:** Development instruction  
**Primary objective:** Complete the 4D landscape model by integrating geological and structural landscape features into the same evolving 4D world as the terrain.

---

# 1. Mission

Task 007 implemented the first mathematical and runtime substrate for an evolving 4D landscape.

That implementation is useful, but it currently represents only part of the intended model.

The current architecture effectively behaves as:

```text
4D field
   ↓
w(t) slice
   ↓
heightfield
   ↓
sand mesh
```

while the rest of the visible landscape behaves approximately as:

```text
rocks       → static scene objects
coral       → static scene objects
reef        → static scene objects
flora       → independently animated objects
```

This is not sufficient.

The intended model is:

```text
                         4D WORLD M⁴
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
      terrain⁴            geology⁴            reef⁴
          │                   │                   │
          │             ┌─────┴─────┐             │
          │             │           │             │
        rocks⁴       structures⁴   formations⁴   coral⁴
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                         w = w(t)
                              │
                              ▼
                    3D LANDSCAPE SLICE
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       terrain              rocks              reef
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
                          ECOLOGY
```

The aquarium must therefore become a **coherent evolving 4D landscape**, rather than a dynamic floor with static scenery placed on top of it.

The central requirement is:

> **Landscape features must participate in the same 4D spatial model and must be projected into the visible 3D world from that model.**

A feature may appear, disappear, rise, sink, deform, migrate, merge spatially, separate spatially, or otherwise change as the 3D observation slice moves through the fourth dimension.

These changes must arise from the 4D representation rather than from unrelated object-level animation hacks.

---

# 2. Required Engineering Behaviour

Implement the following requirements completely.

## 2.1 Preserve Task 007

Do **not** discard or rewrite the Task 007 landscape subsystem merely because its current abstraction is incomplete.

Retain and improve:

- `Landscape4DField`
- `LandscapeEvolutionSystem`
- `LandscapeProjection`
- `LandscapeTopology`
- deterministic seeded evolution
- existing landscape state model
- existing tests
- existing performance characteristics where practical

The implementation should evolve the architecture rather than replace it with an unrelated animation system.

---

# 3. Fundamental World Model

Establish the following conceptual invariant:

\[
M^4
\]

is the authoritative landscape world.

The visible aquarium at time `t` is a 3D slice:

\[
\Sigma_{w(t)}^3
\]

through that world.

For terrain:

\[
y = H(x,z,w)
\]

For a volumetric feature `Fᵢ`:

\[
V_i^4 \subset M^4
\]

and its visible manifestation is determined by:

\[
V_i^3(w) = V_i^4 \cap \Sigma_w^3
\]

The implementation does not necessarily need to literally construct a full 4D mesh.

It **does** need to preserve the semantics of this model.

The distinction is critical:

```text
4D feature definition
        ↓
4D feature state
        ↓
4D → 3D projection
        ↓
visible geometry
```

not:

```text
static mesh
        ↓
arbitrary animation
```

---

# 4. Landscape Feature Abstraction

Introduce a reusable landscape-feature abstraction.

The exact class/interface name is implementation-dependent, but it must express at least:

```text
LandscapeFeature
├── stable identity
├── feature type
├── 4D position / support
├── 4D scale / extent
├── temporal / w-domain
├── geometric representation
├── evolution parameters
├── topology relationships
└── projection state
```

Feature identity MUST NOT depend upon:

- mesh index
- array position
- renderer object identity
- creation order
- Three.js object identity
- modulo arithmetic
- positional matching

A feature ID must remain stable throughout its execution lifetime.

Example:

```text
ROCK_001
ROCK_002
RIDGE_001
REEF_001
STRUCTURE_001
```

The exact naming convention may differ, but identity must be explicit.

---

# 5. Feature Types

At minimum, support the following landscape feature categories:

### 5.1 Terrain

The existing evolving substrate.

Terrain remains represented primarily as an analytical field/heightfield where appropriate.

### 5.2 Geological rocks / outcrops

Rocks must no longer be static objects permanently placed on the substrate.

Each rock must have a 4D representation.

### 5.3 Geological formations

Support larger structures such as:

- ridges
- shelves
- banks
- trenches
- plateaus
- valleys
- exposed formations

These should be represented within the same landscape coordinate system.

### 5.4 Reef / structural formations

Reef-like structures should participate in the landscape model rather than being completely independent static geometry.

The implementation does not need to turn every biological coral organism into geological terrain.

However, the structural reef environment must have a coherent relationship with the evolving landscape.

### 5.5 Flora anchors

Existing biological lifecycle simulation may remain independent.

However, plants and other benthic organisms must be capable of obtaining their spatial support from the evolving landscape.

A plant must not remain visibly embedded several units above or below a landscape that has moved beneath it.

---

# 6. 4D Feature Representation

Do not assume that every feature requires a literal four-dimensional mesh.

Use the most appropriate representation for each feature.

Possible representations include:

```text
scalar / implicit field
signed-distance-like field
analytical primitive
4D transformed primitive
skeletal field
parametric feature
4D bounding volume
4D deformation field
```

The implementation should favour analytical or procedural representations where they provide deterministic and inexpensive evaluation.

For example, a rock may be represented conceptually as:

\[
R_i(x,y,z,w)
\]

where the field determines whether a point belongs to the rock.

Its visible geometry at the current slice is then derived from:

\[
R_i(x,y,z,w(t))
\]

The implementation may use a practical approximation rather than constructing a general marching-hypercube implementation.

Do not introduce extreme computational complexity merely to satisfy mathematical purity.

The semantic model is mandatory; the numerical representation is an engineering choice.

---

# 7. Feature Evolution

Feature evolution must be driven by the 4D world.

A feature should be able to have:

- 4D position
- 4D scale
- 4D orientation
- temporal/w-domain support
- deformation
- amplitude
- phase
- local curvature influence
- relationship to neighbouring features

Example:

```text
ROCK_003

w-domain:
    18 → 73

at w=18:
    invisible

at w=25:
    small outcrop

at w=40:
    substantial rock

at w=55:
    altered geometry

at w=70:
    partially submerged

at w=73:
    disappears
```

This is **not** a scripted animation timeline.

It is the visible consequence of the feature's 4D support intersecting the current 3D slice.

---

# 8. No Arbitrary Object Animation

Do not implement the requirement as:

```typescript
rock.position.y += ...
rock.scale.x += ...
rock.rotation.y += ...
```

with an unrelated timer.

That would reproduce the existing architectural problem at another level.

Instead:

```text
4D feature state
      ↓
slice parameter w
      ↓
projection/evaluation
      ↓
feature transform/geometry
      ↓
renderer
```

Renderer transforms are allowed as the **projection result**.

They must not become the authoritative state.

---

# 9. Common 4D Coordinate System

Terrain and landscape features must share one common coordinate system.

A rock positioned at:

```text
(x, y, z, w)
```

must use the same:

- spatial origin
- scale
- w coordinate
- temporal traversal
- coordinate orientation
- evolution state

as terrain.

Do not create independent temporal coordinate systems for rocks, terrain, coral, etc.

There must be one authoritative landscape traversal parameter:

```text
LandscapeEvolutionSystem.time4D
```

or its successor.

All landscape projections must derive from this state.

---

# 10. Terrain / Feature Relationship

Landscape features must interact with the terrain.

For example, a rock's visible base should correspond to the local landscape surface where appropriate.

The system must be able to determine:

```text
terrain height at x,z,w
```

and:

```text
feature geometry at x,y,z,w
```

This should prevent impossible states such as:

```text
rock floating 4 metres above terrain
```

unless the 4D feature model genuinely produces such a result.

Likewise, if the terrain rises around a rock, the rock should remain spatially coherent with that terrain.

---

# 11. Landscape Projection

Extend `LandscapeProjection` into a general landscape projection mechanism.

It must be capable of projecting:

```text
terrain
rocks
formations
reef structures
feature anchors
```

from the authoritative 4D landscape state.

Do not make the renderer independently calculate landscape evolution.

The renderer should receive projected state.

Conceptually:

```text
LandscapeEvolutionSystem
        │
        ├── Terrain projection
        ├── Rock projection
        ├── Formation projection
        ├── Reef projection
        └── Anchor projection
                │
                ▼
          Rendering adapter
```

---

# 12. Geometry Representation

The initial implementation may use practical 3D geometry generated from 4D feature evaluation.

For example:

```text
4D feature
    ↓
sample current w
    ↓
derive visible 3D bounds
    ↓
generate/update geometry
```

Possible techniques:

- deform existing procedural geometry;
- evaluate an implicit field;
- generate a low-resolution surface;
- transform a canonical primitive;
- update vertex positions;
- update scale/orientation;
- use instanced procedural geometry.

The chosen technique must be documented.

The implementation must avoid creating a new Three.js mesh every frame unless profiling demonstrates that this is necessary.

Prefer stable render objects with changing projected geometry/state.

---

# 13. Rocks

The existing five static rocks in `coralGeometries.ts` must be migrated into the landscape feature system.

Do not simply attach a timer to their existing transforms.

Each rock should have:

- stable identity
- deterministic seed
- 4D location
- 4D extent
- shape parameters
- w-domain
- evolution parameters

The renderer should obtain the current visible state from the landscape system.

At minimum, demonstrate:

1. one rock emerging from the 4D slice;
2. one rock changing geometry/scale;
3. one rock sinking or disappearing;
4. at least one rock whose spatial relationship with the terrain changes coherently.

The behaviour must be deterministic.

---

# 14. Coral / Reef Structures

Do not indiscriminately convert every living coral organism into geological terrain.

Instead distinguish:

```text
geological / structural landscape
        vs
biological organisms
```

The landscape subsystem should provide the evolving physical substrate.

The ecology subsystem remains responsible for biological behaviour.

However:

```text
coral / organism
        ↓
landscape support query
        ↓
current terrain / feature surface
```

must be possible.

Where a reef structure is treated as part of the landscape, it must use the same 4D feature system.

---

# 15. Flora Integration

Existing plant lifecycle behaviour should remain intact.

Do not rewrite Task 003/005/006 biological systems unnecessarily.

Instead, provide a landscape anchoring mechanism.

For example:

```text
plant root position
        ↓
LandscapeProjection.resolveSurface(...)
        ↓
current terrain / feature position
```

Plants may still sway, grow, or otherwise animate biologically.

But their base/support must remain coherent with the evolving landscape.

---

# 16. Topology

Correct the conceptual limitation in the existing `LandscapeTopology`.

The current topology graph is useful as semantic metadata, but it must not be represented as the actual geometric topology of the landscape.

Clearly distinguish:

```text
semantic topology
```

from:

```text
geometric topology
```

and from:

```text
render mesh topology
```

Document this distinction.

The topology system should be extended so that landscape features can express relationships such as:

```text
ROCK_001
    supported_by → TERRAIN

ROCK_002
    adjacent_to → RIDGE_001

REEF_001
    attached_to → PLATEAU_001

PLANT_017
    rooted_on → TERRAIN
```

These relationships should use stable feature identities.

Do not falsely claim that the current five-node semantic graph proves geometric connectedness of the rendered landscape.

---

# 17. Geometric Topology Validation

Where practical, introduce validation for the projected geometry.

At minimum, establish mechanisms for detecting:

- invalid NaN geometry;
- disconnected feature projection where connectivity is expected;
- impossible feature placement;
- terrain penetration;
- unsupported floating features;
- invalid bounds;
- degenerate geometry.

If true mesh-topology analysis is too expensive for every frame, provide deterministic sampled validation and/or development-mode validation.

Do not claim complete topological validation when only semantic graph validation exists.

---

# 18. Conformal and Quasi-Conformal Evolution

Task 007 introduced conformal and quasi-conformal concepts.

Preserve these capabilities, but correct the representation where necessary.

The existing implementation appears to calculate deformation vectors containing:

```text
dx
dy
dz
```

while the final heightfield projection primarily consumes:

```text
dy
```

This must be reviewed.

Determine whether the existing conformal/quasi-conformal model is actually producing:

```text
3D coordinate deformation
```

or merely:

```text
vertical displacement
```

Document the result accurately.

Where feasible, extend projection so that landscape feature positions can respond to the full spatial deformation:

\[
(x,z) \rightarrow (x',z')
\]

rather than reducing every deformation to:

\[
y' = y + \Delta y
\]

Do not claim full conformal geometry if the implementation remains a scalar heightfield.

---

# 19. Curvature

Curvature information should be useful to feature projection.

Landscape features may use curvature to influence:

- emergence;
- orientation;
- deformation;
- attachment;
- local geological behaviour.

Do not introduce arbitrary decorative curvature effects.

The relationship must remain deterministic and documented.

---

# 20. 4D Slice Traversal

The visible landscape should evolve because:

\[
w=w(t)
\]

changes.

Maintain one authoritative traversal parameter.

The implementation must be frame-rate independent.

For equivalent elapsed simulation time:

```text
60 × 1/60
```

and:

```text
30 × 1/30
```

should produce equivalent landscape state within an explicitly documented tolerance.

Do not use frame count as a proxy for 4D time.

---

# 21. Determinism

All landscape feature evolution must be deterministic under a fixed seed.

Avoid uncontrolled:

```typescript
Math.random()
```

inside landscape generation/evolution.

Use the existing seeded mechanism or introduce a dedicated deterministic PRNG.

The same:

```text
seed
+
initial state
+
elapsed simulation time
```

must produce the same landscape state.

---

# 22. Avoid Artificial Looping

Review the existing `Landscape4DField`.

In particular, inspect the use of wrapped temporal distance such as:

```text
PERIOD_W = 100.0
```

Do not claim that the landscape is non-periodic if any feature explicitly wraps around a finite `w` period.

Determine whether periodicity is:

1. intentional;
2. accidental;
3. required;
4. undesirable.

If retained, document it explicitly.

Prefer non-repeating or sufficiently long quasi-periodic evolution where the design requires the world to avoid obvious loops.

The test suite must verify the actual property being claimed.

---

# 23. Ecological Coupling

Landscape evolution must remain environmentally meaningful.

If a rock emerges:

- available shelter may change;
- local flow may be affected;
- benthic support may change;
- ecological relationships may eventually respond.

Do not implement a complete new ecology model in this task.

However, expose sufficient authoritative landscape state for existing ecological systems to query.

Do not directly script:

```text
rock appears → fish swims here
```

The landscape should change the environment; ecology should respond through existing mechanisms.

---

# 24. Renderer Boundary

The renderer must remain a projection layer.

Avoid making Three.js objects authoritative.

The architecture should resemble:

```text
                    AUTHORITATIVE STATE

                LandscapeEvolutionSystem
                         │
             ┌───────────┼───────────┐
             │           │           │
          Terrain      Features    Topology
             │           │           │
             └───────────┼───────────┘
                         │
                    Projection
                         │
                         ▼
                   Three.js scene
```

The renderer must not contain independent copies of the landscape's evolutionary truth.

---

# 25. Existing Aquarium Scene

Update:

```text
src/rendering/aquariumScene.ts
```

so that the landscape subsystem drives the relevant scene objects.

Remove the architectural assumption that:

```text
sand = dynamic
rocks = static
coral = static
```

where those objects are part of the landscape model.

The scene should consume projected landscape state.

---

# 26. Existing Coral Geometry Code

Review:

```text
src/rendering/coralGeometries.ts
```

and determine which objects are:

1. biological organisms;
2. geological landscape;
3. structural reef;
4. purely decorative renderer assets.

Do not blindly migrate everything.

Create explicit ownership boundaries.

Any object classified as part of the landscape must receive its state from the landscape system.

Any object remaining biological must be anchored to landscape state where appropriate.

---

# 27. Feature Registry

Implement a deterministic landscape feature registry or equivalent.

It must support:

```text
register(feature)
get(featureId)
list()
remove(featureId)
```

and stable identity.

The registry should allow the landscape system to operate independently of Three.js.

Do not use:

```text
Mesh.uuid
array index
object reference
```

as the semantic identity.

---

# 28. Feature State

Expose an inspectable feature state.

At minimum:

```typescript
interface LandscapeFeatureState {
    id: string;
    type: string;
    position4D: ...;
    scale4D: ...;
    wRange: ...;
    visible: boolean;
    projectedPosition: ...;
    projectedScale: ...;
    curvature: number;
    topologyRelations: ...;
}
```

The exact TypeScript types are implementation-dependent.

The state must distinguish authoritative 4D state from projected 3D state.

---

# 29. Projection Invariants

Establish and test invariants including:

### Identity

A feature's identity remains stable regardless of:

- feature ordering;
- projection ordering;
- mesh ordering.

### Determinism

Same:

```text
seed + state + w
```

produces equivalent projected feature state.

### Slice consistency

Changing `w` changes projected state according to the feature's 4D definition.

### Renderer independence

Landscape evolution can be advanced and tested without requiring Three.js rendering.

### Surface consistency

Landscape-supported features remain consistent with the current landscape surface unless the feature's 4D definition explicitly permits separation.

### No positional identity coupling

Feature identity must never be inferred from position or array index.

---

# 30. Tests

Expand the existing test suite substantially.

At minimum add tests for:

## Feature identity

- stable feature IDs;
- registry lookup;
- reordered feature collections;
- missing features;
- deterministic generation.

## 4D projection

- feature invisible outside its w-domain;
- feature emerges within its w-domain;
- feature changes as w changes;
- feature disappears after leaving its w-domain.

## Rocks

- deterministic rock generation;
- rock projection;
- rock deformation;
- rock/terrain relationship.

## Terrain

- terrain state remains deterministic;
- feature projection uses the same w;
- terrain and features share coordinates.

## Topology

- reciprocal relationships;
- stable topology IDs;
- semantic topology distinct from mesh topology.

## Frame-rate independence

Compare equivalent elapsed time using different timestep sequences.

## Renderer independence

Run landscape evolution without constructing a Three.js scene.

## Invalid state

Detect:

- NaN;
- infinite coordinates;
- invalid bounds;
- negative/invalid scales where prohibited;
- degenerate projected geometry.

---

# 31. Integration Tests

Create an integration test demonstrating the full chain:

```text
4D landscape
    ↓
w traversal
    ↓
terrain evolution
    ↓
rock projection
    ↓
reef/structure projection
    ↓
surface resolution
    ↓
ecological anchor query
```

The test should verify that the objects are driven by the same authoritative landscape state.

---

# 32. Visual Verification

The implementation must visibly demonstrate that the aquarium world itself evolves.

A reviewer should be able to observe:

- terrain changing;
- rocks changing position/shape/visibility;
- structural formations changing;
- landscape relationships changing;
- biological objects remaining spatially anchored to the changing environment.

The visual effect should **not** look like:

```text
animated floor + stationary props
```

It should look like:

```text
the observer is traversing an evolving four-dimensional environment
```

This distinction is a core acceptance criterion.

---

# 33. Performance

Do not sacrifice real-time operation unnecessarily.

Measure:

- landscape state update;
- feature projection;
- geometry update;
- topology update;
- ecological anchor resolution.

Do not perform expensive full-volume reconstruction every frame unless required.

Prefer:

- analytical evaluation;
- cached feature representations;
- stable render objects;
- selective geometry updates;
- deterministic spatial sampling.

Document any significant performance trade-offs.

---

# 34. Backward Compatibility

Existing Task 007 tests must continue to pass unless a test asserts a demonstrably incorrect architectural claim.

If an existing test is incorrect because it encodes the old model, correct the test and document why.

Do not simply weaken tests to make the implementation pass.

---

# 35. Documentation Corrections

Update Task 007 documentation/report where it currently overstates capabilities.

Specifically distinguish:

### Currently implemented

```text
4D analytical field
4D traversal
evolving heightfield
conformal/quasi-conformal calculations
semantic topology
```

from:

### Newly implemented by 007A

```text
4D landscape features
4D rock representation
feature projection
structural landscape integration
landscape anchoring
feature topology relationships
```

Do not claim:

- full 4D volumetric geometry;
- complete geometric topology;
- non-periodic evolution;

unless the implementation actually satisfies those properties.

---

# 36. Anti-Requirements

Do NOT:

- introduce OpenVDB;
- introduce USD;
- introduce H3;
- introduce ML;
- introduce a new physics engine;
- replace Three.js;
- rewrite the ecology engine;
- implement a general-purpose 4D mesh engine;
- add persistent world storage;
- introduce multiplayer;
- introduce networking;
- introduce procedural narratives;
- create arbitrary per-object animation timelines;
- make renderer objects authoritative;
- replace Task 007 with an unrelated system.

These are outside the scope of 007A.

---

# 37. Architectural Principle

The following principle governs all implementation decisions:

> **The renderer is a projection of the world, not the world itself.**

More specifically:

```text
4D semantic landscape
        ↓
authoritative landscape state
        ↓
3D slice/projection
        ↓
render representation
```

Never reverse this relationship.

---

# 38. Required Deliverables

Implement and commit:

### Source

All required source changes under appropriate existing directories, preferably:

```text
src/landscape/
```

with clear separation between:

```text
field
feature
evolution
projection
topology
registry
integration
```

where appropriate.

### Tests

Add comprehensive tests under the existing test structure.

### Documentation

Create:

```text
program_increments/v0.0.2/reports/007A_landscape_feature_integration_report.md
```

The report must contain:

1. implementation summary;
2. architectural changes;
3. 4D feature model;
4. terrain integration;
5. rock integration;
6. structural/reef integration;
7. biological anchoring;
8. topology model;
9. deterministic execution;
10. performance measurements;
11. test results;
12. known limitations;
13. claims explicitly verified against source;
14. claims intentionally not made.

---

# 39. Verification Gates

Do not declare the task complete merely because the code compiles.

The task is complete only when all of the following are true.

## Gate A — Architectural

The landscape is represented as a coherent 4D system.

## Gate B — Feature

Rocks and relevant structural landscape objects participate in that system.

## Gate C — Projection

Visible 3D feature state is derived from the 4D world.

## Gate D — Identity

Feature identity is independent of renderer identity and collection ordering.

## Gate E — Determinism

Fixed seed + fixed elapsed time produces deterministic state.

## Gate F — Integration

Terrain, features, and ecological anchoring use the same landscape state.

## Gate G — Topology

Semantic topology is explicitly distinguished from geometric topology.

## Gate H — Renderer separation

Landscape evolution can execute without the renderer.

## Gate I — Testing

All new invariants are covered by automated tests.

## Gate J — Visual

The result visibly demonstrates an evolving landscape rather than an animated substrate surrounded by static scenery.

---

# 40. Final Acceptance Test

The decisive test is conceptual and visual.

Start the aquarium.

Observe a sufficiently long interval of landscape evolution.

The reviewer should be able to identify at least:

```text
terrain changes
+
rock changes
+
structural landscape changes
+
spatial relationship changes
+
ecological anchoring
```

and all of these changes must originate from the same evolving 4D landscape state.

If the result can still be accurately described as:

> "The sand moves while the rocks stay put."

then Task 007A has failed.

If instead the result can be accurately described as:

> "The visible aquarium is a changing 3D section through a coherent evolving 4D landscape."

then the principal objective has been achieved.

---

# 41. Development Method

Follow the repository's established development process:

```text
inspect
    ↓
model
    ↓
specify
    ↓
implement
    ↓
test
    ↓
validate
    ↓
profile
    ↓
review
    ↓
document
```

Before implementation:

1. inspect all existing Task 007 source;
2. inspect existing Task 003–006 integration;
3. inspect current renderer ownership;
4. identify static landscape objects;
5. identify biological objects;
6. identify existing topology semantics;
7. identify all deterministic/randomness sources.

Do not assume the Task 007 report is fully accurate.

Verify its claims against the source.

Where source and documentation disagree, treat the source and executable behaviour as authoritative and correct the documentation.

---

# 42. Adversarial Review Requirement

During implementation actively search for architectural false positives.

In particular ask:

### Is this really 4D?

Or is it merely:

```text
3D animation parameterised by time?
```

### Is this really a feature projection?

Or is it:

```text
static mesh + animation?
```

### Is this really topology?

Or is it:

```text
metadata describing topology?
```

### Is this really conformal deformation?

Or is it:

```text
height displacement derived from a conformal calculation?
```

### Is this really deterministic?

Or does an uncontrolled random source remain?

### Is the renderer really a projection?

Or has authoritative state leaked back into Three.js objects?

Do not hide these distinctions in terminology.

The purpose of this task is to make the implementation's ontology match the intended model.

---

# 43. Completion Statement

At completion, the development report must explicitly state:

```text
Task 007A completion status:
COMPLETE / PARTIAL / BLOCKED
```

and justify that status against every verification gate.

The report must not declare completion simply because tests pass.

A passing test suite is necessary but not sufficient.

The implementation must satisfy the architectural requirement that the aquarium represents a coherent evolving 4D landscape whose terrain and landscape features are projections of the same underlying world.