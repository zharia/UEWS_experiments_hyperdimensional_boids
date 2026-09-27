# Task 005 — Morphological Expression & Individual Boid Identity

**Path:** `program_increments/v0.0.1/task_005.md`

## 1. Mission

Upgrade the visual representation of the existing boid population so that individual boids exhibit substantially greater **morphological diversity, expressive movement, temporal continuity, and recognisable individual signatures**, without turning the boids into conventional fish.

The objective is not anatomical realism.

The objective is:

> **fishiness without fish; organismic expression without anatomical simulation.**

The boids must continue to express the essence of:

* flocking;
* fluid locomotion;
* collective motion;
* individuality;
* biological-looking movement;
* materiality;
* responsiveness;
* temporal continuity;
* and computational emergence,

without requiring eyes, scales, fins, mouths, gills, realistic fish bodies, species-specific anatomy, or conventional fish meshes.

The existing gently shifting colour phases are to be retained and integrated with the new morphological system.

The principal defect to address is **shape repetition and predictability**.

The current visual system must cease treating a boid as a fixed geometric object that is merely translated, rotated, scaled, and colour-shifted.

Instead:

```text
boid identity
        +
morphological signature
        +
current behavioural state
        +
locomotion
        +
environmental conditions
        +
temporal history
        ↓
current morphological expression
        ↓
rendered boid
```

The result should be a population in which no two individuals feel mechanically identical, while the population remains visually coherent.

---

# 2. Architectural Principle

The implementation MUST preserve the following distinction:

```text
Morphology ≠ Posture ≠ Behaviour ≠ Animation
```

### Morphology

Characteristics describing the individual's general form.

Examples:

* aspect;
* taper;
* mass distribution;
* body depth;
* curvature tendency;
* flexibility;
* posterior expression;
* surface complexity;
* asymmetry;
* translucency/material tendency.

### Posture

The individual's current physical configuration.

Examples:

* bending;
* compression;
* elongation;
* twisting;
* lateral deformation;
* propulsion expression;
* turning posture.

### Behaviour

The current behavioural state already established by the simulation.

Examples:

* wander;
* school;
* follow;
* avoid;
* flee;
* feed;
* rest;
* investigate;
* approach;
* socialise;
* defend;
* explore.

### Animation

Must NOT become the authoritative representation of behaviour.

Animation is an output mechanism for expressing simulated state.

The existing architectural rule remains:

> **Behaviour is not animation.**

Extend this to:

> **Morphology is not animation.**

---

# 3. Primary Objective

Replace the current overly repetitive boid geometry with a **procedural morphological grammar** capable of producing a continuous family of related forms.

The system must produce variation at multiple timescales:

```text
individual identity       → stable during execution
morphological signature   → slowly varying
colour phase              → slowly varying
posture                   → continuously varying
locomotion deformation    → rapidly varying
micro-expression          → rapidly varying
```

The boid therefore has both:

1. **individual visual character**, and
2. **moment-to-moment physical expression**.

A boid should remain visually distinguishable while its instantaneous silhouette changes.

---

# 4. Non-Goals

This task MUST NOT:

* turn the boids into realistic fish;
* introduce conventional fish anatomy;
* add eyes;
* add scales;
* add realistic mouths;
* implement species-specific fish meshes;
* create a catalogue of fish models;
* create dozens of hand-authored meshes;
* replace the existing simulation;
* replace the existing behavioural system;
* introduce scripted character animation;
* create predetermined animation loops;
* make every boid perform random visual tricks;
* add cartoon facial expressions;
* introduce ML;
* introduce OpenVDB;
* introduce H3;
* introduce USD;
* introduce GPU simulation;
* introduce SCR integration;
* redesign the aquarium renderer wholesale;
* make morphology directly determine behaviour;
* allow visual state to become authoritative simulation state.

Persistence and restart semantics are explicitly **out of scope for this task**.

Do not introduce new persistence mechanisms for morphology.

Do not alter the existing ecological persistence architecture.

Where the implementation requires stable per-execution individual parameters, use the existing identity and deterministic-seeding mechanisms already present in the repository.

---

# 5. Required Preliminary Investigation

Before modifying implementation, inspect the repository comprehensively.

Determine:

1. Current boid representation.
2. Current mesh/geometry generation.
3. Current rendering path.
4. Current transform pipeline.
5. Current colour-phase implementation.
6. Current individual identity representation.
7. Current deterministic/random seed mechanisms.
8. Current behavioural state representation.
9. Current velocity/acceleration/turning data.
10. Current flock/cohesion metrics.
11. Current environmental state available to boids.
12. Current observer model.
13. Existing test infrastructure.
14. Existing instrumentation/debug facilities.
15. Any assumptions that boids are rigid geometric objects.
16. Any existing visual interpolation or smoothing.
17. Whether geometry is regenerated per frame or transformed from persistent geometry.

Read the existing documentation and previous implementation reports before designing the change.

Do not assume the current architecture from this prompt if the repository contradicts it.

---

# 6. Morphological Identity

Every boid MUST possess a deterministic morphological signature during execution.

This signature should be associated with the boid's identity rather than regenerated arbitrarily.

Conceptually:

```text
BoidIdentity
    ↓
MorphologicalSignature
```

A conceptual signature may contain:

```text
aspect
taper
body_depth
mass_distribution
curvature
flexibility
posterior_expression
surface_complexity
symmetry_bias
lateral_bias
translucency
material_variation
```

The exact representation is an implementation decision.

Do not blindly implement this exact list if the existing architecture suggests a better abstraction.

The important invariant is:

> An individual should retain a coherent morphological character throughout its current execution rather than randomly becoming a different organism from frame to frame.

This does **not** require morphology to be persisted between application runs.

---

# 7. Morphological Grammar

Implement a continuous procedural grammar rather than discrete shape variants.

The grammar should support transformations such as:

```text
elongate
compress
bend
curve
twist
shear
flare
contract
stretch
pulse
oscillate
taper
expand
asymmetrically deform
```

These are **morphological primitives**, not animations.

They should be composable.

For example:

```text
base morphology
    ↓
elongation
    ↓
curvature
    ↓
lateral deformation
    ↓
posterior expression
    ↓
current posture
```

The resulting geometry must remain within controlled bounds.

The system must avoid pathological geometry, self-intersection, explosive deformation, or visually broken forms.

---

# 8. Individual Morphological Signatures

Morphological dimensions MUST NOT be independently randomised without correlation.

The system should generate coherent individuals.

For example, an individual may naturally tend towards:

```text
elongated
low-depth
high-flexibility
subtle posterior expression
slight leftward bias
```

while another may tend towards:

```text
compact
deep
moderate-flexibility
strong curvature
slight rightward bias
```

These are examples only.

The implementation should establish meaningful correlations between morphological parameters.

The result should be:

> different individuals, rather than randomly distorted copies.

---

# 9. Controlled Asymmetry

Introduce subtle stable asymmetry during execution.

Examples include:

* slight lateral curvature bias;
* left/right deformation bias;
* posterior offset;
* uneven surface expression;
* slight preferred turning geometry.

Asymmetry MUST remain bounded.

It should generally be perceptually subtle.

The goal is not malformed geometry.

The goal is to eliminate the visual signature of perfect procedural symmetry.

Required invariant:

```text
asymmetry != uncontrolled noise
```

Instead:

```text
individual bias
        +
current posture
        =
coherent asymmetry
```

---

# 10. Posture System

Implement a distinct posture layer between simulation state and geometry.

Conceptually:

```text
simulation state
      ↓
behavioural/locomotion interpretation
      ↓
target posture
      ↓
posture dynamics / hysteresis
      ↓
current posture
      ↓
geometry
```

Posture MUST NOT change instantaneously in response to every frame-level velocity change.

Use smoothing, relaxation, inertia, or equivalent temporal mechanisms.

The boid should possess a visual equivalent of physical continuity.

For example:

* hard turn → body gradually curves;
* acceleration → body compresses/changes tension;
* braking → posture relaxes;
* resumed cruising → body returns gradually;
* sudden disturbance → transient deformation followed by recovery.

---

# 11. Morphological Hysteresis

Morphological expression should exhibit temporal hysteresis.

Conceptually:

```text
target_posture(t)
       ↓
       α
       ↓
current_posture(t+dt)
```

Equivalent implementation mechanisms are acceptable.

The principle is:

> The current form should depend partially upon the immediately preceding form.

This must prevent:

* frame-to-frame shape jitter;
* instantaneous silhouette switching;
* procedural flickering;
* arbitrary deformation;
* mechanical-looking interpolation.

---

# 12. Behaviour-to-Morphology Coupling

Behaviour may influence morphology, but MUST NOT directly select an animation.

Use behavioural state as an input into morphological expression.

For example:

```text
CRUISE
    → elongated / relaxed

ACCELERATION
    → increased compression / posterior expression

TURNING
    → curvature / lateral deformation

FLEE
    → increased deformation amplitude

REST
    → reduced propulsion expression

INVESTIGATION
    → reduced forward propulsion / altered posture
```

These are tendencies, not mandatory mappings.

The system should allow morphology and behaviour to remain partially independent.

A long, rigid individual may respond differently from a compact, flexible individual to the same behavioural state.

This creates character without scripting characters.

---

# 13. Morphology Must Influence Expression, Not Define Behaviour

Do NOT implement:

```text
if morphology == X:
    behaviour = Y
```

Instead, allow:

```text
morphology
    ↓
physical expression tendency
```

and:

```text
behaviour
    ↓
postural demand
```

which combine:

```text
morphological tendency
+
behavioural demand
+
environmental condition
+
temporal history
        ↓
current expression
```

Morphology should therefore influence **how** an individual expresses a behaviour, not **which behaviour it must perform**.

---

# 14. Locomotion Coupling

The geometry must visibly respond to locomotion.

At minimum investigate coupling between:

* velocity;
* acceleration;
* angular velocity;
* curvature of trajectory;
* turning intensity;
* local flock density;
* environmental flow/current;
* behavioural state.

Do not simply rotate a rigid object along its velocity vector.

The goal is for movement and form to become one coherent perceptual phenomenon.

A turning boid should *look as though it is turning*, not merely point in a new direction.

---

# 15. Posterior Expression

Avoid implementing a conventional fish tail.

Instead, create a configurable **posterior locomotion expression**.

It may manifest as:

* taper;
* curvature;
* oscillation;
* elongation;
* lateral displacement;
* filamentary extension;
* soft geometric termination;
* transient posterior deformation.

The observer should sometimes perceive something vaguely tail-like without the system explicitly modelling a fish tail.

This is an important aesthetic constraint.

---

# 16. Surface Expression

Investigate whether the base geometry can exhibit subtle surface deformation.

Possible expressions:

* longitudinal tension;
* lateral rippling;
* small-scale deformation;
* translucent edge variation;
* local broadening;
* surface undulation.

These MUST remain subordinate to the overall silhouette.

Do not turn every boid into a visibly writhing object.

The desired effect is:

> "It is moving through water."

not:

> "This mesh has an animation shader."

---

# 17. Colour-Phase Integration

Retain the existing gently shifting colour-phase system.

Do not replace it.

Instead integrate colour and morphology through shared temporal identity.

Conceptually:

```text
individual identity
       ├───────────────┐
       ↓               ↓
colour phase      morphology signature
       ↓               ↓
slow expression dynamics
       └───────┬───────┘
               ↓
        current individual
```

Colour MUST NOT become tightly synchronised across the entire population merely because morphology is being improved.

Population-level coherence should remain emergent.

---

# 18. Flock-Level Morphological Expression

Investigate whether flock state can influence the *degree* of morphological expression.

Potential flock-derived inputs:

* local density;
* alignment;
* cohesion;
* velocity variance;
* directional coherence;
* disturbance;
* fragmentation.

Possible manifestations:

### High coherence

* slightly streamlined posture;
* reduced deformation;
* reduced orientation variance;
* subtle collective visual coherence.

### Fragmentation

* increased individual divergence;
* greater posture variance;
* increased curvature;
* desynchronised expression.

### Disturbance

* transient deformation;
* increased orientation variance;
* temporary loss of morphological synchrony.

These effects MUST be subtle.

Do not make flock state produce an obvious "mode switch."

---

# 19. Environmental Coupling

Morphological expression may respond to the environmental field already implemented in Task 003.

Potential inputs include:

* current;
* turbulence;
* local disturbance;
* habitat;
* depth;
* illumination;
* density;
* nearby structures.

Environmental influence MUST be indirect and physically/plausibly expressed.

For example:

```text
current
    ↓
boid locomotion
    ↓
posture
```

rather than:

```text
current == X
    ↓
play animation Y
```

The environment must remain causal.

---

# 20. Individual Recognition

The implementation should support the possibility that an observer can subconsciously distinguish individuals.

This does NOT require:

* labels;
* names;
* UI markers;
* artificial identifiers;
* explicit recognition algorithms.

It should emerge from combinations of:

* morphology;
* colour phase;
* movement tendencies;
* asymmetry;
* posture response.

A boid should have a visual "signature" during an execution.

---

# 21. No Fixed Animation Loops

Explicitly prohibit conventional looping animations such as:

```text
swim_cycle_01
swim_cycle_02
swim_cycle_03
```

unless such mechanisms are used internally as low-level mathematical primitives and are subordinate to simulation state.

No boid should repeatedly execute a visibly identical cycle independent of context.

Motion must emerge from:

```text
state
+
velocity
+
acceleration
+
behaviour
+
morphology
+
environment
+
history
```

---

# 22. Controlled Stochasticity

Where stochasticity is useful, it MUST be:

* seeded;
* deterministic;
* bounded;
* temporally coherent;
* correlated with individual identity;
* independent of frame rate.

Avoid white-noise deformation.

Do not randomly regenerate geometry every frame.

Randomness should produce **individual variation**, not visual noise.

---

# 23. Multi-Timescale Expression

Implement separate temporal scales where appropriate.

### Stable during execution

* individual morphological signature;
* asymmetry bias.

### Slow

* colour phase;
* gradual morphological drift;
* material variation.

### Medium

* posture;
* locomotion expression;
* environmental adaptation.

### Fast

* turning deformation;
* propulsion;
* transient perturbation;
* local surface response.

This hierarchy is essential.

---

# 24. Geometry Strategy

Investigate at least the following implementation strategies before selecting the final mechanism:

1. Procedural mesh deformation.
2. Parametric surface generation.
3. Low-resolution deformable volume.
4. Vertex-space deformation.
5. Skeletal-like internal representation without conventional character animation.
6. Hybrid geometry/material deformation.

Choose based upon:

* existing renderer;
* performance;
* visual quality;
* implementation complexity;
* deterministic behaviour;
* future extensibility.

Do not introduce unnecessary dependencies.

Document the decision.

---

# 25. Performance Requirements

The system must remain viable for the intended population size.

Measure:

* CPU cost per boid;
* geometry generation cost;
* GPU cost where measurable;
* memory;
* frame-time impact;
* scaling with population size.

Prefer:

* shared topology;
* parameterised deformation;
* cached geometry where appropriate;
* efficient instance data;
* GPU-side deformation only if it genuinely improves the architecture and remains appropriate to the current renderer.

Do not prematurely optimise away morphological richness.

---

# 26. Debug Instrumentation

Add optional debug instrumentation capable of exposing:

```text
boid identity
morphological signature
current posture
posture target
morphology parameters
asymmetry
behaviour
velocity
acceleration
flock metrics
environmental inputs
colour phase
```

Where practical, provide a way to select or inspect an individual boid.

The debugging representation must help determine whether visual differences originate from:

* identity;
* morphology;
* behaviour;
* locomotion;
* environment;
* rendering.

---

# 27. Testing

Add automated tests for the mathematical and architectural portions of the subsystem.

At minimum test:

### Identity association

A boid retains its morphological signature during execution.

### Determinism

Same seed + same state → same morphology.

### Boundedness

Morphological parameters remain within valid limits.

### Continuity

Morphology/posture does not exhibit unacceptable discontinuities.

### Hysteresis

Current posture depends upon previous state.

### Behaviour separation

Morphology does not directly select behaviour.

### Colour preservation

Existing colour-phase behaviour remains functional.

### Population diversity

A sufficiently large seeded population produces meaningful morphological variance.

### Individual distinction

Multiple individuals exhibit distinguishable signatures.

### No frame randomness

Repeated evaluation under identical state does not produce arbitrary frame-level geometry changes.

### Environmental causality

Environmental input can influence expression without becoming an animation trigger.

---

# 28. Required Qualitative Evaluation

The development agent MUST visually inspect the result.

Evaluate at least:

### Test A — Identical initial conditions

Does the population still look like copies?

### Test B — Long observation

Do individuals begin to feel recognisably distinct?

### Test C — Turning

Does the body visibly participate in turning?

### Test D — Acceleration

Does morphology respond to acceleration?

### Test E — Flock cohesion

Does collective movement create subtle collective expression?

### Test F — Flock disturbance

Does the population become more heterogeneous without becoming chaotic?

### Test G — Colour

Do colour phases continue to evolve naturally?

### Test H — Static frame

Does the population still contain visual diversity when paused?

### Test I — Non-fish test

Ask:

> Does this look like a collection of fish?

If the answer is strongly yes, reduce anatomical specificity.

The target is:

> **recognisably aquatic and organismic, but taxonomically ambiguous.**

---

# 29. Anti-Requirements

The following outcomes constitute failure:

* all boids have essentially the same silhouette;
* variation consists primarily of scale;
* variation consists primarily of colour;
* geometry randomly jitters;
* every boid has a visible "tail";
* boids acquire obvious fish anatomy;
* deformation is purely cosmetic and unrelated to movement;
* morphology changes instantly;
* individuals change visual identity arbitrarily during execution;
* morphology determines behaviour;
* flock state becomes a visual mode switch;
* all individuals synchronise their deformation;
* animation loops become visible;
* random deformation produces visual noise;
* the system becomes expensive enough to compromise the aquarium;
* visual expression becomes more conspicuous than the ecology itself.

---

# 30. Desired Perceptual Outcome

The final population should evoke something like:

> A population of small aquatic organisms whose bodies are continuously negotiating movement, fluid, proximity, and one another.

An observer should see:

* individuals;
* collective motion;
* different physical "characters";
* subtle shape evolution;
* changing silhouettes;
* coherent locomotion;
* colour evolution;
* occasional unusual individuals;
* collective transitions.

But the observer should NOT be able to reduce the population to:

> "These are fish."

That ambiguity is intentional.

---

# 31. Architectural Integration

The final architecture should conceptually become:

```text
                    WORLD
                      │
             ┌────────┴────────┐
             │                 │
         ECOLOGY          ENVIRONMENT
             │                 │
             └────────┬────────┘
                      │
                  AGENT STATE
                      │
           ┌──────────┼──────────┐
           ↓          ↓          ↓
       BEHAVIOUR  MORPHOLOGY  LOCOMOTION
           │          │          │
           └──────────┼──────────┘
                      ↓
                POSTURE DYNAMICS
                      ↓
             MORPHOLOGICAL GRAMMAR
                      ↓
               CURRENT BOID FORM
                      │
                 VISUAL FIELD
                      │
                  RENDERER
```

The acoustic architecture established by Task 004 remains downstream of simulation state and MUST NOT be coupled directly to mesh implementation.

---

# 32. Recommended Implementation Sequence

The development agent should implement incrementally.

Suggested sequence:

```text
005.001 — Repository and renderer audit
005.002 — Current boid representation analysis
005.003 — Morphological signature model
005.004 — Per-execution individual morphology
005.005 — Procedural morphological grammar
005.006 — Controlled asymmetry
005.007 — Posture representation
005.008 — Posture dynamics and hysteresis
005.009 — Locomotion coupling
005.010 — Behavioural expression coupling
005.011 — Posterior locomotion expression
005.012 — Surface deformation
005.013 — Colour-phase integration
005.014 — Flock-level expression
005.015 — Environmental coupling
005.016 — Deterministic stochastic variation
005.017 — Debug instrumentation
005.018 — Automated tests
005.019 — Qualitative visual evaluation
005.020 — Performance evaluation
005.021 — Documentation
005.022 — Final conformance review
```

The agent may modify this sequence where repository evidence warrants doing so.

---

# 33. Demonstration Scenario

Create a deterministic demonstration containing a sufficiently large population to make morphological diversity observable.

Demonstrate:

```text
population enters view
        ↓
individual silhouettes differ
        ↓
colour phases evolve
        ↓
boids cruise
        ↓
flock forms
        ↓
collective coherence increases
        ↓
individual morphology remains distinguishable
        ↓
flock turns
        ↓
individual bodies deform differently
        ↓
disturbance occurs
        ↓
flock fragments
        ↓
morphological diversity becomes more apparent
        ↓
flock reforms
        ↓
individual visual signatures remain coherent
```

The demonstration MUST NOT rely upon scripted choreography.

Use actual simulation behaviour and deterministic seeded conditions.

---

# 34. Execution-Only Evaluation

Evaluate the morphology system over a sufficiently long execution period to expose:

* repeated movement;
* flock formation;
* fragmentation;
* environmental variation;
* colour evolution;
* individual variation;
* morphological expression.

Verify that the system does not converge visually into identical shapes.

Also verify that it does not drift into increasingly exaggerated or malformed geometry.

No persistence or restart testing is required for this task.

---

# 35. Documentation Requirements

Update the relevant documentation to explain:

1. Morphological identity.
2. Morphological signature.
3. Morphological grammar.
4. Posture.
5. Morphological hysteresis.
6. Controlled asymmetry.
7. Behaviour-to-morphology coupling.
8. Locomotion coupling.
9. Flock-level expression.
10. Environmental coupling.
11. Colour integration.
12. Deterministic variation.
13. Rendering boundary.
14. Performance considerations.
15. Known limitations.

Document the conceptual distinction:

> **The boid is an organismic computational entity whose geometry is an instantaneous expression of state, not its identity.**

---

# 36. Completion Criteria

Task 005 is complete only when all of the following are true:

* [ ] Existing boid architecture has been inspected.
* [ ] Individual morphological signatures exist.
* [ ] Morphology is parameterised rather than represented solely by fixed meshes.
* [ ] Multiple morphological dimensions are supported.
* [ ] Individual variation is coherent rather than independently random.
* [ ] Controlled asymmetry exists.
* [ ] Posture is distinct from morphology.
* [ ] Posture responds to locomotion.
* [ ] Posture has temporal continuity/hysteresis.
* [ ] Behaviour influences expression without becoming animation.
* [ ] Flock state can subtly influence expression.
* [ ] Environmental state can influence expression.
* [ ] Existing colour-phase behaviour remains intact.
* [ ] Individual visual signatures remain distinguishable during execution.
* [ ] No conventional fish anatomy is required.
* [ ] No fixed animation loops define movement.
* [ ] Randomness is deterministic and bounded.
* [ ] Geometry remains stable and valid.
* [ ] Performance remains acceptable.
* [ ] Debug instrumentation exists.
* [ ] Automated tests pass.
* [ ] Qualitative visual evaluation has been performed.
* [ ] Long-duration execution evaluation has been performed.
* [ ] Documentation has been updated.
* [ ] No existing ecological, behavioural, environmental, acoustic, or observer invariants have been violated.
* [ ] No new persistence mechanism has been introduced.

---

# 37. Required Final Implementation Report

Create a complete implementation report describing:

### 1. Executive Summary

What changed and why.

### 2. Existing Architecture

What the repository contained before implementation.

### 3. Morphological Model

Exact representation implemented.

### 4. Morphological Grammar

Available deformation primitives and composition.

### 5. Individual Identity

How per-execution morphological identity is generated and associated with boids.

### 6. Posture

How current shape differs from the individual's morphological signature.

### 7. Hysteresis

How temporal continuity is achieved.

### 8. Behaviour Integration

How behaviours influence expression.

### 9. Locomotion Integration

How velocity, acceleration and turning influence form.

### 10. Environmental Integration

How environmental state influences expression.

### 11. Flock Integration

How collective state affects morphology.

### 12. Colour Integration

How colour phases remain compatible.

### 13. Determinism

How reproducibility is guaranteed.

### 14. Performance

Measured costs and population scaling.

### 15. Testing

Tests added and results.

### 16. Qualitative Evaluation

Results of the visual experiments.

### 17. Anti-Requirement Review

Explicitly demonstrate that the system has not drifted into fish simulation or scripted animation.

### 18. Known Limitations

Be explicit.

### 19. Future Work

Only identify work justified by evidence from this implementation.

### 20. Final Conformance Statement

State whether every completion criterion was satisfied.

Do not claim completion for an item that was not actually implemented or tested.

---

# 38. Final Design Principle

The implementation should preserve the following principle above all others:

> **Do not model a fish. Model the visual consequences of an organism moving through water, belonging to a population, and possessing its own character.**

The boid should therefore be neither:

```text
a fish
```

nor merely:

```text
a triangle with a velocity vector.
```

It should occupy the interesting territory between the two:

```text
                 ORGANISMIC EXPRESSION
                         ▲
                         │
              fishiness  │
                         │
                         │
      BOID ──────────────┼────────────── FISH
                         │
                         │
                         │
                         ▼
                  ABSTRACT GEOMETRY
```

The desired result is a computational creature whose **shape is alive because its state is alive**.
