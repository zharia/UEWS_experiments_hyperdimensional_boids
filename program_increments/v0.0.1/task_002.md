# Development Agent Instruction

## v0.0.1 — Increment 004: Emergent Ecological Dynamics & Antic Manifestation

**Repository:** `https://github.com/zharia/UEWS_experiments_hyperdimensional_boids`

**Predecessor:** `program_increments/v0.0.1/agent-objectives/003_antics_ecology_evolution.md`

**Objective:** Evolve the implemented antics-based artificial ecology from an agent/behaviour/event framework into a genuinely coupled ecological system in which population dynamics, resources, habitat, memory, behaviour and antics form a persistent causal feedback loop.

---

# 1. Mission

The previous increment established the foundational machinery for:

* autonomous agents
* drives
* perception
* memory
* relationships
* environmental fields
* behaviours
* antics
* temporal scales
* ecological phases
* observer state
* persistence

This increment must now make those mechanisms **causally consequential**.

The central requirement is:

```text
ENVIRONMENT
    ↓
PERCEPTION
    ↓
DRIVES
    ↓
BEHAVIOUR
    ↓
INTERACTION
    ↓
ANTIC
    ↓
STATE CHANGE
    ↓
POPULATION / ECOLOGICAL CONSEQUENCE
    ↓
ENVIRONMENTAL CHANGE
    ↓
NEW PERCEPTIONS
    ↓
NEW BEHAVIOURS
```

This feedback loop is the principal deliverable.

Do not merely add data structures representing ecology.

The implementation must demonstrate that ecological state **changes because agents act**, and agents subsequently **change their behaviour because the ecology changed**.

---

# 2. Architectural Rule

The aquarium remains a manifestation.

Do not make `fish`, `tank`, `aquarium`, or visual concepts fundamental to the simulation architecture.

Use generic concepts such as:

```text
Agent
Species
Population
Habitat
Resource
Field
Interaction
Event
Antic
Phase
World
```

The initial demonstration may instantiate these as aquatic organisms.

---

# 3. Pre-Implementation Investigation

Before changing code:

1. Inspect the complete current repository.
2. Read the implementation report for Increment 003.
3. Identify every subsystem already implemented.
4. Identify which acceptance criteria from Increment 003 were actually satisfied.
5. Identify incomplete or provisional implementations.
6. Identify current simulation update ordering.
7. Identify current persistence format.
8. Identify current randomisation/seeding mechanism.
9. Identify current rendering/manifestation boundary.
10. Identify current tests and their coverage.

Do not duplicate existing abstractions.

If an existing abstraction already satisfies a requirement, extend it rather than creating a parallel implementation.

Begin the implementation report with a concise assessment of the existing state.

---

# 4. Population Model

Introduce a generic population abstraction.

A population should represent a collection of agents sharing a species/type and ecological context.

Conceptually:

```typescript
Population {
    id
    speciesId
    memberIds

    demographicState
    spatialDistribution

    birthRate
    mortalityRate

    carryingCapacity
}
```

Adapt this to the existing architecture.

Do not blindly copy this interface.

Population state must be derivable from agent state wherever practical.

Avoid maintaining redundant state unless there is a demonstrated performance reason.

---

# 5. Species

Introduce a species abstraction where one does not already exist.

A species should provide configurable characteristics rather than hard-coded fish behaviour.

Potential properties include:

```text
movement characteristics
habitat preference
resource requirements
energy requirements
maturity threshold
lifespan
reproductive conditions
social tendency
predation vulnerability
```

Separate:

```text
species traits
```

from:

```text
individual state
```

Individual agents may differ from species defaults.

This distinction is required for later evolutionary work.

---

# 6. Lifecycle

Implement explicit agent lifecycle state.

At minimum:

```text
BIRTH
JUVENILE
MATURE
SENESCENT
DEAD
```

Lifecycle transitions must depend upon simulation state.

Examples:

```text
age
energy
health
species characteristics
environment
```

Do not make lifecycle merely a timer.

Death must produce an ecological consequence.

At minimum:

```text
agent death
    ↓
removal from active population
    ↓
ecological event
```

Where the existing resource architecture permits it, represent the resulting biomass/detritus as a resource.

---

# 7. Reproduction

Introduce reproduction as a possible emergent behaviour.

Do not implement:

```text
every N seconds:
    spawn fish
```

Instead establish conditions such as:

```text
maturity
+
sufficient energy
+
compatible partner
+
suitable habitat
+
appropriate environmental conditions
```

These conditions should generate a reproductive candidate.

Successful reproduction must:

1. create a new agent identity;
2. initialise inherited species traits;
3. initialise individual state;
4. establish age/lifecycle state;
5. add the individual to the appropriate population;
6. record the event;
7. allow subsequent behaviour to emerge normally.

Do not implement mutation/evolution in this increment.

However, structure inheritance so it can support mutation later.

---

# 8. Resource Dynamics

Resources must become dynamic.

Implement resource behaviour sufficient to support:

* depletion
* regeneration
* consumption
* spatial distribution
* environmental dependency

Examples:

```text
food quantity
nutrient concentration
oxygen availability
vegetation density
```

Agents consuming resources must alter them.

Resources regenerating must alter the environment independently of agents.

This establishes two-way causality.

---

# 9. Resource Feedback

Demonstrate:

```text
resource abundance
    ↓
agent attraction
    ↓
feeding
    ↓
resource depletion
    ↓
reduced attraction
    ↓
migration/exploration
```

This must arise from existing drive/behaviour mechanisms rather than a special-case migration script.

---

# 10. Habitats and Niches

Introduce semantic habitat regions.

The initial aquarium should contain several distinct ecological niches, for example:

```text
SURFACE
OPEN_WATER
VEGETATION
CAVE
BOTTOM
FOOD_PATCH
CURRENT
```

These are simulation concepts, not merely rendering zones.

Each habitat should be able to expose:

```text
environmental conditions
resources
capacity
species compatibility
spatial extent
```

Agents should have habitat preferences/tolerances.

---

# 11. Spatial Preference

An agent should evaluate habitat suitability from its current state.

Conceptually:

```text
habitat suitability =
    species preference
    × environmental compatibility
    × resource availability
    × danger
    × social factors
```

Do not implement this exact formula if the existing architecture suggests a better model.

The important requirement is that agents can develop a reason to move between habitats.

---

# 12. Emergent Migration

Implement migration as a consequence of behavioural evaluation.

Example causal chain:

```text
food depleted
    ↓
hunger increases
    ↓
current habitat suitability decreases
    ↓
exploration becomes attractive
    ↓
new habitat discovered
    ↓
food discovered
    ↓
feeding
    ↓
memory of location
    ↓
future return behaviour
```

Do not create a `migrate()` function that directly moves agents between predefined locations unless it is merely a low-level capability.

The decision to migrate should arise through behaviour selection.

---

# 13. Agent Memory Upgrade

Ensure ecological events can enter agent memory.

Examples:

```text
resource location
dangerous location
successful feeding location
other agent
social interaction
failed exploration
```

Memory must influence future decisions.

A fish that repeatedly discovers food in Region A should eventually have a behavioural bias toward Region A.

The implementation need not be sophisticated.

Demonstrate causal memory.

---

# 14. Relationships

Ensure relationships affect behaviour.

For example:

```text
positive familiarity
    ↓
approach/socialise tendency increases
```

or:

```text
negative interaction
    ↓
avoidance tendency increases
```

or:

```text
shared movement
    ↓
schooling tendency increases
```

Do not build an elaborate social simulation.

Implement enough feedback to prove that relationships are stateful rather than cosmetic.

---

# 15. Antic Chaining

Extend the Antic system so that one antic can create conditions for subsequent antics.

Conceptually:

```text
ANTIC A
    ↓
world state changed
    ↓
new candidate conditions
    ↓
ANTIC B
    ↓
world state changed
    ↓
ANTIC C
```

For example:

```text
INVESTIGATION
    ↓
DISCOVERY
    ↓
FOLLOWING
    ↓
GROUP FORMATION
    ↓
EXPLORATION
    ↓
FEEDING
```

No script should explicitly specify that sequence.

Each event must arise from state produced by the preceding event.

---

# 16. Antic Significance

Introduce or strengthen an antic significance model.

Significance should consider some combination of:

```text
novelty
rarity
number of participants
ecological consequence
social consequence
duration
spatial extent
phase relevance
historical importance
observer context
```

The exact weighting should remain configurable.

The purpose is to distinguish mundane simulation activity from events worth manifesting.

For example:

```text
fish turns
```

may be an ordinary behaviour.

Whereas:

```text
three individuals discover a new habitat,
establish a feeding cluster,
and alter population distribution
```

may be a significant antic.

Do not hard-code this particular event.

---

# 17. Antic Scenes

Introduce a lightweight scene/manifestation representation.

An Antic Scene should describe:

```text
participants
spatial focus
temporal interval
event context
significance
recommended manifestation duration
```

It must not contain renderer-specific commands.

Do not encode:

```text
playAnimation("fish_chase_03")
```

The renderer should derive presentation from semantic state.

The conceptual boundary is:

```text
simulation antic
        ↓
antic scene
        ↓
renderer
```

---

# 18. Latent vs Manifest Events

Preserve the distinction between:

```text
event occurred
```

and:

```text
event was selected for manifestation
```

An event may remain latent.

The Antic Engine should select events for manifestation according to:

* significance
* novelty
* observer state
* recent history
* repetition suppression
* ecological importance

This is one of the principal characteristics inherited from the Johnny Castaway model.

---

# 19. Antic Repetition Suppression

The system must avoid producing a repetitive visible cycle.

Track recent event history.

Penalise or suppress repeated manifestations of substantially identical antics.

For example:

```text
FEED
FEED
FEED
FEED
FEED
```

must not become the apparent narrative.

The underlying feeding events may continue to occur.

The manifestation layer should preferentially surface more interesting events.

---

# 20. Ecological Event Ledger

Introduce a world-level historical event ledger.

Each significant event should be capable of recording:

```text
timestamp
event type
participants
location
phase
cause
effects
significance
```

The ledger should be queryable.

At minimum support queries such as:

```text
events since timestamp
recent significant events
events involving agent
events in habitat
events during phase
```

Do not build a database.

Use the existing persistence abstraction.

---

# 21. Historical Causality

Where practical, events should identify causal relationships.

Conceptually:

```text
resource depletion
    caused_by → feeding cluster

migration
    caused_by → resource depletion

population expansion
    caused_by → reproduction

habitat transition
    caused_by → population pressure
```

Do not implement a full causal inference system.

A lightweight explicit causal reference is sufficient.

The objective is to allow the history to explain itself.

---

# 22. Ecological Phases

Strengthen the existing phase system.

Phase transitions must be state-driven.

Possible inputs:

```text
population density
resource availability
biodiversity
habitat occupancy
energy availability
birth/death rates
disturbance
```

The following conceptual phases may be used:

```text
GENESIS
COLONISATION
ESTABLISHMENT
DIVERSIFICATION
PERTURBATION
SUCCESSION
EQUILIBRIUM
COLLAPSE
REGENERATION
```

Do not require a linear progression.

The system must be capable of remaining in a phase or transitioning between phases according to state.

---

# 23. Ecological Succession

Implement a minimal form of succession.

The environment must be capable of changing as a consequence of population activity.

Examples:

```text
vegetation expands
vegetation contracts
food patch develops
food patch becomes depleted
habitat becomes attractive
habitat becomes unsuitable
```

This creates:

```text
agent
 → environment
 → agent
```

rather than:

```text
environment
 → agent
```

This feedback loop is essential.

---

# 24. Idle-Time Simulation

Strengthen persistent simulation behaviour.

The simulation must distinguish:

```text
wall-clock time
simulation time
```

When the application is not running, the persisted state should allow the system to determine an elapsed interval.

On restart:

```text
persisted time
+
elapsed wall-clock time
        ↓
simulation progression
```

Do not attempt to simulate every missed frame.

Use coarse-grained ecological progression where appropriate.

The result should be:

> The world appears to have continued living while the application was closed.

---

# 25. Idle-Time Antic Selection

When returning from an idle/offline period:

1. recover persisted state;
2. determine elapsed time;
3. advance ecological processes appropriately;
4. identify significant historical events;
5. select one or more suitable antics for manifestation;
6. present the resulting world state.

Do not fabricate events solely for presentation.

Any manifested event must be supported by actual simulation state/history.

---

# 26. Demonstration Ecology

Construct a small but sufficiently complex initial ecology.

It should contain:

```text
multiple agents
at least one species
multiple habitats
at least one consumable resource
at least one regenerating resource
individual memory
social relationships
reproduction
death
```

Additional species are encouraged only if they materially improve the demonstration.

Do not optimise for visual spectacle.

Optimise for causal emergence.

---

# 27. Required Emergent Demonstration

The completed implementation must demonstrate at least one non-scripted ecological sequence.

A suitable conceptual example is:

```text
Initial population
      ↓
agents explore
      ↓
resource discovered
      ↓
feeding cluster forms
      ↓
resource depleted
      ↓
agents disperse
      ↓
some agents discover another habitat
      ↓
memory reinforces the new location
      ↓
social grouping develops
      ↓
reproduction occurs
      ↓
population increases
      ↓
local ecological pressure changes
      ↓
habitat/resource state changes
      ↓
new behavioural conditions emerge
```

The exact sequence is not mandatory.

What matters is that:

**no controller explicitly scripts the sequence.**

The report must identify:

```text
initial conditions
rules
random seed
observed emergent sequence
causal chain
```

---

# 28. Deterministic Emergence Test

Create at least one deterministic scenario with a fixed seed.

For example:

```text
seed = known value
initial world = known state
simulation = N simulated seconds
```

The test must verify reproducible high-level outcomes.

Do not require bit-for-bit floating-point identity unless the existing architecture supports it reliably.

Prefer invariant assertions such as:

```text
population > 0
resource decreased
at least one interaction occurred
at least one antic occurred
at least one memory was created
world state changed
```

Where practical, verify exact event sequences under a fixed seed.

---

# 29. Performance

Do not prematurely optimise.

However, instrument:

```text
agent count
simulation update duration
behaviour evaluation duration
antic evaluation duration
rendering duration
memory use where practical
```

Identify obvious pathological behaviour.

In particular, avoid:

```text
O(N²)
```

behaviour where spatial locality can reduce the problem.

Do not introduce a complex spatial index unless measurement demonstrates the need.

---

# 30. Testing

Add or extend tests for:

## Population

* membership
* birth
* death
* population state

## Lifecycle

* valid transitions
* invalid transitions
* age progression
* death consequences

## Reproduction

* preconditions
* successful reproduction
* failed reproduction
* inheritance
* population update

## Resources

* consumption
* depletion
* regeneration
* spatial lookup

## Habitat

* suitability
* preference
* environmental compatibility

## Migration

* candidate generation
* destination selection
* memory reinforcement

## Relationships

* creation
* modification
* behavioural influence

## Antics

* candidate chaining
* significance
* history
* repetition suppression
* latent/manifest distinction

## Phases

* state evaluation
* transitions
* hysteresis/stability if implemented

## Persistence

* save
* reload
* elapsed time
* continuity

## Determinism

* fixed seed
* reproducible high-level outcome

---

# 31. Invariants

Document and test important invariants.

At minimum:

```text
Every active agent has a unique identity.

Dead agents cannot perform new behaviours.

Population membership agrees with active lifecycle state.

Resource quantities cannot become physically invalid.

Antics cannot execute when preconditions are false.

Manifested antics must correspond to actual simulation events.

Simulation time cannot move backwards.

Persistence must preserve world identity and simulation continuity.

Rendering cannot mutate authoritative simulation state.
```

Add further invariants discovered during implementation.

---

# 32. Architecture Boundaries

Maintain explicit boundaries between:

```text
simulation
ecology
agent cognition
behaviour
antics
history
persistence
observation
rendering
```

Avoid circular dependencies.

Prefer:

```text
interfaces
events
state transitions
dependency injection
```

where they fit naturally.

Do not introduce abstraction solely for abstraction's sake.

---

# 33. Future Provider Boundaries

Do not implement these technologies in this increment:

```text
OpenVDB
H3
Ogre
USD
GPU simulation
MLIR
SCR integration
distributed execution
```

However, document where they can later attach.

The intended future trajectory is approximately:

```text
Current TypeScript simulation
        ↓
abstract field interface
        ↓
OpenVDB provider

Current spatial model
        ↓
spatial hierarchy/index interface
        ↓
H3 / sparse spatial providers

Current renderer
        ↓
manifestation interface
        ↓
Ogre/Vulkan

Simulation ↔ Renderer
        ↓
state/event interchange
        ↓
USD or equivalent

Simulation kernels
        ↓
future accelerated execution
        ↓
GPU / MLIR / SCR
```

Do not contaminate the current implementation with premature dependencies.

---

# 34. Developer Instrumentation

Provide a debug representation of the ecological state.

At minimum expose:

```text
simulation time
current phase
population counts
agent count
resource quantities
habitat occupancy
active antics
recent significant antics
recent ecological events
```

If a debug UI already exists, extend it.

Otherwise a structured console/debug representation is acceptable.

The developer must be able to determine **why something happened**.

---

# 35. Visual Manifestation

Improve the visual manifestation only enough to make the ecological changes perceptible.

The observer should be able to see meaningful differences such as:

```text
school formation
feeding concentration
migration
habitat preference
reproduction
population changes
environmental changes
antic episodes
```

Do not spend the majority of the increment on graphical assets.

The simulation is the product.

The graphics are its current sensory organ.

---

# 36. Required Documentation

Update the README where appropriate.

Create/update the architecture documentation.

Document:

1. population model
2. species model
3. lifecycle
4. reproduction
5. resource dynamics
6. habitat model
7. migration
8. memory feedback
9. relationship feedback
10. antic chaining
11. antic significance
12. event history
13. ecological phases
14. succession
15. idle-time progression
16. deterministic simulation
17. causal event representation
18. rendering boundary

Document every significant architectural decision.

---

# 37. Development Process

Implement in coherent stages.

Recommended sequence:

```text
001 Population + Species
002 Lifecycle
003 Reproduction
004 Resource Dynamics
005 Habitats + Niches
006 Migration
007 Ecological Feedback
008 Antic Chaining
009 Antic Significance
010 Event Ledger
011 Phase/Succession Integration
012 Idle-Time Continuity
013 Antic Scene Manifestation
014 Emergence Demonstration
015 Tests / Verification
016 Documentation / Cleanup
```

After each meaningful stage:

```text
typecheck
test
build
```

Do not accumulate an enormous unverified change set.

---

# 38. Anti-Requirements

The following are explicitly prohibited:

### Do not:

* script a fixed story;
* create a sequence of predetermined daily events;
* spawn agents merely to make the population appear alive;
* fake ecological consequences in the renderer;
* make antics independent random animations;
* give agents omniscient world knowledge;
* make every event an antic;
* reset the world on restart;
* make observer presence directly control fish behaviour;
* introduce ML simply because "emergence" sounds intelligent;
* introduce OpenVDB/H3/Ogre/USD prematurely;
* optimise before measuring;
* replace the existing hyperdimensional representation with conventional boids.

---

# 39. Acceptance Criteria

This increment is complete only when all of the following are demonstrably true:

1. Agents belong to populations.
2. Species and individual state are distinct.
3. Agents have lifecycle state.
4. Birth occurs through simulation conditions.
5. Death occurs through simulation conditions.
6. Reproduction creates persistent new identities.
7. Resources can be consumed.
8. Resources can regenerate.
9. Resource consumption changes subsequent behaviour.
10. Habitats have semantic ecological properties.
11. Agents evaluate habitat suitability.
12. Agents can discover and remember useful locations.
13. Relationships influence subsequent behaviour.
14. Population state changes as a consequence of individual activity.
15. Environmental state changes as a consequence of agent activity.
16. Environmental changes alter subsequent agent behaviour.
17. Antics can arise from these interactions.
18. Antics can create conditions for further antics.
19. Antics have significance.
20. Repetitive antics are suppressed at the manifestation layer.
21. Events are recorded in an ecological history.
22. Events can have explicit causal references.
23. Ecological phases respond to world state.
24. The simulation progresses across multiple temporal scales.
25. The world continues across application restarts.
26. Idle time can produce genuine state progression.
27. The renderer remains downstream of authoritative simulation state.
28. A deterministic seed can reproduce a meaningful ecological scenario.
29. Tests cover the principal mechanisms.
30. A non-scripted emergent sequence is demonstrated and documented.

---

# 40. Final Verification Question

Before declaring completion, ask:

> **Could the observed ecological sequence have happened differently if the initial conditions or random seed had been different?**

If the answer is no because the implementation contains a predetermined narrative sequence, the implementation has failed the central objective.

The system should instead behave approximately like:

```text
                         WORLD
                           │
                    ┌──────┴──────┐
                    │             │
              ENVIRONMENT      AGENTS
                    │             │
                    └──────┬──────┘
                           │
                       INTERACTION
                           │
                           ▼
                         EVENT
                           │
                           ▼
                         ANTIC
                           │
                    ┌──────┴──────┐
                    │             │
              AGENT CHANGE   WORLD CHANGE
                    │             │
                    └──────┬──────┘
                           │
                           ▼
                    NEW POSSIBILITIES
                           │
                           ▼
                      NEW EVENTS
```

The desired result is not a collection of intelligent fish.

It is a **small artificial world with causal memory**.

The observer should eventually be able to leave the application running, return hours later, and discover that the ecology has changed for reasons that can be reconstructed from its history.

That is the threshold this increment must establish.
