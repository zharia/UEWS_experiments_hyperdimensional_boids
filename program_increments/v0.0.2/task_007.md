# Task 007 — Dynamic 4D Landscape Evolution, Geometry & Topology

**Location:** `program_increments/v0.0.2/task_007.md`

**Status:** Development instruction  
**Scope:** Dynamic evolving landscape / 4D geometric topology  
**Priority:** Foundational v0.0.2 feature

---

# 1. Mission

Implement a new **Dynamic 4D Landscape Evolution system** in which the aquarium landscape is not treated as a static 3D mesh that is periodically deformed.

The landscape must instead be modelled as a **time-evolving geometric structure whose visible 3D landscape is a continuously changing section through a higher-dimensional field**.

The intended perceptual result is:

> **The aquarium appears to be moving through the fourth dimension.**

The landscape should slowly, continuously and coherently evolve:

- ridges migrate;
- valleys breathe;
- structures emerge and recede;
- curvature redistributes;
- local regions stretch and contract;
- spatial relationships change;
- geological formations appear to move through the world;
- the overall environment remains recognisably continuous.

The implementation must avoid looking like:

- random vertex noise;
- procedural terrain regeneration;
- a looping animation;
- a collection of independently animated objects;
- arbitrary mesh morphing.

The system must establish a mathematically coherent foundation for future ecological coupling.

---

# 2. Core Ontology

The central model is:

\[
M^4 \supset \Sigma_t^3
\]

where:

- \(M^4\) is the evolving four-dimensional landscape;
- \(\Sigma_t^3\) is the currently observed three-dimensional aquarium landscape;
- \(t\) is the traversal/evolution coordinate.

Conceptually:

\[
L_t(x,y,z)
=
\mathcal{L}(x,y,z,w(t))
\]

where:

- \(\mathcal{L}\) is the underlying 4D landscape field;
- \(w(t)\) is the current position through the fourth dimension;
- \(L_t\) is the visible 3D landscape.

The aquarium therefore represents a **moving slice through a persistent higher-dimensional structure**, rather than a static world being animated.

This distinction is fundamental.

---

# 3. Design Principles

The implementation must follow these principles.

## 3.1 Geometry is state

The landscape is not merely rendering data.

Its geometry is part of the simulation state.

## 3.2 The renderer is a projection

The landscape evolution system owns the authoritative geometric state.

Rendering consumes a projection of that state.

## 3.3 Continuity is mandatory

Adjacent temporal states must remain geometrically related.

Avoid discontinuous regeneration.

## 3.4 Identity is not topology

A landscape feature's geometric identity must not depend on its current mesh vertex index.

Mesh representation may change without redefining the conceptual feature.

## 3.5 Topology and geometry are separate

The system must distinguish:

```text
Topology
    connectivity / adjacency / components

Geometry
    position / metric / curvature / shape

Projection
    representation in the renderer
```

Do not conflate these.

## 3.6 Evolution must be causal

The landscape changes according to an explicit evolution field or geometric law.

Do not directly animate individual vertices with unrelated timers.

---

# 4. Required Architectural Model

Implement a new subsystem conceptually equivalent to:

```text
LandscapeEvolutionSystem
```

The exact class/module structure should follow the repository's existing architecture.

It should expose an authoritative landscape state and projection.

Conceptually:

```text
                4D Landscape Field
                       │
                       ▼
               Temporal Slice
                       │
                       ▼
              Geometry Evolution
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Conformal    Quasi-Conformal  Curvature
       Component      Component      Component
          │            │            │
          └────────────┼────────────┘
                       ▼
                Evolution Field
                       │
                       ▼
                 Landscape State
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       Habitat projection    Render projection
```

Do not place the implementation inside the renderer simply because the landscape is currently visualised there.

---

# 5. 4D Landscape Representation

Implement a representation capable of describing a continuous landscape across the fourth dimension.

A suitable abstraction is:

\[
\mathcal{L}(x,y,z,w)
\]

This does **not** require allocating a dense 4D voxel grid.

The first implementation should be procedural/sparse.

Possible implementation mechanisms include:

- continuous basis functions;
- sparse deformation modes;
- implicit fields;
- signed distance-like functions;
- procedural scalar/vector fields;
- low-dimensional deformation coefficients.

Select the representation that best fits the existing project and GPU architecture.

Do not prematurely introduce a heavyweight external geometry framework.

---

# 6. Temporal Traversal

Introduce an explicit fourth-dimensional coordinate:

```text
w
```

or an equivalent semantic name.

The simulation should maintain:

```text
landscapeTime
```

separately from wall-clock time.

The landscape traversal must be:

- deterministic;
- continuous;
- controllable;
- independent of rendering frame rate.

Conceptually:

\[
w_{t+\Delta t}
=
w_t
+
v_w \Delta t
\]

where \(v_w\) is the landscape traversal velocity.

The velocity should support:

- normal progression;
- pausing;
- slowing;
- accelerating;
- reversing, if architecturally practical.

Do not implement reversal by resetting the landscape.

The underlying field must remain valid when traversed in either direction.

---

# 7. Evolution Must Not Be Simple Noise

Do **not** implement:

```text
height += noise(time)
```

as the primary mechanism.

Noise may be used as a basis field, but the resulting evolution must have spatial and temporal coherence.

Avoid:

```text
random vertex movement
per-object sine waves
independent timers
frame-dependent displacement
periodic looping deformation
```

The system should produce **geometric phenomena**, not animated noise.

---

# 8. Conformal Component

Implement a conformal component of the geometric evolution.

The local transformation should conceptually preserve angles while allowing:

- rotation;
- isotropic scale;
- coherent local expansion/contraction.

Do not claim exact global conformality if the chosen representation cannot guarantee it.

Instead, expose an explicit conformal contribution to the deformation.

Conceptually:

\[
J =
sR
\]

where:

- \(J\) is the local deformation Jacobian;
- \(s\) is local scale;
- \(R\) is local rotation.

The implementation may use an appropriate approximation if exact conformal mapping is impractical.

Document the approximation.

---

# 9. Quasi-Conformal Component

Implement a bounded distortion component.

The intended local transformation is:

\[
J =
R S
\]

where \(S\) may contain controlled anisotropic scaling.

The key requirement is:

> **distortion must be bounded and spatially coherent.**

Introduce a distortion measure.

For example:

\[
D(x,t)
\]

where:

```text
D → 0
```

approaches conformal behaviour.

Increasing `D` allows increasing anisotropic distortion.

The exact mathematical representation is implementation-dependent.

The important property is that distortion becomes a **field with a measurable magnitude**, not an arbitrary visual effect.

---

# 10. Use Quasi-Conformal Thinking Rather Than Arbitrary Deformation

Where practical, structure the deformation around concepts from quasi-conformal mapping:

- local stretch;
- local angular distortion;
- anisotropy;
- bounded distortion;
- deformation fields.

If a full Beltrami/quasi-conformal solver is excessive for the current geometry representation, implement the semantic equivalent using a controlled Jacobian/deformation-field formulation.

Document exactly which mathematical guarantees are real and which are approximations.

Do not use mathematical terminology merely as decoration.

---

# 11. Curvature Evolution

Implement curvature-aware evolution.

The landscape should possess a notion of local curvature or curvature proxy.

The evolution system should be able to identify regions such as:

```text
flat
ridge
valley
basin
saddle
peak
```

and use curvature to influence geometric evolution.

A simple initial implementation may use:

- discrete Laplacian;
- local height Hessian;
- normal variation;
- mean-curvature proxy;
- mesh curvature estimate.

The system should support a curvature-flow contribution such as:

\[
\frac{\partial X}{\partial t}
=
F(\kappa, \nabla\kappa, x,t)
\]

where appropriate.

The exact solver should be selected based on the actual landscape representation.

---

# 12. Geometric Flow Field

Do not directly manipulate landscape geometry from individual features.

Introduce a geometric evolution field.

Conceptually:

\[
\frac{dX}{dt}
=
V(X,t)
\]

where:

\[
V =
V_{4D}
+
V_{conf}
+
V_{qc}
+
V_{curvature}
\]

with optional future terms reserved for:

```text
V_ecological
V_environmental
V_physical
```

Do not implement those future terms unless required for the present feature.

The field must be composable.

This is important because later milestones will need ecological and environmental forces to modify landscape evolution without replacing the geometric foundation.

---

# 13. Deformation Modes

To keep the system efficient and controllable, support low-dimensional deformation modes.

Conceptually:

\[
D(x,t)
=
\sum_i a_i(t)\phi_i(x)
\]

where:

- \(\phi_i\) are spatial basis/deformation modes;
- \(a_i(t)\) are temporal coefficients.

Potential modes include:

```text
global breathing
ridge migration
basin expansion
basin contraction
local swelling
local sinking
shear
rotation
conformal wave
quasi-conformal wave
curvature smoothing
curvature concentration
```

Do not hard-code these as individual animation scripts.

Represent them through the common evolution-field abstraction.

---

# 14. Geometric Phenomena

The system should support travelling geometric phenomena.

For example:

```text
Conformal wave
    →
    local scale changes
    →
    landscape expands/contracts
    →
    wave passes
    →
    landscape returns to another nearby state
```

Another example:

```text
Curvature migration
    →
    ridge gradually moves
    →
    adjacent basin changes
    →
    habitat geometry changes
```

Another:

```text
Quasi-conformal pulse
    →
    bounded anisotropic distortion
    →
    spatial structure temporarily stretches
    →
    distortion dissipates
```

These must emerge from the evolution field rather than from manually animated objects.

---

# 15. Do Not Require Periodic Evolution

The system must not inherently loop.

Avoid:

```text
sin(t)
```

as the complete evolution model.

Periodic basis functions may be used as components, but the overall landscape should support:

- quasi-periodic evolution;
- non-periodic evolution;
- slowly drifting states;
- interacting deformation modes;
- seeded procedural evolution.

The goal is for the aquarium to feel as though it is **travelling through a larger world**, not watching an animation repeat.

---

# 16. Topology

Topology must be represented separately from geometry.

At minimum, the system should have explicit concepts for:

```text
nodes / regions
adjacency
connected components
boundaries
feature identity
```

The first implementation should preserve global topology during normal smooth evolution.

However, the architecture must be capable of eventually supporting topology-changing events.

Do not implement arbitrary topology mutation yet.

Instead, establish the representation boundary:

```text
Topology
    │
    ├── invariant during smooth evolution
    │
    └── future event-driven mutation
```

This makes topology a first-class concept rather than an accidental consequence of the render mesh.

---

# 17. Topological Features

Introduce persistent conceptual identities for major landscape structures.

Examples:

```text
RIDGE_001
BASIN_001
VALLEY_001
PLATEAU_001
STRUCTURE_001
```

These identities must survive geometric deformation.

A feature is therefore:

```text
Feature ID
+
topological relation
+
geometric state
```

not:

```text
mesh vertex index
```

This will be important when topology-changing phenomena are eventually introduced.

---

# 18. 4D Slice Continuity

Add explicit tests for temporal continuity.

Given:

```text
w
```

and:

```text
w + ε
```

the resulting landscape states should differ smoothly for sufficiently small ε.

Test:

\[
\|L(w+\epsilon)-L(w)\|
\]

and ensure that it remains bounded and continuous under normal operation.

Also test that:

```text
w + ε
w + 2ε
w + 3ε
```

does not exhibit unexplained discontinuities.

---

# 19. Reversibility

Where the chosen mathematical representation permits it, test:

```text
w → w + Δ
w + Δ → w
```

and determine whether the landscape returns exactly or approximately to its previous state.

If the system contains irreversible curvature-flow components, document that explicitly.

Do not falsely claim reversibility.

The distinction between:

```text
4D traversal
```

and:

```text
irreversible geometric evolution
```

must remain explicit.

---

# 20. Determinism

All procedural landscape generation must be seeded.

Equal:

```text seed
+
initial landscape
+
simulation inputs
+
temporal trajectory
```

must produce equal landscape evolution.

Do not use uncontrolled `Math.random()`.

If any stochastic component is introduced, it must use the project's seeded RNG.

---

# 21. Rendering Integration

Integrate the new landscape system into the existing aquarium renderer without making the renderer authoritative.

The rendering architecture should become conceptually:

```text
LandscapeEvolutionSystem
        │
        ▼
LandscapeProjection
        │
        ▼
AquariumScene
```

The renderer should not independently calculate landscape evolution.

The renderer may perform:

- tessellation;
- interpolation;
- GPU displacement;
- mesh generation;
- material projection;
- LOD.

But the semantic landscape state remains owned by the simulation.

---

# 22. GPU Strategy

Prefer GPU-friendly representations.

The implementation should avoid CPU-side rewriting of enormous meshes every frame.

Suitable approaches may include:

- displacement fields;
- procedural vertex evaluation;
- GPU buffers containing deformation coefficients;
- sparse deformation fields;
- compute-shader evaluation where supported;
- cached topology with dynamic geometric projection.

The choice should be based on the current project's actual rendering architecture.

Do not introduce a new rendering engine.

---

# 23. Performance Requirements

The landscape must evolve continuously without becoming the dominant frame-time consumer.

Measure:

```text
landscape update time
landscape projection time
GPU upload time
render time
memory usage
```

Do not guess.

The implementation should permit:

```text
simulation timestep
≠
render timestep
```

The landscape may evolve at a lower simulation frequency while rendering interpolates between states.

---

# 24. Environmental Integration

Integrate the landscape with the existing authoritative environment only where necessary to make the landscape observable.

At minimum, expose:

```text
landscape geometry state
landscape curvature state
landscape topology state
landscape evolution velocity
```

Do not yet make fish behaviour depend on landscape geometry unless the existing architecture naturally supports it without expanding scope.

That belongs to the subsequent ecological-validation milestone.

---

# 25. Visual Behaviour

The result should be subtle.

The landscape should appear to:

- breathe;
- shift;
- migrate;
- deform;
- reconfigure;
- reveal different spatial structures.

But it should not look like:

- earthquake animation;
- liquid mesh;
- psychedelic distortion;
- random terrain noise;
- aggressive morphing;
- a screensaver.

The intended perceptual model is:

> **The observer remains in the same aquarium while the aquarium itself appears to occupy successive neighbouring regions of a higher-dimensional world.**

---

# 26. Interaction With Existing 4D Boids

Do not modify the existing 4D boid ontology unnecessarily.

However, preserve the conceptual distinction:

```text
Boid 4D state
        ≠
Landscape 4D state
```

They are two distinct manifestations of the project's fourth-dimensional model.

The long-term architecture may allow them to interact through a shared world coordinate system.

This task establishes the landscape side only.

---

# 27. Suggested Data Model

Develop an implementation-appropriate equivalent of:

```ts
interface LandscapeState {
    time4D: number;

    topology: LandscapeTopology;

    geometry: LandscapeGeometry;

    evolution: LandscapeEvolutionState;

    curvature: CurvatureField;

    distortion: DistortionField;

    features: LandscapeFeature[];
}
```

and:

```ts
interface LandscapeEvolutionState {
    traversalVelocity: number;

    conformalStrength: number;

    quasiConformalStrength: number;

    curvatureStrength: number;

    modes: DeformationMode[];
}
```

Do not copy this structure blindly.

Adapt it to the repository's actual architecture.

---

# 28. Diagnostics

Expose sufficient diagnostic information to answer:

```text
What is the current 4D coordinate?
What is the landscape traversal velocity?
How much conformal deformation is active?
How much quasi-conformal distortion is active?
What is the curvature-flow magnitude?
What is the maximum local distortion?
Has topology changed?
How much geometric displacement occurred?
```

This can initially be debug telemetry rather than polished UI.

---

# 29. Tests

Create:

```text
tests/task_007_landscape_evolution.test.ts
```

At minimum test:

### 29.1 Determinism

Same seed → same landscape evolution.

### 29.2 Temporal continuity

Small Δw → small geometric change.

### 29.3 Conformal behaviour

Validate the selected conformal approximation.

If exact mathematical conformality is not guaranteed, test the documented approximation metric.

### 29.4 Quasi-conformal bounded distortion

Verify that local distortion remains within configured limits.

### 29.5 Curvature evolution

Verify that the curvature component modifies the geometry according to its defined rule.

### 29.6 Feature identity

Feature IDs survive geometric evolution.

### 29.7 Topological invariance

Smooth geometric evolution does not unexpectedly alter connectivity.

### 29.8 Traversal

Advancing the 4D coordinate produces a corresponding landscape change.

### 29.9 Reverse traversal

If supported, reversing traversal returns to the corresponding prior geometry.

### 29.10 No frame-rate dependence

Different render/update frequencies produce equivalent simulated landscape states.

---

# 30. Adversarial Tests

Do not only test nominal operation.

Test:

```text
very small Δw
large Δw
zero traversal velocity
negative traversal velocity
high distortion
zero distortion
multiple simultaneous deformation modes
long simulation intervals
population-independent execution
different render frequencies
same seed / different seed
```

Look specifically for:

- discontinuities;
- exploding deformation;
- topology corruption;
- NaN/Infinity;
- accumulated numerical drift;
- frame-rate dependence;
- unbounded distortion.

---

# 31. Runtime Validation

Run the actual aquarium.

Observe the landscape for a sufficiently long period.

Verify that it:

- visibly evolves;
- remains coherent;
- does not obviously loop;
- does not exhibit discontinuous popping;
- does not detach visual structures from the landscape;
- maintains stable rendering performance;
- continues evolving when the observer is absent;
- remains deterministic under equivalent simulation conditions.

Capture representative evidence if the repository's development-report conventions support it.

---

# 32. Documentation

Create:

```text
program_increments/v0.0.2/reports/007_landscape_evolution_report.md
```

Document:

## 32.1 Mathematical model

Explain:

\[
M^4
\supset
\Sigma_t^3
\]

and how the implementation approximates it.

## 32.2 Geometry model

Explain:

- representation;
- deformation;
- curvature;
- conformal component;
- quasi-conformal component.

## 32.3 Topology model

Explain:

- feature identity;
- adjacency;
- connectivity;
- topology invariants.

## 32.4 Temporal model

Explain the fourth-dimensional traversal coordinate.

## 32.5 Rendering model

Explain how authoritative landscape state becomes a visual projection.

## 32.6 Performance

Provide actual measurements.

## 32.7 Tests

Provide exact test counts and results.

## 32.8 Mathematical limitations

Explicitly document where the implementation is:

- exact;
- approximate;
- heuristic;
- procedural.

Do not overclaim mathematical guarantees.

---

# 33. Anti-Requirements

Do NOT:

- add OpenVDB merely because it is available elsewhere in the user's broader architecture;
- add USD;
- add H3;
- replace Ogre;
- introduce a new renderer;
- introduce a physics engine;
- introduce a general-purpose mesh deformation library without justification;
- implement topology mutation merely for visual spectacle;
- add geological simulation;
- add erosion simulation;
- add plate tectonics;
- add procedural terrain regeneration;
- add new fish behaviour;
- add ecological coupling;
- add lifecycle systems;
- add persistence;
- add multiplayer;
- use uncontrolled randomness;
- make the renderer authoritative;
- use array indices as landscape feature identity;
- create a repeating animation disguised as 4D evolution.

---

# 34. Required Engineering Judgement

The development agent must first inspect the existing repository and determine:

1. the current substrate/landscape representation;
2. how substrate geometry is generated;
3. how landscape/environment state currently reaches the renderer;
4. what portions are CPU versus GPU;
5. what geometry representation can support the proposed evolution;
6. whether the current substrate is best represented as:
   - explicit mesh,
   - scalar field,
   - height field,
   - implicit surface,
   - hybrid;
7. which conformal/quasi-conformal approximation is mathematically defensible for that representation.

Do not blindly implement the suggested data structures.

Choose the representation that best preserves the **semantic objective**.

---

# 35. Preferred Innovation

The implementation should favour this hierarchy:

```text
                 4D LANDSCAPE
                       │
                       ▼
              implicit / sparse field
                       │
                       ▼
              temporal cross-section
                       │
                       ▼
              geometric evolution
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      conformal    quasi-conf.   curvature
          │            │            │
          └────────────┼────────────┘
                       ▼
                 geometry state
                       │
                       ▼
              topology-preserving
                  projection
                       │
                       ▼
                 aquarium view
```

The renderer should therefore **sample the world**, not animate the world.

---

# 36. Definition of Done

Task 007 is complete only when:

- [ ] a distinct landscape evolution subsystem exists;
- [ ] landscape evolution is represented independently of rendering;
- [ ] an explicit fourth-dimensional traversal coordinate exists;
- [ ] the visible landscape is derived from the evolving 4D representation;
- [ ] evolution is continuous;
- [ ] conformal behaviour is represented;
- [ ] quasi-conformal/bounded-distortion behaviour is represented;
- [ ] curvature contributes to evolution;
- [ ] a geometric flow field exists;
- [ ] deformation is spatially coherent;
- [ ] evolution does not depend on frame rate;
- [ ] landscape feature identity is independent of mesh indices;
- [ ] topology is explicitly represented;
- [ ] smooth evolution preserves topology;
- [ ] topology is architecturally capable of future controlled mutation;
- [ ] deterministic seeded evolution works;
- [ ] reverse traversal is either supported or its impossibility/irreversibility is documented;
- [ ] renderer consumes landscape projection rather than owning landscape evolution;
- [ ] GPU/CPU performance has been measured;
- [ ] runtime visual validation has been performed;
- [ ] adversarial tests pass;
- [ ] no uncontrolled randomness exists in landscape evolution;
- [ ] no prohibited new major subsystem has been introduced;
- [ ] `007_landscape_evolution_report.md` exists.

---

# 37. Final Architectural Principle

The implementation must preserve this distinction:

```text
WRONG

mesh
  ↓
animate vertices
  ↓
pretty landscape
```

versus:

```text
CORRECT

4D world
  ↓
geometric evolution
  ↓
3D temporal section
  ↓
landscape state
  ↓
rendering
```

The aquarium is not an animated model.

**The aquarium is an observation of a world that extends through another dimension.**

The visual evolution is the consequence of moving through that world.

Conformal and quasi-conformal geometry are constraints on how neighbouring observations relate; curvature provides another mechanism for coherent geometric evolution; topology provides the persistent structural identity beneath the changing geometry.

The implementation should make this distinction real in the architecture, not merely describe it in documentation.