# Task 006 — Consolidation & Completion

**Location:** `program_increments/v0.0.1/task_006.md`

**Program Increment:** `v0.0.1`
**Task:** `006`
**Type:** Consolidation / Completion
**Depends on:** Tasks 003, 004, 005

---

# 1. Mission

Consolidate the work completed in Tasks 003–005 by completing incomplete functionality, correcting identified implementation gaps, and ensuring that the major systems operate together coherently.

This is a **completion milestone, not a feature-expansion milestone**.

Do not introduce another major subsystem.

Do not redesign working systems.

Do not expand the specification unnecessarily.

The objective is to take the systems that now exist and make them **complete enough, connected enough, and stable enough to form the foundation for the next development increment.**

The guiding principle is:

> **Finish the world we have before adding another world.**

---

# 2. Systems in Scope

Task 006 is concerned primarily with these existing systems:

```text
Ecology
Environment
Antics
Morphology
Posture
Boid simulation
Visual manifestation
Acoustic manifestation
Observer/time behaviour
Deterministic execution
```

The developer must inspect the current implementation of each and identify functionality that was specified in Tasks 003–005 but remains incomplete, disconnected, or only partially implemented.

---

# 3. Preliminary Work

Before modifying code:

1. Read Tasks 003, 004 and 005.
2. Inspect their implementation in the current repository.
3. Identify incomplete or placeholder functionality.
4. Identify concrete defects already apparent from the implementation.
5. Implement only the corrections necessary to complete those systems.

Do not perform a broad architectural rewrite.

Do not create speculative infrastructure.

The current repository is authoritative where implementation has legitimately evolved beyond the original task specification.

---

# 4. Priority 1 — Complete Existing Functionality

The first priority is to find functionality which is already represented in the architecture or code but is incomplete.

Look specifically for:

* TODOs;
* placeholder implementations;
* unused fields which are intended to participate in existing functionality;
* interfaces which are defined but not connected;
* systems instantiated but not meaningfully used;
* state calculated but not consumed;
* state consumed without a proper source;
* visual/audio projections which do not reflect the underlying simulation;
* partially implemented tests;
* documented functionality which is absent from the implementation.

Complete these where the intended behaviour is already clear.

Do not expand the scope to functionality that was never part of Tasks 003–005.

---

# 5. Priority 2 — Complete Morphological Integration

Task 005 introduced the morphological expression system.

Consolidate it rather than extending it.

Ensure that:

```text
Organism identity
      ↓
Morphological signature
      ↓
Posture
      ↓
Morphological grammar
      ↓
Rendered expression
```

works reliably.

### Required corrections

#### 5.1 Execution-local identity

Morphological signatures must belong to an organism, not merely to its current array position.

Use the existing organism identity where available.

If no suitable identity exists, introduce the smallest execution-local identity required.

Do **not** introduce persistence.

#### 5.2 Deterministic morphology

Remove uncontrolled randomness from morphology/posture initialisation.

In particular, morphology-related use of:

```text
Math.random()
```

must not determine the result where deterministic execution is expected.

Use the existing seeded/deterministic mechanism.

#### 5.3 Morphology parameters

Verify that parameters represented by the morphological signature actually affect expression.

Remove genuinely unused parameters rather than retaining decorative abstractions.

#### 5.4 Preserve separation

Do not collapse:

```text
Morphology
Posture
Behaviour
Animation
```

into a single visual system.

---

# 6. Priority 3 — Complete Ecological ↔ Boid Integration

This is the most important incomplete architectural relationship discovered during review.

The repository currently contains both:

```text
EcologicalAgent
```

and:

```text
Boid4D
```

Determine their intended relationship from the existing implementation.

Do not rewrite either system.

The objective is to ensure that the systems are not accidentally operating as two unrelated representations of the aquarium.

Where they are intended to represent the same organism, establish the minimum required mapping.

Where they intentionally remain separate, document the relationship clearly.

The result must be understandable in code:

```text
ecological state
       ↓
behavioural state
       ↓
physical/boid expression
       ↓
visual manifestation
```

Do not turn behaviour into animation clips.

Do not replace the existing boid locomotion system.

---

# 7. Priority 4 — Complete Environmental Integration

Verify that the environmental system introduced in Task 003 actually influences the visible aquarium.

At minimum confirm meaningful integration of:

* water/current;
* illumination;
* turbidity/clarity;
* particles;
* vegetation;
* substrate/structures where implemented;
* environmental activity/disturbance.

The environment must not merely exist as data structures.

It should have observable consequences.

Likewise, rendering must not independently invent environmental state that contradicts the simulation.

Where an effect is deliberately renderer-derived, keep it as a projection of environmental state.

---

# 8. Priority 5 — Complete Acoustic Integration

Verify that the Task 004 acoustic system is actually connected to the world.

The desired path is:

```text
World state
    ↓
Acoustic state
    ↓
Audio manifestation
```

Ensure that existing environmental activity, ecological activity and significant events can influence the soundscape where already supported by the implementation.

The audio system should remain:

* ambient;
* layered;
* non-distracting;
* spatially coherent;
* dynamically evolving.

Do not turn this task into a sound-asset expansion exercise.

Do not add music.

Do not add a large library of individual sounds.

Do not create `antic → playSound` shortcuts.

---

# 9. Priority 6 — Complete Antic Feedback

Verify that the antic system does more than identify/render episodes.

An antic should be able to produce meaningful consequences in the existing simulation.

Where already supported by the architecture, ensure the loop is functional:

```text
world state
    ↓
behaviour
    ↓
interaction
    ↓
antic
    ↓
state change
    ↓
new behaviour/environmental consequence
```

Complete missing links.

Do not add large numbers of new antic types.

Do not script stories.

Do not make antics predetermined sequences.

The objective is to make the existing emergent mechanism actually work.

---

# 10. Priority 7 — Observer and Idle Behaviour

Verify the existing observer and temporal behaviour.

The system should continue to simulate when the observer is absent or inactive, subject to the existing performance model.

The observer should affect manifestation/fidelity where intended, but should not simply become:

```text
observer present → activity
observer absent → inactivity
```

Verify:

* pause;
* resume;
* accelerated time where implemented;
* inactive/absent observer states;
* continued ecological progression;
* continued environmental progression.

Fix only existing functionality that is incomplete or broken.

---

# 11. Priority 8 — Deterministic Execution

Consolidate deterministic behaviour across the systems touched by Tasks 003–005.

Identify uncontrolled randomness that directly affects:

* morphology;
* posture;
* ecological state;
* antic selection;
* environmental evolution.

Use the existing seeded random infrastructure.

The immediate requirement is not mathematical bit-for-bit determinism of the renderer.

The requirement is that simulation state should not acquire unexplained nondeterminism from arbitrary `Math.random()` calls.

At minimum:

```text
same seed
+
same initial conditions
→
same relevant simulation decisions
```

---

# 12. Testing

Add or complete tests for the functionality actually changed.

Prioritise tests for:

### Morphology

* stable execution-local identity;
* deterministic signature;
* deterministic initial posture;
* different individuals produce meaningful morphological variation.

### Integration

* ecological state reaches boid/physical expression where intended;
* environment affects manifestation;
* acoustic state responds to world activity;
* antics produce state consequences.

### Regression

* existing tests continue to pass;
* simulation starts successfully;
* renderer starts successfully;
* acoustic system starts successfully;
* no existing Task 003–005 functionality regresses.

Do not build an elaborate new testing framework.

---

# 13. Visual / Runtime Validation

Run the application and inspect the actual result.

The aquarium should demonstrate:

### Environment

The background should no longer feel like an empty/dark void.

### Organisms

Boids should demonstrate:

* morphological diversity;
* individual character;
* controlled asymmetry;
* temporal expression;
* coherent swimming.

They should retain:

> **fishiness without simply becoming fish.**

### Ecology

Activity should arise from the simulated world rather than merely from rendering loops.

### Antics

Episodes should have visible consequences where appropriate.

### Audio

The soundscape should feel like an environment rather than a soundtrack.

### Continuity

Leaving the application running should produce an evolving world rather than a static animation.

---

# 14. Code Quality

As part of consolidation:

* remove obsolete code created during earlier iterations;
* remove dead imports;
* remove unused morphology parameters;
* remove temporary debugging code where no longer required;
* fix misleading names;
* keep module boundaries clear;
* avoid unnecessary abstraction;
* avoid unrelated refactoring.

Prefer small, understandable corrections.

---

# 15. Documentation

Update documentation only where the implementation has materially changed.

Do not rewrite the project's architecture documentation unnecessarily.

Document:

* important integration decisions;
* any deliberate separation between ecological agents and boids;
* execution-local organism identity;
* deterministic randomness changes;
* significant completed functionality.

---

# 16. Anti-Requirements

Do **not**:

* add new major features;
* add new species systems;
* add new lifecycle systems;
* add new persistence;
* add new databases;
* introduce ML;
* introduce OpenVDB;
* introduce USD;
* introduce H3;
* replace the renderer;
* replace the boid system;
* rewrite the ecology engine;
* create scripted narratives;
* create animation libraries;
* create conventional fish models;
* create musical scoring;
* create large sound-effect libraries;
* redesign the entire architecture.

If a problem can be solved with a small correction, do not solve it with a new subsystem.

---

# 17. Required Deliverables

Create:

```text
program_increments/v0.0.1/reports/006_consolidation_report.md
```

The report must contain:

```text
# Task 006 Consolidation Report

## Summary

## Incomplete Functionality Identified

## Corrections Implemented

## Morphology Integration

## Ecology / Boid Integration

## Environmental Integration

## Acoustic Integration

## Antic Integration

## Determinism

## Tests

## Runtime Validation

## Remaining Limitations

## Files Changed

## Final Status
```

The report must distinguish clearly between:

```text
COMPLETED
PARTIALLY COMPLETED
DEFERRED
```

Do not claim functionality is complete merely because its data structure exists.

---

# 18. Definition of Done

Task 006 is complete when:

* [ ] Existing Tasks 003–005 functionality has been reviewed.
* [ ] Significant incomplete functionality has been identified.
* [ ] Existing incomplete functionality within scope has been completed.
* [ ] Morphological identity is associated with organisms rather than array position.
* [ ] Morphology/posture initialisation does not introduce uncontrolled randomness.
* [ ] Morphology produces actual individual visual expression.
* [ ] Ecological and boid systems have a clear working relationship.
* [ ] Environmental state has observable consequences.
* [ ] Acoustic state is connected to the simulated world.
* [ ] Antics can produce consequences in the existing simulation.
* [ ] Observer/idle behaviour works as intended.
* [ ] Relevant deterministic behaviour is reproducible.
* [ ] Tests pass.
* [ ] The application runs successfully.
* [ ] No major new subsystem has been introduced.
* [ ] No morphology persistence has been introduced.
* [ ] Documentation reflects the completed implementation.
* [ ] `006_consolidation_report.md` has been committed.

---

# 19. Guiding Principle

Do not ask:

> **“What else can we add?”**

Ask:

> **“What have we already built that does not yet fully work?”**

Task 006 exists to answer that question and finish the answer.

The desired outcome is not a larger system.

It is a **more coherent, more complete, and more internally consistent system**.

Only once that condition has been achieved should the project move to the next substantive feature milestone.
