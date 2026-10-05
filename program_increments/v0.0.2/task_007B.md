# Task 007B — 4D Projection Parameter Conformance & Final Sign-Off

**Repository:** `zharia/UEWS_experiments_hyperdimensional_boids`  
**Program Increment:** `v0.0.2`  
**Task:** `007B`  
**Suggested file:** `program_increments/v0.0.2/task_007B.md`

---

# 1. Objective

Complete the remaining conformance issues identified during the independent review of Task 007A.

This is **not a redesign of the landscape architecture**.

The existing Task 007 / 007A architecture is fundamentally sound and must be preserved.

The objective is to make the existing 4D landscape model mathematically and operationally consistent when an explicit fourth-dimensional coordinate `w` is supplied.

The central invariant is:

\[
\boxed{
\text{Every result requested at }w\text{ must be evaluated entirely at }w.
}
\]

No part of a result requested for `w = W` may silently depend upon the mutable current simulation coordinate `LandscapeEvolutionSystem.time4D`.

---

# 2. Problem Statement

The current implementation supports APIs such as:

```ts
projectSurface(x, z, w)
projectFeature(feature, w)
```

but some downstream state—particularly surface normal/curvature and feature surface resolution—can still be derived through methods whose implicit temporal coordinate is the system's current `time4D`.

This creates a subtle semantic inconsistency:

```text
requested slice:
        w = 35

explicit evaluation:
        w = 35

implicit geometry state:
        time4D = 12
```

That means the API can construct a hybrid state which does not correspond exactly to any single 3D slice of the 4D landscape.

This must be eliminated.

---

# 3. Architectural Invariant

The authoritative landscape is:

\[
\mathcal{L} : (x,z,w) \rightarrow S
\]

where `S` is the complete surface state required by downstream consumers.

At minimum:

```ts
interface SurfaceResolution {
    position: Vector3;
    height: number;
    normal: Vector3;
    curvature: number;
    flowDelta: {
        x: number;
        y: number;
        z: number;
    };
}
```

The critical invariant is:

\[
S = \mathcal{L}(x,z,w)
\]

and **not**:

\[
S = f(x,z,w,\text{currentMutableTime})
\]

unless:

```text
currentMutableTime === w
```

---

# 4. Required Implementation

## 4.1 Introduce `resolveSurfaceAt()`

Implement a pure/explicit-time surface resolver:

```ts
resolveSurfaceAt(
    x: number,
    z: number,
    w: number
): SurfaceResolution
```

This method must perform the complete surface calculation at the supplied `w`.

It must not read:

```ts
this.time4D
```

for its temporal state.

It may use immutable configuration and authoritative field/geometry definitions.

---

## 4.2 Preserve `resolveSurface()`

Retain:

```ts
resolveSurface(x, z)
```

as a convenience API.

Its implementation should effectively be:

```ts
resolveSurface(x, z) {
    return this.resolveSurfaceAt(x, z, this.time4D);
}
```

This maintains backwards compatibility while making the semantic distinction explicit.

---

# 5. Correct `projectSurface()`

Refactor:

```ts
projectSurface(x, z, w)
```

so that all returned values originate from:

```ts
resolveSurfaceAt(x, z, w)
```

including:

- height;
- position;
- horizontal deformation;
- vertical deformation;
- normal;
- curvature;
- any other temporal surface property.

Do not mix:

```text
field evaluated at w
```

with:

```text
geometry evaluated at time4D
```

---

# 6. Correct `projectFeature()`

Audit:

```ts
projectFeature(feature, w)
```

carefully.

Every operation contributing to the resulting feature state must use the same `w`.

In particular, eliminate patterns equivalent to:

```ts
feature.evaluate(w)

resolveSurface(feature.x, feature.z)
```

because the second operation implicitly evaluates at `time4D`.

Use:

```ts
feature.evaluate(w)

resolveSurfaceAt(feature.x, feature.z, w)
```

or an equivalent explicit-time operation.

---

# 7. General Rule: No Hidden Temporal State

Perform an adversarial audit of the complete landscape projection call graph.

Search for every use of:

```ts
time4D
```

and determine whether it is:

1. genuinely simulation-global mutable state;
2. a convenience default for current-frame evaluation;
3. accidentally leaking into explicit-`w` evaluation.

Any function accepting:

```ts
w
```

must not silently use:

```ts
this.time4D
```

for the same temporal dimension.

The following pattern is prohibited:

```ts
foo(x, z, w) {
    ...
    bar(x, z); // bar silently uses this.time4D
}
```

unless the use of current time is explicitly intentional and documented.

---

# 8. Explicit-`w` Conformance Tests

Add tests proving that explicit `w` evaluation is independent of the evaluator's current state.

## Test 1 — Surface equivalence

Construct:

```text
System A
    time4D = 10

System B
    time4D = 35
```

Then compare:

```ts
A.projectSurface(x, z, 35)
```

with:

```ts
B.projectSurface(x, z)
```

They must be equivalent within the documented floating-point tolerance.

---

## Test 2 — Feature equivalence

Evaluate:

```ts
A.projectFeature(feature, 35)
```

where:

```text
A.time4D = 10
```

against:

```ts
B.projectFeature(feature, 35)
```

where:

```text
B.time4D = 35
```

The results must be equivalent.

---

## Test 3 — Current-time compatibility

Verify:

```ts
system.projectSurface(x, z, system.time4D)
```

equals:

```ts
system.resolveSurface(x, z)
```

within tolerance.

---

## Test 4 — Temporal isolation

Evaluate the same explicit slice repeatedly while changing the system's current time:

```text
current = 0
evaluate w = 50

current = 25
evaluate w = 50

current = 75
evaluate w = 50
```

All three results must be identical.

This is a critical test.

---

## Test 5 — Feature temporal isolation

Perform the equivalent test for:

```ts
projectFeature(feature, 50)
```

while varying `time4D`.

---

# 9. Geological Formation Identity

Remove unnecessary dual identity where practical.

Current architecture has a distinction between registry identities such as:

```text
FORMATION_WEST_SHELF
FORMATION_EAST_BANK
FORMATION_CENTRAL_TRENCH
FORMATION_SEABED_PLATEAU
```

and field-level identities such as:

```text
WEST_SHELF_DUNE
EAST_SAND_BANK
CENTRAL_TRENCH
SEABED_PLATEAU
```

Establish a single canonical semantic identity.

Preferred form:

```text
FORMATION_WEST_SHELF
FORMATION_EAST_BANK
FORMATION_CENTRAL_TRENCH
FORMATION_SEABED_PLATEAU
```

Use those identifiers throughout:

- feature registry;
- field geometry;
- topology;
- diagnostics;
- tests;
- reports.

Avoid an alias translation layer unless there is a compelling architectural reason to retain one.

If backwards compatibility makes immediate removal undesirable, document the mapping explicitly and identify which identifier is canonical.

---

# 10. Preserve the Existing Architecture

Do **not**:

- replace the 4D landscape architecture;
- introduce a new physics engine;
- introduce OpenUSD;
- introduce OpenVDB;
- introduce H3;
- introduce networking;
- introduce ML/AI;
- replace Three.js;
- redesign the feature registry;
- replace the deterministic identity system;
- convert the system into a literal volumetric 4D mesh engine;
- rewrite the renderer.

Those are outside the scope of this task.

The purpose is to make the existing architecture internally coherent.

---

# 11. Preserve the 4D Model

Do not accidentally change the semantic model from:

\[
\mathcal{L}(x,z,w)
\]

into an ordinary time-varying 3D simulation.

The fourth dimension remains part of the landscape representation.

The visible aquarium remains a projection/slice:

\[
\Sigma_w^3 = \mathcal{L}_w
\]

The implementation may remain analytical/parametric.

Do not claim literal arbitrary 4D volumetric mesh intersection unless such functionality actually exists.

---

# 12. Conformal / Deformation Terminology

Maintain the distinction between:

### Valid claim

The system implements a unified spatial deformation field with components that may exhibit conformal or quasi-conformal behaviour.

### Invalid claim

The entire composite landscape transformation has been mathematically proven globally conformal.

Do not strengthen the terminology merely to make the completion report appear stronger.

---

# 13. Topology Terminology

Maintain the existing distinction between:

```text
semantic topology
geometric validation
render topology
```

Do not claim that the current implementation computes:

- genus;
- Betti numbers;
- persistent homology;
- connected-component topology;
- manifoldness;
- topological phase transitions;

unless those are actually implemented and tested.

---

# 14. Renderer Independence

Preserve the architectural property:

```text
Authoritative Landscape
        ↓
Projection
        ↓
Renderer
```

not:

```text
Renderer
        ↓
Landscape state
```

The renderer must remain a consumer.

The authoritative simulation must remain capable of describing the world without Three.js.

---

# 15. Regression Requirements

The following existing behaviour must remain intact:

- deterministic feature registration;
- stable feature IDs;
- deterministic landscape evaluation;
- frame-rate-independent evolution;
- terrain deformation;
- geological formations;
- rocks;
- reef structures;
- `STRUCTURE_001`;
- flora anchors;
- topology validation;
- renderer separation.

Run the complete existing test suite.

Do not weaken or delete existing tests merely to accommodate the implementation.

---

# 16. Performance

Measure whether introducing `resolveSurfaceAt()` creates a material performance regression.

Compare:

```text
before
after
```

for:

- landscape evolution;
- terrain projection;
- feature projection;
- complete landscape frame.

The explicit-time API should preferably be implemented without redundant evaluation.

Do not prematurely optimize at the expense of semantic correctness.

---

# 17. Build / Validation

Run:

```bash
npm run lint
npm run test
npm run build
```

All must pass.

Report:

- total test count;
- total passing;
- failures;
- lint status;
- build status.

If the repository provides additional validation commands, run those as well.

---

# 18. Visual Validation

Run the aquarium and inspect multiple fourth-dimensional slices.

At minimum inspect:

```text
w = 0
w = 10
w = 35
w = 60
w = 85
w = 100
```

Verify that the following behave coherently:

- terrain;
- geological formations;
- rocks;
- reef;
- `STRUCTURE_001`;
- flora anchors.

The visual test is not merely:

> "Does something move?"

The question is:

> "Does the scene look like different 3D sections through one coherent evolving 4D landscape?"

Look specifically for:

- rocks floating above terrain;
- rocks buried inconsistently;
- reef structures detached from their substrate;
- flora anchors disconnected from the surface;
- geological formations appearing in one representation but not another;
- discontinuities caused by temporal state mismatch.

---

# 19. Adversarial Verification

Before declaring completion, attempt to falsify the architecture.

Specifically attempt to construct cases where:

```text
time4D != requested w
```

and determine whether any returned projection state changes incorrectly.

Test:

```text
w = 0
w = 25
w = 50
w = 75
w = 100
```

while varying:

```text
time4D = 0
time4D = 17
time4D = 43
time4D = 91
```

The explicit-`w` result must depend only on `w` and the immutable/authoritative landscape definition.

If this test fails, Task 007B is not complete.

---

# 20. Documentation

Update:

```text
program_increments/v0.0.2/reports/007A_landscape_feature_integration_report.md
```

or create:

```text
program_increments/v0.0.2/reports/007B_projection_conformance_report.md
```

Preferred: create the dedicated 007B report and leave the historical 007A report intact.

The report must document:

1. problem identified;
2. root cause;
3. implementation;
4. canonical identity decision;
5. tests added;
6. test results;
7. performance results;
8. visual validation;
9. architectural implications;
10. remaining limitations.

Do not rewrite history in the 007A report.

---

# 21. Verification Gates

Evaluate these independently.

| Gate | Requirement |
|---|---|
| A | `resolveSurfaceAt(x,z,w)` exists and is explicit-time |
| B | `resolveSurface()` is only a current-time convenience wrapper |
| C | `projectSurface(x,z,w)` is completely evaluated at `w` |
| D | `projectFeature(feature,w)` is completely evaluated at `w` |
| E | Explicit-`w` results are independent of mutable `time4D` |
| F | Geological formation IDs have one canonical identity |
| G | Existing deterministic behaviour remains intact |
| H | Existing frame-rate independence remains intact |
| I | Renderer remains downstream of authoritative state |
| J | Full tests/lint/build pass |
| K | Visual slices demonstrate coherent landscape evolution |
| L | Performance regression is measured |
| M | Documentation accurately reflects implementation |
| N | Adversarial verification fails to find temporal leakage |

**Do not mark Task 007B COMPLETE unless all applicable gates pass.**

---

# 22. Definition of Done

Task 007B is complete only when the following statement is demonstrably true:

> For any valid spatial coordinate `(x,z)` and fourth-dimensional coordinate `w`, the landscape projection API returns a state determined by the authoritative 4D landscape at `(x,z,w)`, independently of the evaluator's current mutable simulation time.

And:

> A feature projected at `w` and its supporting landscape surface are evaluated at the same `w`.

And:

> The visible aquarium remains a renderer-specific projection of authoritative landscape state rather than the source of that state.

---

# 23. Final Architectural Test

The development agent must explicitly answer this question in the final report:

> **If the renderer were replaced tomorrow, could the authoritative landscape system still describe exactly which 3D landscape exists at any requested `w`?**

The expected answer after Task 007B is:

```text
YES.
```

If the answer is anything weaker, investigate before declaring completion.

---

# 24. Final Report Format

The final report must contain:

```text
1. Executive Summary
2. Previous Conformance Issue
3. Root Cause
4. Implementation Changes
5. Canonical Identity Model
6. Explicit-w Semantics
7. Tests Added
8. Existing Tests
9. Build/Lint Results
10. Performance Results
11. Visual Validation
12. Adversarial Validation
13. Verification Gates A–N
14. Known Limitations
15. Final Architectural Assessment
16. COMPLETE / NOT COMPLETE
```

Do not declare COMPLETE merely because all automated tests pass.

The implementation, tests, documentation, and architectural claims must agree.

---

# 25. Scope Discipline

This task exists to **finish Task 007A properly**.

Do not expand the scope into a new landscape architecture.

The desired outcome is:

```text
Task 007
    ↓
4D evolving terrain
    ↓
Task 007A
    ↓
4D feature integration
    ↓
Task 007B
    ↓
explicit-w projection conformance
    ↓
FINAL 007A/007B LANDSCAPE BASELINE
```

Once this baseline passes, stop.

The next task should be a new architectural increment rather than continued modification of the 007A landscape foundation.