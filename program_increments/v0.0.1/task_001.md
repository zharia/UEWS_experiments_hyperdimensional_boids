# Development Agent Instruction

## Evolution of UEWS Hyperdimensional Boids into a Multi-Scalar, Phased, Antics-Based Artificial Ecology

**Repository:** `https://github.com/zharia/UEWS_experiments_hyperdimensional_boids`

**Objective:** Evolve the existing hyperdimensional boids experiment into the foundation of a persistent, multi-scalar, phased, antics-based artificial ecology, initially manifested as an aquarium.

**Primary conceptual reference:** Johnny Castaway / Scrantic-style persistent animated world behaviour, specifically the concept of a world containing autonomous characters whose behaviour produces episodic "antics" over time.

---

# 1. Mission

The existing project is a seed implementation of hyperdimensional boids.

Do **not** treat this task as "add more fish animations."

The objective is to transform the project from:

> a visual boids experiment

into:

> a persistent computational ecology in which autonomous agents inhabit a dynamic semantic environment, generate behaviours from internal and environmental state, and produce bounded episodic events ("antics") which emerge from the simulation.

The aquarium is the **first manifestation**, not the ultimate abstraction.

The resulting architecture must allow future manifestations such as:

* aquarium
* terrarium
* artificial ecosystem
* microscopic ecology
* planetary ecology
* abstract semantic world
* simulation environment
* screensaver
* interactive installation

The architecture must therefore avoid hard-coding aquarium-specific assumptions into the simulation core.

---

# 2. Governing Principles

Implement according to these principles.

## 2.1 Simulation is not rendering

The simulation must be separable from the renderer.

The simulation determines:

* world state
* agent state
* environmental state
* interactions
* behaviours
* events
* antics
* temporal progression

The renderer determines:

* projection
* geometry
* animation
* visual effects
* presentation

Do not make simulation correctness dependent upon rendering.

---

## 2.2 Behaviour is not animation

An animation is a manifestation of behaviour.

For example:

```text
BEHAVIOUR:
    investigate(object)

MANIFESTATION:
    fish swims toward object
    fish circles object
    fish changes orientation
```

The simulation must represent the former.

The renderer may implement the latter.

---

## 2.3 Antics are not behaviours

An **Antic** is a bounded, potentially observable episode arising from one or more behaviours.

Conceptually:

```text
World State
    ↓
Potential behaviours
    ↓
Behaviour selection
    ↓
Temporal episode
    ↓
Antic
    ↓
State transformation
    ↓
New world state
```

An Antic therefore has:

* participants
* preconditions
* trigger
* duration
* internal phases
* behavioural actions
* spatial extent
* temporal scale
* state effects
* successor possibilities
* observability/salience

---

## 2.4 Emergence over scripting

Do not implement long predetermined stories.

Avoid:

```text
day1 → event1
day2 → event2
day3 → event3
```

Instead implement:

```text
state
+
drives
+
environment
+
memory
+
relationships
+
chance
        ↓
behavioural possibilities
        ↓
antic candidates
        ↓
antic selection
```

The system should be capable of producing novel sequences from its state.

---

## 2.5 Persistence

The simulated world must have continuity.

If the application closes and later restarts, the world should be capable of continuing from its prior state.

At minimum persist:

* simulation time
* phase
* agent identity
* agent state
* relevant memories
* relationships
* environmental state
* population state
* significant historical events
* completed/active ecological transitions

Do not yet build a sophisticated database.

A versioned JSON/state representation is sufficient for v0.1.

Design the persistence boundary so it can later be replaced by another storage mechanism.

---

# 3. Hyperdimensional Model

Preserve the existing hyperdimensional-boids work.

Do not discard or replace the existing dimensional model merely because a more conventional 3D representation appears easier.

The system should conceptually distinguish:

```text
Physical State
    x
    y
    z

Latent / Hyperdimensional State
    h1
    h2
    ...
    hn
```

The existing fourth dimension must remain meaningful.

Do not arbitrarily redefine the existing fourth dimension without first documenting its current semantics.

Instead introduce a general latent-state abstraction.

For example:

```typescript
interface LatentState {
    dimensions: Float64Array;
}
```

or an equivalent implementation appropriate to the existing codebase.

Latent dimensions may eventually represent things such as:

* curiosity
* hunger
* fear
* social affinity
* territoriality
* arousal
* familiarity

However, these interpretations must remain configurable rather than being structurally baked into the dimensional representation.

---

# 4. Agent Model

Evolve the existing boid into an autonomous ecological agent.

Each agent should have at least:

```text
Identity
Physical State
Latent State
Energy
Drives
Perception
Memory
Relationships
Current Behaviour
Current Antic
Age / lifecycle state
```

A conceptual model:

```typescript
Agent {
    id
    species
    position
    velocity
    acceleration

    latentState

    energy
    drives

    perception
    memory
    relationships

    behaviourState
    anticState

    lifecycle
}
```

Use the repository's existing TypeScript conventions rather than blindly implementing this exact interface.

---

# 5. Drives

Introduce a generic drive system.

Initial drives should include:

* hunger
* fear
* curiosity
* rest
* exploration
* socialisation
* territoriality

Do not make these independent hard-coded state machines.

Drives should contribute to behavioural selection.

Conceptually:

```text
drive intensity
        +
perceived affordances
        +
environment
        +
memory
        +
relationships
        +
risk
        ↓
behaviour candidates
```

The implementation should permit additional drives later.

---

# 6. Perception

Agents must not possess omniscient knowledge of the simulation.

Introduce a perception boundary.

An agent should perceive some subset of:

* nearby agents
* resources
* hazards
* environmental fields
* terrain
* unusual objects/events

Perception should have configurable:

* radius
* dimensional sensitivity
* visibility
* salience
* decay

The purpose is to create locally informed behaviour rather than global scripting.

---

# 7. Memory

Introduce lightweight agent memory.

Memory should support at least:

```text
event
entity
location
timestamp
valence
strength
```

Example:

```text
Agent A
    encountered Agent B
    at Region X
    at simulation time T
    outcome: positive
```

Memory should influence future behaviour.

Memory must decay or become less salient over time unless reinforced.

Avoid implementing an elaborate cognitive architecture at this stage.

---

# 8. Environmental Field

Introduce an abstraction representing the dynamic environment.

The initial aquarium environment should support fields such as:

```text
temperature
illumination
oxygen
nutrients
food
current
turbidity
```

The fields must be spatially addressable.

Conceptually:

```text
field(x, y, z, t)
```

The implementation may initially use a lightweight discrete representation.

Do not prematurely implement OpenVDB.

However, structure the abstraction so that a sparse field provider such as OpenVDB can replace the implementation later.

---

# 9. Ecological Resources

Introduce resources as simulation entities or field quantities.

Examples:

* food
* nutrients
* shelter
* vegetation
* light
* oxygen

Agents should interact with resources.

Resource interaction must modify world state.

Example:

```text
fish consumes food
    ↓
fish.energy += ΔE
food.quantity -= ΔQ
local nutrient state changes
event recorded
```

This is important because behaviour must have consequences.

---

# 10. Relationships

Introduce relationships between agents.

Relationships should not merely be visual proximity.

Potential relationship properties:

```text
affinity
familiarity
fear
dominance
territorial association
cooperation
```

The exact implementation should remain minimal.

The important requirement is that previous interactions can influence future behaviour.

---

# 11. Behaviour System

Create a generic behaviour-selection layer.

Initial behaviours should include:

```text
wander
school
follow
avoid
flee
feed
rest
investigate
approach
socialise
defend
explore
```

These are behavioural capabilities, not scripted animations.

Boids rules should remain useful as locomotion primitives.

For example:

```text
Behaviour: school

    cohesion
    alignment
    separation
```

The existing boids system should therefore become a **locomotion/steering substrate**, rather than the complete behavioural architecture.

---

# 12. Antic System

Implement the central new subsystem:

```text
src/antics/
```

or the equivalent structure appropriate to the repository.

It should conceptually contain:

```text
Antic
AnticCandidate
AnticTrigger
AnticContext
AnticScheduler
AnticHistory
AnticSalience
```

An Antic should support:

```text
id
type
participants
trigger
preconditions
startTime
duration
phase
actions
effects
salience
status
```

Example conceptual antic:

```text
THE INVESTIGATION

Participants:
    fish A

Trigger:
    unfamiliar object enters perceptual field

Preconditions:
    curiosity > threshold
    danger < threshold

Sequence:
    notice
    approach
    inspect
    circle
    depart

Effects:
    memory created
    curiosity modified
    object familiarity increased
```

This is a **template**, not a prescribed story.

---

# 13. Antic Candidates

The simulation should continuously identify possible antics.

For example:

```text
fish A hungry
+
food detected
+
predator absent
+
energy below threshold
```

produces:

```text
FEEDING candidate
```

Likewise:

```text
fish A
+
fish B
+
territorial overlap
+
high territoriality
```

may produce:

```text
CONFRONTATION candidate
```

Candidates must be evaluated rather than automatically executed.

---

# 14. Antic Selection

Introduce an Antic selection mechanism.

Selection may consider:

```text
urgency
drive strength
novelty
salience
probability
risk
recent antic history
agent memory
environment
observer state
```

Do not implement a complicated machine-learning system.

A deterministic/scored selection model with controlled stochasticity is sufficient.

The system must avoid repetitive behaviour.

Maintain enough history to prevent:

```text
feed
feed
feed
feed
feed
```

becoming the visible "story."

---

# 15. Multi-Scalar Time

Introduce explicit simulation time.

The system should distinguish:

```text
wall clock
simulation clock
agent timescale
ecological timescale
```

Support configurable time acceleration.

Conceptually:

```text
real time
    ↓
simulation time
    ↓
multiple temporal processes
```

Different processes should operate at different frequencies.

For example:

```text
movement        60 Hz
perception      10 Hz
behaviour       2 Hz
antics          event-driven
ecology         0.1 Hz
succession      very slow
```

Do not force every subsystem to update every frame.

---

# 16. Ecological Phases

Introduce a phase/epoch system.

Initial phases:

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

These are not necessarily a linear sequence.

Implement:

```text
Phase
PhaseTransition
PhaseContext
```

Transitions must depend on world state.

For example:

```text
population density
resource availability
environmental conditions
biodiversity
energy flow
disturbance
```

The phase system should therefore describe the **state of the ecology**, not merely the elapsed time.

---

# 17. Observer Model

Introduce an observer abstraction.

Initial states:

```text
ABSENT
PRESENT
WATCHING
INTERACTING
INACTIVE
```

The observer must not become a crude "make fish perform" switch.

Instead observer state may influence:

* antic salience
* manifestation priority
* interaction opportunities
* simulation speed
* visibility
* event promotion

The world continues independently of observation.

This is a core design principle.

---

# 18. Hidden / Latent Antics

Not every event should be presented to the observer.

Maintain the distinction:

```text
simulation event
        ≠
observable antic
```

The Antic Engine may identify an event as:

```text
latent
```

and later promote it to:

```text
manifest
```

based on salience, observer context, novelty, or consequence.

This produces the important property:

> There is always more happening in the world than the observer sees.

---

# 19. Antic History

Maintain world-level antic history.

Record:

```text
antic id
time
participants
location
type
phase
outcome
consequences
```

Use history to influence future event selection.

History should therefore become part of the ecology's state.

---

# 20. Rendering

Preserve the existing visual output.

Improve it only as required to manifest the new simulation.

The renderer should eventually receive:

```text
agent state
environment state
antic manifestation state
phase state
```

rather than deciding what agents are doing.

Introduce a clear projection boundary:

```text
simulation space
      ↓
projection
      ↓
screen space
```

Preserve the existing 2.5D presentation where practical.

Do not force the simulation into the same dimensionality as the presentation.

The conceptual model is:

```text
hyperdimensional world
        ↓
projection
        ↓
2.5D aquarium
```

---

# 21. Persistence

Implement a versioned world-state format.

For example:

```text
state/
    world-state.v0.1.json
```

The precise location may follow existing project conventions.

Persist enough information to demonstrate continuity across application restarts.

Include a schema/version identifier.

Provide:

```text
saveWorld()
loadWorld()
```

or equivalent abstractions.

Do not tightly couple persistence to browser localStorage if the architecture can avoid it.

Provide an abstraction so storage can later move to filesystem/server/database persistence.

---

# 22. Project Structure

Evolve the repository toward conceptual separation similar to:

```text
src/
├── core/
│   ├── simulation/
│   ├── clock/
│   ├── state/
│   └── persistence/
│
├── space/
│   ├── physical/
│   ├── hyperdimensional/
│   ├── fields/
│   └── topology/
│
├── agents/
│   ├── agent/
│   ├── perception/
│   ├── memory/
│   ├── drives/
│   ├── behaviour/
│   └── locomotion/
│
├── ecology/
│   ├── habitats/
│   ├── populations/
│   ├── resources/
│   ├── interactions/
│   └── succession/
│
├── antics/
│   ├── antic/
│   ├── candidates/
│   ├── triggers/
│   ├── scheduler/
│   ├── salience/
│   └── history/
│
├── phases/
│   ├── phase/
│   └── transitions/
│
├── observer/
│
└── rendering/
```

Do not mechanically create empty directories.

Only create structural boundaries where actual implementation exists.

---

# 23. Testing Requirements

Tests are mandatory.

At minimum implement tests for:

### Agent

* identity persistence
* drive modification
* perception boundaries
* memory creation
* memory decay
* relationship modification

### Environment

* field lookup
* field modification
* resource consumption
* environmental state transitions

### Behaviour

* candidate generation
* candidate rejection
* behaviour selection
* deterministic behaviour under controlled seed

### Antics

* antic preconditions
* antic activation
* antic lifecycle
* antic completion
* antic effects
* candidate prioritisation
* history recording
* repetition suppression

### Phases

* phase detection
* valid transitions
* invalid transitions
* persistence of phase state

### Persistence

* serialize
* deserialize
* schema validation
* state continuity

### Simulation

* deterministic seeded execution
* simulation clock
* accelerated time
* restart continuity

---

# 24. Determinism

The simulation must support a deterministic random seed.

For example:

```text
seed = 12345
```

must produce reproducible simulation behaviour.

This is essential for debugging emergent behaviour.

Allow production mode to use a non-deterministic seed.

Document both modes.

---

# 25. Instrumentation

Add developer-visible instrumentation.

The simulation should expose enough information to understand:

```text
current phase
simulation time
agent count
active antics
recent antics
candidate antics
agent drives
environmental state
```

A basic debug overlay is acceptable.

The goal is not visual polish.

The goal is making emergence inspectable.

---

# 26. Demonstration Scenario

The completed implementation must demonstrate at least one genuinely emergent sequence.

For example:

```text
GENESIS
    ↓
fish introduced
    ↓
exploration
    ↓
individual encounters another
    ↓
social relationship forms
    ↓
food appears
    ↓
feeding event
    ↓
local competition
    ↓
school formation
    ↓
predator/hazard appears
    ↓
school disperses
    ↓
individual memories updated
    ↓
new relationships
    ↓
ecological state changes
```

Do not script this exact sequence.

Construct sufficient mechanisms for such a sequence to emerge.

The final report must explain which portions emerged from state and which portions are intentionally seeded.

---

# 27. Acceptance Criteria

The implementation is complete only when:

1. Existing boid functionality remains operational.
2. Agents have persistent identity.
3. Agents have internal drives.
4. Agents perceive locally.
5. Agents retain memory.
6. Agent relationships affect behaviour.
7. The environment contains dynamic fields/resources.
8. Behaviour is separated from rendering.
9. Antics are distinct from behaviours.
10. Antic candidates can emerge from world state.
11. Antics have bounded lifecycles.
12. Antics modify world state.
13. Antic history is retained.
14. Repetitive antics are suppressed.
15. Simulation time is explicit.
16. Different processes can run at different temporal scales.
17. Ecological phases exist.
18. Phase transitions depend on state rather than simply elapsed time.
19. Observer state exists independently of simulation state.
20. Latent events can exist without immediate manifestation.
21. World state survives application restart.
22. Simulation execution supports deterministic seeds.
23. Automated tests cover the new systems.
24. The existing visual presentation remains functional.
25. The architecture does not make aquarium-specific concepts fundamental to the simulation core.

---

# 28. Explicit Non-Goals

Do **not** implement the following in this increment unless required by the existing architecture:

* OpenVDB integration
* Ogre integration
* USD
* GPU simulation
* machine-learning agents
* neural networks
* evolutionary algorithms
* sophisticated fluid dynamics
* realistic biological simulation
* multiplayer
* distributed simulation
* database backend
* elaborate UI
* procedural narrative authoring system
* full 3D aquarium assets

Those belong to later increments.

The present objective is to establish the **semantic and behavioural substrate**.

---

# 29. Documentation Requirements

Update the repository documentation to explain:

1. Existing architecture.
2. New architecture.
3. Agent model.
4. Drive model.
5. Perception model.
6. Memory model.
7. Environmental fields.
8. Behaviour system.
9. Antic model.
10. Antic lifecycle.
11. Multi-scale temporal model.
12. Ecological phases.
13. Observer model.
14. Persistence.
15. Deterministic execution.
16. Rendering boundary.
17. Future OpenVDB/Ogre/USD integration points.

Create a formal architecture document rather than relying exclusively on README prose.

Document important invariants and architectural decisions.

---

# 30. Development Method

Work incrementally.

Before modifying code:

1. Inspect the complete repository.
2. Identify current architecture.
3. Identify existing hyperdimensional representations.
4. Identify current boid implementation.
5. Identify current rendering architecture.
6. Identify existing tests.
7. Identify build/test commands.
8. Produce a short implementation assessment.

Then implement in coherent increments.

Recommended sequence:

```text
PI-1
Foundation / state model

PI-2
Agent cognition

PI-3
Environment / ecology

PI-4
Behaviour system

PI-5
Antic engine

PI-6
Temporal scales / phases

PI-7
Persistence

PI-8
Observer / manifestation

PI-9
Integration / emergence demonstration

PI-10
Testing / documentation / cleanup
```

Do not create artificial abstractions merely to satisfy the list.

Use the simplest architecture capable of preserving the conceptual boundaries.

---

# 31. Verification

After implementation:

```text
install dependencies
run type checking
run tests
run build
run linting if configured
run application
exercise deterministic seed
exercise persistence
observe multiple simulation timescales
observe antic generation
observe phase transitions
```

Fix all regressions introduced by the work.

Do not declare completion merely because the application renders.

---

# 32. Final Implementation Report

Create:

```text
program_increments/v0.0.1/reports/003_antics_ecology_implementation_report.md
```

The report must contain:

## Executive Summary

What changed and why.

## Existing Architecture

What was discovered before implementation.

## Implemented Architecture

What was actually implemented.

## Deviations

Where implementation differs from this specification and why.

## Agent Model

Explain identity, drives, perception, memory and relationships.

## Ecology

Explain fields, resources and interactions.

## Behaviour

Explain candidate generation and selection.

## Antics

Explain the Antic model and lifecycle.

## Temporal Model

Explain simulation time and temporal scales.

## Phases

Explain phase detection and transitions.

## Persistence

Explain the state schema and restart behaviour.

## Emergence Demonstration

Describe at least one sequence that emerged from the system.

Clearly distinguish:

```text
seeded initial condition
        vs
implemented rule
        vs
emergent outcome
```

## Tests

Report all tests executed and results.

## Performance

Report approximate:

* simulation update rate
* agent count
* rendering rate
* memory use if readily measurable

## Known Limitations

Be explicit.

## Future Integration Points

Identify where future work can integrate:

```text
OpenVDB
H3
Ogre
USD
SCR
GPU execution
distributed execution
```

---

# 33. Architectural North Star

The final implementation should make the following conceptual model possible:

```text
                    OBSERVER
                       │
                       ▼
                MANIFESTATION
                       │
                       ▼
                 ANTIC ENGINE
                       │
             ┌─────────┴─────────┐
             │                   │
        EVENT HISTORY       CANDIDATES
             │                   │
             └─────────┬─────────┘
                       ▼
                BEHAVIOUR SYSTEM
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          DRIVES    MEMORY    RELATIONS
             │         │         │
             └─────────┼─────────┘
                       ▼
                    AGENTS
                       │
                       ▼
                ECOLOGICAL FIELD
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          RESOURCES  HABITAT  ENVIRONMENT
                       │
                       ▼
                 WORLD STATE
                       │
                       ▼
             HYPERDIMENSIONAL SPACE
```

The essential property is **causal continuity**:

```text
state
 → perception
 → motivation
 → behaviour
 → interaction
 → antic
 → consequence
 → changed state
 → future behaviour
```

That loop is the heart of the system.

---

# 34. Final Principle

Do not build a fish screensaver.

Build the smallest credible **world** in which a fish screensaver can emerge.

The system should eventually make it possible for an observer to leave the application running for hours or days and return to find that:

* agents remember things,
* relationships have changed,
* populations have shifted,
* environments have evolved,
* unexpected events have occurred,
* previous antics have consequences,
* ecological phases have changed,
* and the world has continued to exist without the observer.

The ultimate test is therefore not:

> "Does it look like an aquarium?"

The ultimate test is:

> **"Does it feel as though something has been living in there while I was away?"**

Implement the architecture necessary to make that question answerable with simulation state rather than theatrical illusion.
