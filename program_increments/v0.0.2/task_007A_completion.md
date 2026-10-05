# Task 007A Completion — Landscape Projection Conformance

**File:** `program_increments/v0.0.2/task_007A_completion.md`  
**Program Increment:** `v0.0.2`  
**Parent task:** `program_increments/v0.0.2/task_007A.md`  
**Objective:** Complete and bring the existing Task 007A implementation into conformance with its stated architectural requirements.

---

# 1. Mission

Task 007A has been substantially implemented.

The repository now contains:

- a 4D landscape feature abstraction;
- deterministic feature identities;
- a feature registry;
- evolving rocks;
- reef structures;
- flora anchors;
- semantic topology;
- geometric validation;
- renderer projection;
- headless feature evaluation;
- deterministic 4D traversal.

However, source-level review identified several remaining inconsistencies between the intended architecture and the actual implementation.

This task exists to **complete those remaining requirements**.

Do not replace the existing Task 007/007A architecture.

Do not create another independent landscape subsystem.

Do not merely modify tests or documentation to claim compliance.

The objective is to make the implementation itself conform.

---

# 2. Core Architectural Invariant

The following is the authoritative requirement:

> The visible aquarium landscape must be a projection of one coherent evolving 4D landscape state.

The intended relationship is:

```text
                         AUTHORITATIVE M⁴
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       terrain⁴            geology⁴             reef⁴
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
                          ecology
```

The implementation may use analytical/parametric approximations rather than literal 4D meshes.

However, all visible landscape features intended to participate in the landscape must derive their state from the same authoritative 4D world.

---

# 3. Current Known Gaps

The implementation review identified these concrete issues.

## GAP-001 — Geological formations are registered but not rendered

The registry contains:

```text
FORMATION_WEST_SHELF
FORMATION_EAST_BANK
FORMATION_CENTRAL_TRENCH
FORMATION_SEABED_PLATEAU
```

but `LandscapeProjection` has no corresponding geological formation projection path.

These features therefore exist semantically but do not fully manifest in the visible landscape.

---

## GAP-002 — `STRUCTURE_001` has no renderer target

`STRUCTURE_001` is registered as a landscape feature but the renderer's reef mapping contains only the explicitly created reef objects.

Therefore:

```text
STRUCTURE_001
    ↓
feature state
    ↓
NO VISIBLE PROJECTION
```

This must be resolved.

---

## GAP-003 — Terrain and features do not yet use one complete spatial deformation

Feature projection currently uses:

```text
dx
dy
dz
```

while terrain projection remains primarily:

```text
H(x,z,w)
```

with vertical displacement.

This creates an architectural asymmetry:

```text
                deformation field
                 /            \
                /              \
           features           terrain
          dx + dy + dz          dy
```

The intended architecture requires one coherent spatial interpretation.

---

## GAP-004 — 4D feature geometry is parametric, not general volumetric intersection

The current implementation is a valid engineering approximation:

```text
4D feature parameters
        ↓
evaluate at w
        ↓
3D transform/state
        ↓
render mesh
```

It must not falsely claim to implement:

```text
general 4D volumetric geometry
        ↓
literal hypersurface intersection
```

This does not necessarily require replacing the current feature representation.

The task is to make the distinction explicit and ensure the approximation is internally coherent.

---

## GAP-005 — Reef temporal behaviour differs from rock behaviour

Rocks use smooth temporal emergence/submergence.

Reef structures currently have more binary `wRange` visibility.

Determine whether reef structures should:

1. remain continuously present within their temporal support; or
2. smoothly emerge/disappear like rocks.

For the intended evolving-world model, use smooth temporal support where appropriate.

---

# 4. Required Work

## 4.1 Complete Geological Formation Projection

Implement a proper projection path for:

```text
FORMATION_WEST_SHELF
FORMATION_EAST_BANK
FORMATION_CENTRAL_TRENCH
FORMATION_SEABED_PLATEAU
```

The implementation must ensure that their state has visible consequences in the aquarium.

There are two acceptable approaches.

### Preferred approach

Integrate their influence directly into the authoritative terrain/landscape field:

```text
formation feature
       ↓
4D evaluation
       ↓
landscape field
       ↓
terrain projection
```

This is preferred because shelves, banks, trenches and plateaus are naturally part of the substrate rather than independent props.

### Alternative

If direct field integration would require disproportionate architectural change, implement explicit projected geometry.

In that case:

```text
formation⁴
     ↓
evaluate(w)
     ↓
3D formation state
     ↓
renderer
```

must be used.

Do not create arbitrary renderer-only animation.

---

# 5. Formation Evaluation Requirements

Every geological formation must expose an authoritative state at the current `w`.

At minimum:

```text
id
type
visible
position
scale
bounds
surface influence
curvature influence
w-domain
```

The state must be deterministic.

The formation must respond to the common:

```text
LandscapeEvolutionSystem.time4D
```

rather than maintaining an independent time variable.

---

# 6. `STRUCTURE_001`

Resolve the `STRUCTURE_001` inconsistency.

Choose one of:

### Option A — Render it

Create an explicit renderer representation and add it to the relevant projection map.

### Option B — Remove it from the default feature set

If the feature is intentionally semantic-only, remove it from claims that all registered features are visible.

**Preferred:** Option A.

The default feature registry should not contain a supposedly visible landscape structure for which no renderer manifestation exists.

---

# 7. Unified Spatial Deformation

This is the most important remaining geometric correction.

Define a single spatial transformation:

\[
\Phi_w(x,z) =
(x',z')
\]

or, if the implementation requires a full 3D mapping:

\[
\Phi_w(x,y,z) =
(x',y',z')
\]

This mapping must originate from the authoritative landscape evolution state.

The same spatial interpretation must be available to:

```text
terrain
rocks
reef structures
geological formations
flora anchors
```

The renderer must not independently invent different interpretations.

---

# 8. Terrain Projection

Review:

```text
LandscapeProjection.projectOntoMesh()
```

and the corresponding terrain sampling path.

Determine whether horizontal deformation can be safely incorporated.

The desired conceptual operation is:

```text
logical world coordinate
        ↓
4D landscape deformation
        ↓
projected world coordinate
        ↓
terrain evaluation
        ↓
render vertex
```

rather than:

```text
mesh coordinate
        ↓
height query
        ↓
vertical displacement only
```

If applying horizontal deformation directly to the existing PlaneGeometry would create unacceptable distortion or instability, implement an explicit world-to-slice projection function and document the approximation.

Do not silently retain two incompatible coordinate systems.

---

# 9. Coordinate-System Invariant

Establish and test:

> A feature and the terrain evaluated at the same logical `(x,z,w)` use the same landscape deformation function.

For example:

```typescript
const terrainPoint =
    landscape.projectSurface(x, z, w);

const featurePoint =
    landscape.projectFeature(feature, w);
```

Both must ultimately derive from the same authoritative spatial transformation.

Do not duplicate deformation equations in separate renderer classes.

---

# 10. Surface Resolution

Centralize surface resolution where practical.

The system should provide a reusable operation conceptually equivalent to:

```text
resolveSurface(x, z, w)
```

returning enough information to support:

```text
position
normal
height
curvature
deformation
```

The exact API may differ.

The critical requirement is that rocks, reef structures and flora anchors should not each independently approximate the landscape surface.

---

# 11. Terrain / Feature Consistency

For every supported feature:

```text
feature.projectedPosition
```

must be compatible with:

```text
landscape.resolveSurface(feature.logicalPosition)
```

unless the feature's geometry explicitly requires another relationship.

Test at least:

- a rock;
- a reef;
- a flora anchor.

The test must verify that changing `w` changes the landscape and the supported feature consistently.

---

# 12. Geological Feature Influence

Geological formations must influence the landscape in a semantically meaningful way.

For example:

```text
WEST_SHELF
    → local elevation influence

CENTRAL_TRENCH
    → local negative elevation influence

SEABED_PLATEAU
    → broad positive elevation influence
```

Do not simply create floating decorative meshes representing those names.

The formations should have an actual relationship to the landscape surface.

Prefer analytical field contributions where possible.

For example:

\[
H(x,z,w)
=
H_{base}
+
\sum_i F_i(x,z,w)
+
\sum_j D_j(x,z,w)
\]

where geological formation contributions are part of the same landscape field.

---

# 13. Formation Blending

Formation influence must be smoothly blended.

Avoid hard discontinuities such as:

```text
if (distance < radius)
    addHeight()
```

Use the existing smooth bump/field machinery where appropriate.

Maintain continuity of:

- position;
- height;
- preferably gradient.

Avoid visible seams between formations.

---

# 14. Rock Projection

Retain the existing rock feature system.

Do not replace it with a new architecture.

However, verify that each rock's:

```text
position
scale
rotation
visibility
```

comes from:

```text
feature.evaluate(w)
```

and ultimately from the authoritative landscape state.

Remove any remaining renderer-side random or time-driven evolution of the rocks.

---

# 15. Rock / Terrain Relationship

Verify that rocks remain spatially coherent with the terrain.

A rock should not visibly:

- float;
- sink arbitrarily;
- detach from the substrate;
- move according to a different deformation field.

Unless its 4D definition explicitly produces such behaviour.

Create a deterministic test over multiple `w` samples.

---

# 16. Reef Projection

Retain the existing reef feature abstraction.

Ensure all intended reef structures have actual renderer targets.

If the registry contains:

```text
REEF_001
REEF_002
STRUCTURE_001
```

then all three must either:

1. project visibly; or
2. be explicitly marked semantic-only and removed from the default visible feature set.

Prefer visible projection.

---

# 17. Smooth Reef Temporal Support

Review `ReefStructure4DFeature.evaluate()`.

If reef structures are intended to emerge/disappear as the 4D slice passes through them, replace binary visibility with a smooth temporal envelope.

Conceptually:

\[
a(w) = smoothstep(w_{start},w_{rise},w)
        \cdot
        smoothstep(w_{end},w_{fall},w)
\]

The exact function is implementation-dependent.

The objective is:

```text
absent
  ↓
emerging
  ↓
present
  ↓
receding
  ↓
absent
```

rather than:

```text
absent
  ↓
instantaneously visible
  ↓
instantaneously invisible
```

Do this only where it makes semantic sense.

---

# 18. Flora

Do not turn all biological organisms into landscape features.

Maintain the distinction:

```text
LANDSCAPE
    terrain
    geology
    structural reef

BIOLOGY
    fish
    plants
    organisms
```

Landscape provides the physical support.

Biology provides organism state.

Flora anchors may remain part of the landscape integration layer.

Ensure the existing biological lifecycle and sway systems remain intact.

---

# 19. Topology

Do not falsely promote the existing semantic topology graph into a claim of complete geometric topology.

Maintain three explicit concepts:

```text
semantic topology
    ↓
relationships between world features

geometric validation
    ↓
validity of projected geometry

render topology
    ↓
actual mesh connectivity
```

If new relationships are required for geological formations, add them using stable feature IDs.

Example:

```text
FORMATION_WEST_SHELF
    supports ROCK_001

FORMATION_CENTRAL_TRENCH
    adjacent_to FORMATION_SEABED_PLATEAU
```

Do not infer topology from array ordering.

---

# 20. Feature Identity

Preserve the current explicit feature IDs.

No feature matching may depend on:

- array index;
- renderer order;
- mesh UUID;
- creation order;
- modulo arithmetic.

Add regression tests specifically proving this.

---

# 21. Determinism

All changes must remain deterministic.

Audit for:

```typescript
Math.random()
```

in all new landscape logic.

For a fixed:

```text
seed
initial state
elapsed simulation time
```

the resulting landscape feature state must be deterministic.

---

# 22. Frame-Rate Independence

Preserve and extend the existing timestep test.

For equivalent elapsed simulation time:

```text
60 × 1/60
30 × 1/30
10 × 1/10
```

must produce equivalent state within documented tolerance.

Include:

- terrain;
- geological formations;
- rocks;
- reef;
- flora anchors.

---

# 23. 4D Semantics — Be Precise

Do not claim the implementation has become a general-purpose 4D geometric engine.

The current representation may legitimately remain:

```text
4D parametric / implicit feature definition
        ↓
evaluation at w
        ↓
3D projected geometry
```

This is sufficient for this task.

Document it accurately.

The important requirement is semantic coherence, not unnecessary mathematical machinery.

---

# 24. Conformal / Quasi-Conformal Deformation

Review the existing conformal and quasi-conformal deformation implementation.

Ensure the following distinction is explicit:

```text
conformal component
    ≠
entire composite landscape transformation
```

The system may combine several deformation modes.

Do not claim global conformality unless mathematically demonstrated.

If terrain and feature coordinates now share the same deformation map, add tests demonstrating that they receive equivalent displacement under the same inputs.

---

# 25. Periodicity

Preserve the existing documentation around finite `w` periods.

Do not silently remove:

```text
PERIOD_W = 100
```

unless there is a clear reason.

Do not claim global non-periodicity.

Instead document:

```text
harmonic components
    → quasi-periodic / incommensurate

localized geological formations
    → finite wrapped w-domain where applicable
```

If you change this behaviour, add tests proving the new property.

---

# 26. Rendering Performance

Maintain the current real-time performance characteristics.

Measure separately:

```text
terrain projection
formation projection
rock projection
reef projection
flora projection
total landscape update
```

Do not regenerate expensive geometry every frame unless necessary.

Prefer:

- stable meshes;
- procedural deformation;
- cached geometry;
- selective updates;
- analytical feature evaluation.

---

# 27. Tests Required

Add or update tests for all corrected gaps.

## 27.1 Geological formations

Test:

- all four formations register;
- all four evaluate;
- all four affect the visible landscape;
- changing `w` changes their contribution;
- formation state is deterministic.

## 27.2 Structure

Test:

- `STRUCTURE_001` has a renderer projection;
- its state reaches the renderer;
- its visibility is deterministic.

## 27.3 Terrain deformation

Test:

- terrain uses the common spatial deformation;
- horizontal deformation is applied consistently if supported;
- terrain and features agree on projected coordinates.

## 27.4 Feature support

Test:

- rock follows surface;
- reef follows surface;
- flora anchor follows surface.

## 27.5 Temporal behaviour

Test smooth emergence/disappearance where applicable.

## 27.6 Renderer independence

Ensure all landscape state and feature evaluation tests can execute without WebGL.

---

# 28. Integration Test

Create one explicit end-to-end test representing the intended world model:

```text
seed
  ↓
LandscapeEvolutionSystem
  ↓
4D world state
  ↓
geological formations
  ↓
terrain
  ↓
rocks
  ↓
reef
  ↓
flora anchors
  ↓
projected 3D state
```

The test must demonstrate that every stage uses the same `w`.

---

# 29. Visual Acceptance Test

The final aquarium must demonstrate all of the following:

### Terrain

The substrate evolves.

### Geology

At least one shelf/bank/trench/plateau visibly influences the landscape.

### Rocks

At least two rocks visibly change through 4D traversal.

### Reef

At least one reef structure visibly evolves.

### Flora

At least one plant remains spatially anchored to the changing landscape.

### Coherence

These changes must look like consequences of one evolving environment.

The visual result must not be accurately describable as:

> "The sand moves while independently animated objects move around it."

It should instead be describable as:

> "The visible aquarium is a changing three-dimensional section through one evolving landscape."

---

# 30. Documentation

Update:

```text
program_increments/v0.0.2/reports/007A_landscape_feature_integration_report.md
```

Do not merely append a new success statement.

Rewrite the report where necessary so that it accurately reflects the final implementation.

Include:

1. original gaps;
2. implementation changes;
3. architectural changes;
4. geological formation integration;
5. unified spatial deformation;
6. rock integration;
7. reef integration;
8. flora anchoring;
9. topology;
10. determinism;
11. frame-rate independence;
12. tests;
13. performance;
14. limitations;
15. known approximations;
16. verification gate results.

---

# 31. Verification Gates

At completion, evaluate every gate independently.

## Gate A — 4D architecture

PASS only if the authoritative landscape state is common to terrain and landscape features.

## Gate B — Feature manifestation

PASS only if every feature claimed as visible actually reaches a renderer representation.

## Gate C — Projection

PASS only if visible state is derived from the authoritative 4D state.

## Gate D — Identity

PASS only if feature identity is independent of ordering and renderer objects.

## Gate E — Determinism

PASS only if fixed seed/state/time produces equivalent results.

## Gate F — Spatial coherence

PASS only if terrain, rocks, reef and flora use compatible landscape deformation/surface resolution.

## Gate G — Topology

PASS only if semantic topology is explicitly distinguished from geometric/render topology.

## Gate H — Renderer separation

PASS only if landscape state can be evaluated without Three.js.

## Gate I — Testing

PASS only if every corrected requirement has automated coverage.

## Gate J — Visual

PASS only if the complete landscape visibly behaves as one evolving world.

---

# 32. Completion Criteria

The task is COMPLETE only if all ten gates pass.

Do not mark a gate PASS because:

- a class exists;
- a test merely instantiates the class;
- documentation says the feature exists;
- the feature is registered;
- the renderer contains a placeholder;
- a semantic state exists without visible manifestation.

A feature intended to be visible must actually be visible.

A deformation claimed to affect terrain must actually affect terrain.

A shared world transformation must actually be shared.

---

# 33. Adversarial Review Before Completion

Before declaring completion, explicitly attempt to falsify the architecture.

Ask:

### Test 1

Can a registered landscape feature exist without a visible manifestation?

If yes, explain why it is semantic-only.

### Test 2

Can terrain and a rock at the same logical coordinate receive different horizontal deformation?

If yes, the spatial model is still inconsistent.

### Test 3

Can a rock float above terrain solely because the renderer applies a different transform?

If yes, surface coherence is incomplete.

### Test 4

Can `STRUCTURE_001` exist in the registry without a render target?

If yes, feature registration and projection are still disconnected.

### Test 5

Can geological formations change their state without changing the visible landscape?

If yes, their integration is incomplete.

### Test 6

Can the landscape be advanced without Three.js?

It must be YES.

### Test 7

Can two different timestep sequences produce materially different landscape states after the same elapsed time?

They must NOT.

### Test 8

Can array reordering change which feature is rendered?

It must NOT.

---

# 34. Do Not Game the Tests

Do not satisfy the acceptance criteria by:

- weakening assertions;
- removing features;
- marking visible features semantic-only without architectural justification;
- reducing test coverage;
- hardcoding expected positions;
- bypassing the feature registry;
- adding renderer-specific exceptions;
- introducing hidden global state;
- making the test environment different from the real runtime.

Tests must validate the architecture rather than merely the implementation's current behaviour.

---

# 35. Required Final Report

Create/update:

```text
program_increments/v0.0.2/reports/007A_landscape_feature_integration_report.md
```

The final report must contain this exact high-level conclusion structure:

```text
Task 007A Status:
    COMPLETE / PARTIAL / BLOCKED

Verification Gates:
    A: PASS/FAIL
    B: PASS/FAIL
    C: PASS/FAIL
    D: PASS/FAIL
    E: PASS/FAIL
    F: PASS/FAIL
    G: PASS/FAIL
    H: PASS/FAIL
    I: PASS/FAIL
    J: PASS/FAIL
```

If any gate fails, the overall status must not be `COMPLETE`.

The report must distinguish:

```text
FACT
    directly verified implementation behaviour

INFERENCE
    behaviour inferred from architecture

APPROXIMATION
    engineering approximation of the intended 4D model

LIMITATION
    known deviation from the target architecture
```

Do not use terminology to conceal an approximation.

---

# 36. Final Architectural Test

The final question is:

> If the renderer were replaced tomorrow, would the authoritative landscape state still describe the same evolving world?

The answer must be **yes**.

The renderer should merely provide a visual projection of that state.

The final architecture should therefore be:

```text
                  AUTHORITATIVE WORLD

                       Landscape M⁴
                            │
                     Evolution w(t)
                            │
              ┌─────────────┼─────────────┐
              │             │             │
           Terrain       Geology         Reef
              │             │             │
              └─────────────┼─────────────┘
                            │
                     Spatial projection
                            │
                            ▼
                       3D world state
                            │
              ┌─────────────┼─────────────┐
              │             │             │
           Terrain        Rocks          Reef
              │             │             │
              └─────────────┼─────────────┘
                            │
                         Ecology
                            │
                         Renderer
```

This is the target.

Complete the existing 007A implementation until this architecture is true in both code and observable behaviour.

Do not declare success until the source, tests, documentation and visual behaviour all agree.