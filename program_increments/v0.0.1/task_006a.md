# Task 006A — Ecological Identity Coupling & Final Conformance

**Location:** `program_increments/v0.0.1/task_006a.md`

**Parent:** Task 006 — Consolidation & Completion
**Status:** Development task
**Scope:** Corrective completion of the remaining Task 006 integration issue

---

## 1. Mission

Complete the remaining substantive issue identified during review of Task 006:

> **The relationship between `EcologicalAgent` and `Boid4D` is not yet genuinely identity-driven.**

Task 006 successfully introduced organism IDs and established substantial ecological → boid integration. However, the current bridge still establishes ecological/boid correspondence using array position and modulo arithmetic rather than using the organism identity that the architecture now provides.

This task is therefore a **small corrective integration task**, not a new architecture phase.

The objective is to make the existing ecological/boid relationship explicitly identity-based while preserving the current simulation architecture and behaviour.

### The desired invariant is:

> **A boid represents a specific ecological organism because both systems refer to the same organism identity, not because the organisms happen to occupy the same array position.**

Do not redesign the ecology engine, boid engine, morphology system, rendering architecture, or persistence system.

---

# 2. Existing Architecture — Preserve It

The repository currently contains two cooperating simulation representations:

```text
EcologicalAgent
      │
      │ ecological state / cognition / drives
      ▼
AquariumSceneManager
      │
      ▼
Boid4D
      │
      ├── kinematics
      ├── posture
      └── morphology
```

There is currently also an explicit organism identifier on `Boid4D`.

Task 006 introduced the necessary foundations:

* stable execution-local organism IDs;
* deterministic seeded simulation;
* morphology keyed by organism identity;
* ecological state propagated into boid state;
* environmental flow propagated into boid simulation;
* antic feedback into ecological/environmental state;
* observer-independent simulation progression.

**Do not discard this work.**

The purpose of this task is to make the identity relationship explicit and robust.

---

# 3. Problem to Correct

Inspect the current bridge in:

```text
src/rendering/aquariumScene.ts
```

The current integration contains positional association logic equivalent to:

```text
macro boid i
    →
macro ecological agent [i % macroAgents.length]

meso boid i
    →
meso ecological agent [i % mesoAgents.length]
```

This means that although IDs exist, the ID is not actually being used to establish the relationship.

This creates a hidden invariant:

> array ordering must remain synchronized between the ecological population and the boid population.

That invariant is undesirable and defeats much of the purpose of introducing stable organism identity.

### Example failure

If:

```text
EcologicalAgents:
A
B
C
```

and:

```text
Boids:
A
B
C
```

the positional mapping works.

But after a population operation produces:

```text
EcologicalAgents:
C
A
B
```

while boids remain:

```text
A
B
C
```

the bridge may associate:

```text
Boid A → Ecological C
Boid B → Ecological A
Boid C → Ecological B
```

even though their explicit organism IDs remain stable.

That is precisely the failure identity-based integration is intended to prevent.

---

# 4. Required Correction

## 4.1 Make organism identity authoritative

Establish a deterministic identity-based mapping:

```text
organism ID
     │
     ├── EcologicalAgent
     │
     └── Boid4D
```

The bridge must use the organism identity to locate the corresponding ecological state.

Do not use:

* array position;
* modulo arithmetic;
* population ordering;
* object reference equality;
* incidental species ordering

as the mechanism establishing organism identity.

---

## 4.2 Reuse the existing IDs

Do not invent a second identity system.

Inspect the existing:

```text
Boid4D.id
```

and the existing ecological-agent identity mechanism.

Determine the canonical organism identifier already used by the ecology system.

If the two systems currently use different fields representing the same conceptual identity, establish a single explicit mapping rather than introducing another identifier hierarchy.

The intended result should be conceptually equivalent to:

```ts
Map<OrganismId, EcologicalAgent>
```

and:

```ts
Boid4D.id === EcologicalAgent.id
```

for corresponding organisms.

Use the repository's existing ID types/conventions wherever possible.

---

# 5. Bridge Requirements

Modify the integration layer so that the bridge behaves conceptually like:

```ts
for (const boid of boids) {
    const agent = ecologicalAgentsById.get(boid.id);

    if (!agent) {
        // explicit, observable handling
        continue;
    }

    boid.ecologicalAgentId = agent.id;
    boid.behaviourType = agent.behaviourType;
    boid.energyLevel = agent.energyLevel;
    boid.hunger = agent.hunger;
    boid.fear = agent.fear;
    ...
}
```

The exact implementation may differ according to the existing architecture.

### Important

Do not simply create a `Map` and then populate it using positional associations.

The **source of truth must be the identity itself**.

---

# 6. Population Lifecycle

Inspect the existing creation/spawning paths for:

```text
Boid4D
EcologicalAgent
```

Ensure that when an organism is created, its identity is established consistently.

The following invariant must hold:

```text
created ecological organism
        ↓
assigned organism ID
        ↓
corresponding boid receives same organism ID
```

If the existing architecture creates the ecological agent and boid separately, introduce only the minimum coordination necessary to establish this identity.

Do not rewrite the population system.

---

# 7. Population Reordering Test

Add a regression test demonstrating that identity, rather than array position, determines the relationship.

The test should conceptually perform:

### Initial state

```text
Ecological:
A
B
C

Boids:
A
B
C
```

### Reorder ecological population

```text
Ecological:
C
A
B

Boids:
A
B
C
```

### Expected result

After the bridge executes:

```text
Boid A → Agent A
Boid B → Agent B
Boid C → Agent C
```

The test must fail if the implementation falls back to positional matching.

---

# 8. Identity Stability Test

Add a test demonstrating that identity survives array reordering.

Given:

```text
agent.id = "organism_A"
```

and its corresponding:

```text
boid.id = "organism_A"
```

reordering either population must not change their association.

This test should establish an explicit invariant:

```text
association(boid, ecologicalAgent)
=
identity equality
```

rather than:

```text
association(boid, ecologicalAgent)
=
array index equality
```

---

# 9. Missing Identity Handling

Define explicit behaviour for:

```text
boid.id exists
but
no ecological agent exists
```

and:

```text
ecological agent exists
but
no boid exists
```

Do not silently associate the organism with another organism.

Do not use fallback positional matching.

A missing association should be observable through appropriate logging/debug information and should not corrupt another organism's state.

Use the repository's existing logging conventions.

Avoid introducing noisy per-frame logs.

---

# 10. Do Not Fake Bidirectionality

The Task 006 report describes the integration as a:

> “clean, bidirectional bridge”

Verify this claim against the actual implementation.

Do not modify the code merely to make the documentation appear correct.

Instead distinguish explicitly between:

### Current authoritative relationships

For example:

```text
Ecology
    ↓
behaviour / drives / ecological state
    ↓
Boid
```

and:

```text
Boid
    ↓
kinematic state
    ↓
rendering
```

If the architecture does **not** currently provide genuine bidirectional state synchronisation, do not invent it.

The goal of this task is identity correctness, not artificial bidirectionality.

Update the documentation/report so that architectural claims accurately describe the implementation.

---

# 11. Preserve Existing Simulation Semantics

The following must remain intact:

### Determinism

The existing seeded simulation must remain deterministic for equal seeds.

Do not reintroduce uncontrolled:

```ts
Math.random()
```

into simulation logic.

### Morphology

The existing organism-bound morphology system must remain intact.

Morphology must continue to use organism identity rather than array position.

### Posture

Existing deterministic posture generation and hysteresis must remain intact.

### Environment

Environmental flow must continue to influence the boid simulation.

### Acoustic system

Existing acoustic derivation must continue to operate from simulation/environmental state.

### Antics

Existing antic completion → ecological/environmental feedback must remain intact.

### Observer absence

Simulation must continue progressing when the observer is absent/inactive.

---

# 12. Do Not Expand Scope

This task explicitly prohibits:

* new species;
* new lifecycle systems;
* morphology persistence;
* databases;
* machine learning;
* neural simulation;
* OpenVDB integration;
* USD integration;
* H3 integration;
* new rendering engines;
* new physics engines;
* new audio engines;
* replacement of the ecology engine;
* replacement of the boid engine;
* rewriting the simulation architecture;
* scripted narrative systems;
* new major behavioural systems;
* new persistence architecture;
* multiplayer/networking architecture.

If you discover a desirable architectural improvement outside this task, document it as a future issue rather than implementing it.

---

# 13. Required Investigation Before Modification

Before changing code, inspect:

```text
src/simulation/
src/rendering/
src/
tests/
program_increments/v0.0.1/
```

Specifically identify:

1. canonical ecological-agent identity;
2. canonical boid identity;
3. boid creation path;
4. ecological-agent creation path;
5. current bridge;
6. morphology identity mechanism;
7. existing deterministic RNG mechanism;
8. existing Task 006 tests;
9. existing population mutation/reordering mechanisms.

Do not assume the report is perfectly accurate.

Treat the source code as authoritative.

---

# 14. Required Implementation

Implement the smallest coherent correction that establishes:

### Invariant 1 — Identity

```text
corresponding ecological agent and boid share one organism identity
```

### Invariant 2 — Identity-based lookup

```text
bridge resolution uses organism identity
```

### Invariant 3 — Reordering safety

```text
population ordering does not alter organism association
```

### Invariant 4 — No accidental reassignment

```text
missing identity does not cause fallback association
```

### Invariant 5 — Existing behaviour preserved

```text
Task 006 behaviour remains intact
```

---

# 15. Tests

Run the complete existing test suite.

At minimum, add tests covering:

1. identity-based ecological/boid association;
2. ecological population reordering;
3. boid population reordering;
4. stable identity after reordering;
5. missing ecological agent;
6. missing boid;
7. deterministic simulation;
8. existing morphology identity behaviour.

Do not remove or weaken existing tests to make the new implementation pass.

The expected result is:

```text
existing tests: PASS
new identity tests: PASS
```

---

# 16. Runtime Validation

Run the application and verify:

* organisms appear normally;
* morphology remains stable;
* posture remains stable/coherent;
* ecological behaviour continues affecting boids;
* environmental current continues affecting movement;
* antics continue producing ecological/environmental consequences;
* audio continues functioning;
* observer absence continues functioning;
* no runtime exceptions occur;
* no identity-related warnings occur during normal operation.

If practical, deliberately exercise a population reorder or equivalent state mutation and verify that organism relationships remain correct.

---

# 17. Documentation Correction

Review:

```text
program_increments/v0.0.1/reports/006_consolidation_report.md
```

Correct any statement that overstates the implementation.

In particular, distinguish:

```text
identity-based integration
```

from:

```text
bidirectional simulation coupling
```

Do not describe the system as genuinely bidirectional unless both directions actually exist as state relationships.

The documentation should describe the architecture that exists, not the architecture that might eventually exist.

---

# 18. Required Report

Create:

```text
program_increments/v0.0.1/reports/006a_identity_conformance_report.md
```

The report must contain:

## 18.1 Executive Summary

What was corrected.

## 18.2 Previous Failure

Explain the positional/modulo mapping problem.

## 18.3 Identity Model

Document the canonical organism identity and how it connects:

```text
EcologicalAgent
       ↕
  Organism ID
       ↕
    Boid4D
```

## 18.4 Implementation

List the files changed and explain each change.

## 18.5 Tests

Report:

* test files;
* test count;
* passing tests;
* failures;
* regression results.

## 18.6 Runtime Validation

Report application/build/runtime validation.

## 18.7 Architectural Accuracy

Explicitly state whether the ecological/boid relationship is:

* unidirectional;
* partially bidirectional;
* genuinely bidirectional.

Base this conclusion on the implementation.

## 18.8 Remaining Limitations

Record any issues discovered but intentionally left outside scope.

---

# 19. Definition of Done

Task 006A is complete only when all of the following are true:

* [x] ecological-agent identity has been identified;
* [x] boid identity has been identified;
* [x] corresponding organisms use the same identity;
* [x] bridge lookup is identity-based;
* [x] positional/modulo association has been removed from organism matching;
* [x] ecological population reordering does not break associations;
* [x] boid population reordering does not break associations;
* [x] missing organisms do not cause accidental reassignment;
* [x] existing Task 006 morphology identity remains intact;
* [x] deterministic simulation remains intact;
* [x] environmental coupling remains intact;
* [x] acoustic coupling remains intact;
* [x] antic feedback remains intact;
* [x] observer-independent simulation remains intact;
* [x] all existing tests pass;
* [x] new identity tests pass;
* [x] application builds successfully;
* [x] application runs successfully;
* [x] Task 006 documentation accurately describes the implementation;
* [x] `006a_identity_conformance_report.md` exists;
* [x] no major new subsystem has been introduced.

---

# 20. Final Principle

This task is about removing one remaining hidden dependency:

```text
POSITION
```

and replacing it with:

```text
IDENTITY
```

The architectural principle is:

> **An organism is an identity that happens to have representations in multiple simulation subsystems. It is not the array position of those representations.**

Do not solve this by making the arrays harder to reorder.

Solve it by making array ordering irrelevant.

After implementation, provide the final report and a concise summary of:

```text
WHAT WAS WRONG
WHAT WAS CHANGED
WHAT WAS VERIFIED
WHAT REMAINS
```
