# Development Agent Instruction

## Program Increment v0.0.1 — Task 003

### Environmental World, Atmospheric Background & Dynamic Tank Environment

**Repository:** `https://github.com/zharia/UEWS_experiments_hyperdimensional_boids`

**Task file:** `program_increments/v0.0.1/task_003.md`

---

## 1. Mission

Upgrade the existing aquarium/tank environment from a largely dark and visually empty background into a **subtle, persistent, multi-layered, dynamically evolving environmental world**.

The objective is **not** to make the aquarium visually busy.

The objective is to make the tank feel as though it is an actual environment in which the existing ecological simulation is occurring.

The environment must be:

* ambient;
* non-distracting;
* visually coherent;
* multi-layered;
* spatially structured;
* dynamically evolving;
* responsive to ecological/environmental state;
* persistent where appropriate;
* deterministic under a fixed seed;
* capable of becoming an observable consequence of ecological history;
* renderer-independent at the simulation/state level.

The guiding principle is:

> **The aquarium should have an atmosphere, not a backdrop; an environment, not a wallpaper.**

This task concerns the **visual/environmental subsystem**.

Do **not** implement the full acoustic ecology/soundscape system in this task. However, establish clean interfaces and environmental state abstractions that will allow the subsequent acoustic task to consume the same environmental state.

---

# 2. Architectural Principle

The authoritative simulation remains the source of truth.

Do not create a renderer-owned artificial environment that exists independently of the simulation.

The intended architecture is:

```text
                    AUTHORITATIVE WORLD
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        Ecological     Environmental   Historical
           State           State         State
              │            │            │
              └────────────┼────────────┘
                           ▼
                 Environmental Projection
                           │
                           ▼
                      Visual Renderer
```

The renderer must **manifest environmental state**.

It must not invent authoritative ecological facts.

The following invariant is fundamental:

> **Presentation may derive from simulation state; presentation must not silently become simulation state.**

---

# 3. Required Preliminary Investigation

Before modifying implementation:

1. Inspect the complete repository.
2. Read all relevant documentation and status reports.
3. Identify the implementation produced by previous ecological/antics work.
4. Locate:

   * world state;
   * simulation clock;
   * ecological phase;
   * habitat model;
   * resource model;
   * agent model;
   * spatial model;
   * persistence;
   * random/seed management;
   * renderer boundary;
   * existing background/environment implementation;
   * current tests;
   * developer instrumentation.
5. Determine which abstractions already exist and extend them rather than creating competing abstractions.
6. Inspect the previous implementation report and identify any incomplete environmental, habitat, persistence, or renderer-separation work that this task depends upon.
7. Determine whether any existing background behaviour is authoritative simulation behaviour or merely rendering behaviour.
8. Establish how environmental state can be persisted without coupling the simulation to renderer-specific objects.

Do not begin implementation until the existing architecture has been understood.

Do not replace functioning architecture merely because another design appears cleaner.

---

# 4. Scope

This task covers:

### Environmental state

* water volume;
* illumination;
* flow/current;
* turbulence;
* turbidity;
* particles;
* substrate;
* structures;
* vegetation;
* environmental disturbances;
* environmental persistence;
* slow environmental evolution.

### Visual manifestation

* water depth;
* atmospheric depth;
* volumetric appearance;
* substrate;
* vegetation;
* particles;
* lighting;
* shadows/occlusion;
* environmental movement;
* spatial variation;
* subtle background activity.

### Ecological coupling

Environmental manifestation should respond to existing:

* habitats;
* resources;
* ecological activity;
* population density;
* agent activity;
* ecological phase;
* environmental state;
* historical consequences.

### Explicitly NOT in scope

Do not implement:

* complete soundscape/audio engine;
* acoustic field;
* spatial audio;
* new biological species;
* machine learning;
* OpenVDB integration;
* H3 integration;
* USD integration;
* GPU simulation;
* MLIR/SCR integration;
* large-scale renderer replacement;
* elaborate UI;
* scripted environmental scenes;
* authored cinematic sequences.

Future technologies may be documented as provider boundaries, but must not be prematurely implemented.

---

# 5. Environmental World Model

Introduce or extend a coherent environmental state representation.

The exact implementation should follow the existing repository architecture.

Conceptually:

```text
EnvironmentalState
├── water
│   ├── flow
│   ├── turbulence
│   ├── temperature
│   ├── turbidity
│   └── clarity
│
├── illumination
│   ├── intensity
│   ├── direction
│   ├── depth_penetration
│   └── temporal_phase
│
├── substrate
│   ├── composition
│   ├── stability
│   ├── disturbance
│   └── sediment
│
├── vegetation
│   ├── density
│   ├── health
│   ├── growth
│   └── movement_response
│
├── particles
│   ├── density
│   ├── distribution
│   └── drift
│
├── structures
│   ├── rocks
│   ├── caves
│   ├── debris
│   └── other habitat structures
│
├── ecological_activity
│
└── disturbance
```

Do not blindly reproduce this hierarchy if the existing model has a better representation.

The implementation should preserve semantic separation between:

1. authoritative environmental state;
2. derived environmental fields;
3. renderer projection.

---

# 6. Continuous Environmental Dynamics

The environment must not be a static collection of objects.

Introduce continuous or slowly evolving state where appropriate.

Examples:

```text
current(t)
turbulence(t)
turbidity(t)
illumination(t)
particle_distribution(t)
vegetation_motion(t)
sediment_state(t)
environmental_activity(t)
```

Different phenomena should operate at different temporal scales.

For example:

```text
Phenomenon             Typical scale

water movement         seconds
particle drift         seconds
illumination           seconds/minutes
turbulence             seconds/minutes
turbidity              minutes
sediment settling      minutes/hours
vegetation motion      seconds
vegetation growth      hours/days
vegetation recovery    hours/days
substrate alteration   days
```

These are conceptual scales, not mandatory constants.

Use the existing simulation clock and scheduling mechanisms.

Avoid updating every environmental variable at every render frame when unnecessary.

---

# 7. Environmental Hysteresis

Environmental changes should generally have inertia.

Avoid instantaneous transitions such as:

```text
stimulus appears
    ↓
environment immediately changes

stimulus disappears
    ↓
environment immediately resets
```

Instead use gradual response and decay.

Conceptually:

```text
state(t+dt) =
    state(t) + response_rate * (target(t) - state(t))
```

This applies particularly to:

* turbidity;
* disturbance;
* current intensity;
* environmental activity;
* illumination;
* sediment;
* vegetation response.

Different phenomena should have different response characteristics.

The environment should feel continuous rather than mechanically reactive.

---

# 8. Water Volume

Replace the existing empty/dark background with a visually coherent water volume.

The implementation should establish:

* depth;
* subtle spatial gradient;
* attenuation;
* scattering;
* atmospheric perspective;
* restrained volumetric appearance;
* depth-dependent visibility.

Do not simply substitute a brighter background colour.

The viewer should perceive:

> **volume of water**

rather than:

> **coloured rectangle behind fish**.

The visual treatment must remain subtle enough that agents remain the primary visible subjects.

---

# 9. Depth

Introduce meaningful depth cues.

Potential mechanisms include:

* depth-dependent illumination;
* attenuation;
* particle density;
* contrast reduction;
* subtle haze;
* foreground/background differentiation;
* shadows;
* occlusion;
* volumetric scattering.

Depth should emerge from multiple weak cues rather than one exaggerated effect.

Avoid excessive fog.

Avoid hiding the agents.

Avoid artificial depth-of-field effects unless already supported by the architecture and demonstrably useful.

---

# 10. Substrate

Introduce a restrained tank floor/substrate.

Possible semantic components:

* sand;
* sediment;
* gravel;
* rocks;
* organic matter;
* small structural irregularities.

The substrate should not look like a decorative photograph.

It exists to provide environmental structure.

Where possible, substrate should have simulation meaning.

For example:

```text
substrate
├── feeding surface
├── shelter
├── spawning region
├── disturbance response
└── habitat boundary
```

Reuse the existing habitat model.

Do not create visual habitat zones disconnected from simulation habitats.

---

# 11. Environmental Structures

Introduce subtle environmental structures where useful:

* rocks;
* cave-like regions;
* vegetation anchors;
* roots;
* debris;
* other simple habitat structures.

The geometry should be deliberately restrained.

Structures should provide:

* depth;
* occlusion;
* shelter;
* spatial landmarks;
* habitat differentiation;
* visual interest.

Do not create an elaborate aquarium scene.

The purpose is to create **affordances**, not decoration.

---

# 12. Vegetation

Implement environmental vegetation if the current architecture supports it.

Vegetation should have state rather than being purely decorative.

Conceptual properties:

```text
VegetationState
├── density
├── health
├── growth
├── location
├── habitat association
├── resource association
├── movement response
└── persistence
```

Vegetation should respond subtly to:

* water current;
* turbulence;
* ecological activity;
* environmental conditions.

Vegetation movement should be low-amplitude and continuous.

It must not look like every plant is independently playing an animation.

Prefer correlated motion driven by environmental fields.

For example:

```text
current field
      ↓
vegetation response
      ↓
coherent movement
```

rather than:

```text
plant A animation
plant B animation
plant C animation
```

---

# 13. Particle Ecology

Introduce a sparse suspended-particle layer.

Potential particles:

* sediment;
* plankton-like particles;
* organic matter;
* bubbles;
* particulate debris.

The particles should respond to environmental state.

Conceptually:

```text
particle velocity =
    environmental flow
  + turbulence
  + local variation
```

Particle density may respond to:

* turbidity;
* disturbance;
* substrate activity;
* ecological activity.

Do not fill the tank with particles.

The intended effect is:

> **the water contains something**

not:

> **the screen contains visual noise**.

---

# 14. Bubbles

If bubbles are introduced, they must remain environmental rather than becoming repetitive decorative animations.

Bubbles may be generated by:

* water movement;
* environmental structures;
* substrate;
* biological activity;
* existing simulation events.

They should vary in:

* size;
* trajectory;
* speed;
* location;
* frequency.

Avoid a fixed periodic bubble emitter.

---

# 15. Illumination

Introduce a restrained dynamic illumination model.

Potential components:

* global water illumination;
* directional light;
* depth attenuation;
* surface illumination;
* subtle volumetric shafts;
* caustic-like variation;
* occlusion/shadowing.

The desired effect is:

> **light moving through water**

rather than:

> **animated lighting effect**.

Illumination should vary slowly.

Avoid rapid brightness changes.

Avoid high-contrast cinematic lighting.

Avoid making the environment more visually dominant than the agents.

---

# 16. Caustics

If feasible within the existing renderer, implement restrained caustic-like modulation.

The effect should be:

* low contrast;
* slowly varying;
* spatially coherent;
* depth dependent;
* deterministic.

If true physical caustics are too expensive or incompatible with the current renderer, use an approximation.

The approximation must remain visually subordinate.

Do not spend disproportionate implementation effort on physically accurate caustics.

---

# 17. Environmental Activity Field

Introduce, if not already available, a derived measure of local environmental activity.

Conceptually:

```text
EnvironmentalActivity(x,y,z,t)
```

It may incorporate:

* nearby agent activity;
* feeding;
* movement;
* habitat activity;
* resource activity;
* disturbances;
* recent ecological events.

This is not an authoritative ecological variable unless justified by the simulation.

It is primarily a derived manifestation signal.

It can influence:

* particle density;
* turbidity;
* subtle vegetation response;
* visual disturbance;
* local environmental detail.

---

# 18. Historical Environmental Residue

Where existing ecological mechanics support it, environmental state should retain consequences of previous activity.

Examples:

```text
feeding
    ↓
substrate disturbance
    ↓
temporary turbidity
    ↓
sediment settles
```

Or:

```text
high vegetation activity
    ↓
vegetation damage
    ↓
reduced habitat quality
    ↓
visual environmental change
```

Or:

```text
resource depletion
    ↓
population relocation
    ↓
local activity decreases
    ↓
environment gradually changes
```

This is important.

The environment should not merely display the present.

It should sometimes reveal the **recent past** through state.

Do not fabricate historical effects merely for visual interest.

---

# 19. Environmental Succession

Where Increment 004 provides ecological succession/state changes, connect those changes to environmental manifestation.

For example:

```text
GENESIS
    ↓
sparse environment

COLONISATION
    ↓
increasing environmental structure

ESTABLISHMENT
    ↓
stable habitats

DIVERSIFICATION
    ↓
increased environmental complexity

PERTURBATION
    ↓
disturbance / temporary degradation

SUCCESSION
    ↓
environmental restructuring

REGENERATION
    ↓
recovery
```

These must remain consequences of actual simulation state.

Do not hard-code:

```text
after 10 minutes → more plants
after 20 minutes → more rocks
```

unless those transitions are explicitly part of the simulation model.

---

# 20. Environmental Signature

Create a derived environmental signature if appropriate.

Conceptually:

```text
EnvironmentalSignature

illumination
activity
turbulence
vegetation
resource_density
population_density
disturbance
turbidity
habitat_complexity
```

The signature provides a compact description of the current environmental character.

It should be useful for:

* renderer projection;
* future acoustic projection;
* instrumentation;
* testing;
* debugging;
* observer-aware manifestation.

Do not introduce the concept merely as a cosmetic "mood" system.

It must derive from actual state.

---

# 21. Slow Environmental Change

Environmental state should evolve at multiple scales.

The visual system should distinguish:

### Fast

```text
seconds:
flow
particles
plant movement
small disturbances
```

### Medium

```text
minutes:
turbidity
activity
illumination variation
sediment
```

### Slow

```text
hours/days:
vegetation growth
habitat change
resource-driven environmental changes
succession
```

This prevents the environment from feeling like a collection of animated sprites.

---

# 22. Observer Model

Respect the existing observer model.

Observer states may include:

```text
ABSENT
PRESENT
WATCHING
INTERACTING
INACTIVE
```

The observer must **not** directly control environmental events.

Do not implement:

```text
observer arrives
    ↓
increase activity
```

Instead:

```text
world continues existing
        ↓
observer arrives
        ↓
higher-resolution manifestation becomes possible
```

Observer state may control:

* rendering resolution;
* particle detail;
* environmental sampling;
* update frequency where justified;
* manifestation fidelity.

It must not author ecological reality.

---

# 23. Attention and Resolution

If practical, introduce a derived environmental attention/resolution concept.

Conceptually:

```text
EnvironmentalAttention(x,y,z)
```

Potential inputs:

* observer viewpoint;
* recent ecological activity;
* recent antic activity;
* habitat importance;
* population activity.

This may allow the renderer to allocate more detail where it is useful.

However:

> **Attention may change representation fidelity, never authoritative world state.**

Do not allow low attention to cause the simulation to stop existing.

---

# 24. Determinism

All procedural environmental generation must respect the existing deterministic seed architecture.

Given:

```text
same initial state
same seed
same simulation time
same inputs
```

the environmental state and its deterministic manifestations should be reproducible.

Do not use uncontrolled global randomness.

Do not use renderer-frame randomness that changes simulation outcomes.

If visual-only stochasticity is necessary, derive it deterministically from stable identifiers and simulation state.

---

# 25. Performance

The environment must remain compatible with the existing real-time simulation.

Avoid:

* unnecessary per-frame allocation;
* O(N²) particle interaction;
* excessive dynamic geometry;
* excessive draw calls;
* uncontrolled particle counts;
* renderer-side simulation duplication.

Use appropriate update frequencies.

Where environmental state changes slowly, cache or interpolate it.

Instrument:

```text environmental update time
render preparation time
particle count
vegetation count
environmental field evaluation cost
memory use
```

Do not optimise blindly.

Measure first.

---

# 26. Rendering Separation

Maintain the existing simulation/rendering boundary.

The environmental subsystem should conceptually expose something like:

```text
EnvironmentalState
        ↓
EnvironmentalProjection
        ↓
Renderer
```

The renderer may maintain transient resources such as:

* meshes;
* particle buffers;
* textures;
* shader state;
* GPU resources.

These are manifestations.

They are not authoritative environmental state.

A renderer restart must not destroy the environmental world.

---

# 27. No Static Wallpaper

Explicitly reject the following implementation pattern:

```text
large aquarium image
+
fish rendered over it
```

Likewise reject:

```text
static rocks
+
static plants
+
animated fish
```

unless those objects genuinely participate in the environmental model.

The environment must have **state, dynamics, spatial relationships and persistence**.

---

# 28. Visual Design Requirements

The resulting environment should satisfy:

### Non-distracting

The viewer's attention remains primarily available for the agents.

### Multi-layered

At minimum, aim for several independently meaningful layers:

1. water volume;
2. depth;
3. substrate/structure;
4. vegetation;
5. particles;
6. illumination;
7. environmental disturbance.

### Dynamic

The environment changes continuously.

### Coherent

Environmental motion should correlate with shared environmental causes.

### Spatial

Different regions should feel meaningfully different.

### Persistent

Meaningful environmental changes should survive simulation restart where the underlying simulation state supports persistence.

### Ecological

The environment should respond to ecological activity.

---

# 29. Visual Hierarchy

The final rendering should generally follow this hierarchy:

```text
1. Agents
2. Important ecological events
3. Habitat/environmental structures
4. Environmental atmosphere
5. Fine environmental detail
```

Never allow:

```text
particles
caustics
lighting
vegetation
```

to overwhelm the agents.

The background is successful when it makes the agents more believable without demanding attention.

---

# 30. Integration With Antics

Existing antics may produce environmental consequences.

For example:

```text
feeding antic
    ↓
substrate disturbance
    ↓
temporary turbidity
    ↓
particle increase
    ↓
visual manifestation
```

or:

```text
territorial conflict
    ↓
vegetation disturbance
    ↓
local movement
    ↓
environmental residue
```

The renderer should not directly interpret an antic as a canned visual effect.

Instead:

```text
Antic
  ↓
actual ecological consequence
  ↓
environmental state change
  ↓
environmental projection
```

This preserves causality.

---

# 31. Future Acoustic Boundary

Do not implement the acoustic subsystem here.

However, environmental state should be designed so that a future acoustic subsystem can consume the same information.

For example:

```text
EnvironmentalState
       │
       ├────────→ Visual Projection
       │
       └────────→ Acoustic Projection
```

Future audio may derive from:

* current;
* turbulence;
* biological activity;
* vegetation;
* substrate disturbance;
* environmental events;
* spatial activity.

Do not create dummy audio abstractions merely to claim completion.

Document the intended boundary.

---

# 32. Suggested Implementation Sequence

Use the following sequence unless repository inspection reveals a compelling reason to change it.

## 003.001 — Repository/environment audit

Document current environmental architecture and dependencies.

## 003.002 — Environmental state

Implement/extend authoritative environmental state.

## 003.003 — Water/depth field

Implement water volume, depth and attenuation.

## 003.004 — Substrate and structures

Implement restrained substrate and habitat structures.

## 003.005 — Vegetation

Implement vegetation state and environmental response.

## 003.006 — Particle ecology

Implement sparse environmental particles and drift.

## 003.007 — Illumination

Implement restrained dynamic illumination.

## 003.008 — Environmental dynamics

Implement continuous evolution and hysteresis.

## 003.009 — Ecological coupling

Connect existing ecological state/events to environmental state.

## 003.010 — Historical residue

Implement legitimate persistent environmental consequences.

## 003.011 — Environmental signature

Implement derived environmental signature if architecturally justified.

## 003.012 — Observer/resolution integration

Ensure observer state affects manifestation fidelity only.

## 003.013 — Renderer integration

Connect environmental projection to the renderer.

## 003.014 — Deterministic demonstration

Create a reproducible environmental evolution scenario.

## 003.015 — Testing and verification

Run the complete relevant test suite and add missing tests.

## 003.016 — Documentation

Document architecture, invariants, state ownership and renderer boundaries.

---

# 33. Required Tests

At minimum test:

### State

* environmental state initialises correctly;
* values remain within valid ranges;
* environmental state advances correctly;
* invalid state transitions are rejected.

### Dynamics

* water dynamics evolve;
* turbulence evolves;
* turbidity changes and decays;
* environmental disturbances decay appropriately;
* vegetation responds to current;
* particles respond to environmental flow.

### Persistence

* persistent environmental state survives restart;
* environmental state restores correctly;
* simulation continuation does not reset the environment.

### Ecological coupling

* ecological activity can affect environmental state;
* resource/habitat changes can influence environmental manifestation;
* antic consequences propagate through actual state;
* renderer does not invent ecological consequences.

### Determinism

* identical seed + identical initial state → identical environmental evolution;
* different seed → permitted environmental divergence;
* renderer frame rate does not alter authoritative environmental evolution.

### Observer

* observer presence does not create ecological activity;
* observer state may alter manifestation fidelity;
* observer state cannot directly mutate authoritative environmental state.

### Renderer boundary

* rendering cannot mutate authoritative environmental state;
* renderer recreation preserves world state;
* environmental projection can be rebuilt from authoritative state.

---

# 34. Required Invariants

The following invariants must hold:

1. **Authoritative State Invariant**
   Environmental truth belongs to the simulation, not the renderer.

2. **Determinism Invariant**
   Seeded execution is reproducible.

3. **Causality Invariant**
   Environmental consequences arise from actual simulation causes.

4. **Persistence Invariant**
   Persisted environmental state is not silently discarded.

5. **Observer Invariant**
   Observation changes manifestation, not world truth.

6. **Temporal Invariant**
   Environmental state evolves according to simulation time, not arbitrary render-frame count.

7. **Spatial Invariant**
   Environmental effects have meaningful spatial relationships.

8. **Projection Invariant**
   Renderer state is reconstructible from authoritative simulation state.

9. **Non-Dominance Invariant**
   Environmental effects must not overwhelm the agents.

10. **No-Canned-Event Invariant**
    Environmental effects must not be disguised scripted animations.

---

# 35. Required Demonstration

Create a deterministic demonstration in which:

1. the tank begins relatively sparse;
2. agents interact with the environment;
3. environmental state responds;
4. particles/vegetation/water respond;
5. a disturbance occurs;
6. the disturbance gradually decays;
7. ecological activity subsequently changes spatially;
8. the environment manifests those changes;
9. the simulation is allowed to advance;
10. the environment later exhibits a changed state.

The demonstration must be driven by the simulation.

Do not script a cinematic sequence.

The report must document:

```text
Initial conditions
Seed
Simulation rules
Environmental parameters
Observed events
Environmental consequences
Final state
```

---

# 36. Required "Leave It Running" Test

Perform a meaningful persistence test.

Run the simulation long enough for slow environmental processes to matter.

Record:

```text
simulation time
population state
habitat state
resource state
environmental state
vegetation state
particle/environmental activity
ecological phase
```

Stop the application.

Restart it.

Verify continuity.

Then advance it further.

The environment should continue from its previous state rather than resetting to its initial visual configuration.

---

# 37. Required Qualitative Evaluation

The final implementation must be evaluated not merely by unit tests.

Ask:

### Test A

Does the tank still feel like a black void with objects placed inside it?

If yes: fail.

### Test B

Does the background attract more attention than the agents?

If yes: fail.

### Test C

Does the environment change if the ecological world changes?

If no: fail.

### Test D

Does the environment change merely because the observer is present?

If yes: fail.

### Test E

Do environmental changes have visible causes?

If no: investigate.

### Test F

Does the environment continue to feel alive when no major antic is occurring?

If no: increase continuous environmental dynamics rather than adding random events.

### Test G

After leaving the simulation running, does returning later reveal genuine environmental continuity?

If no: investigate persistence/time integration.

---

# 38. Anti-Requirements

Do NOT:

* create a static aquarium wallpaper;
* add visual clutter merely to make the tank "interesting";
* use random background animation;
* create scripted environmental scenes;
* trigger environmental effects merely because the observer is watching;
* make every ecological event visually dramatic;
* make every particle interact physically;
* build a complete aquarium simulator;
* add unnecessary UI;
* introduce OpenVDB/H3/USD/GPU infrastructure prematurely;
* couple authoritative state to renderer objects;
* use uncontrolled random number generation;
* replace existing ecological abstractions without evidence;
* implement the audio system in this task;
* add fake ecological consequences solely for aesthetics.

---

# 39. Documentation Requirements

Update or create appropriate documentation describing:

1. environmental architecture;
2. authoritative environmental state;
3. environmental projection;
4. water model;
5. substrate/structure model;
6. vegetation model;
7. particle model;
8. illumination model;
9. environmental dynamics;
10. ecological coupling;
11. persistence;
12. deterministic behaviour;
13. observer interaction;
14. renderer boundary;
15. future acoustic boundary.

Include architecture diagrams where useful.

Clearly distinguish:

```text
FACT
existing implemented behaviour

DESIGN
new architectural decision

DERIVED
computed environmental state

MANIFESTATION
renderer representation

FUTURE
planned acoustic/SCR/provider integration
```

---

# 40. Completion Report

When implementation is complete, produce a detailed implementation report.

The report must include:

## Summary

What was implemented.

## Repository changes

Files created, modified and removed.

## Architecture

How environmental state relates to:

* ecological state;
* habitat;
* resources;
* agents;
* antics;
* persistence;
* renderer.

## Environmental model

Explain each environmental subsystem.

## Rendering

Explain how authoritative environmental state becomes visual manifestation.

## Determinism

Explain seed handling and reproducibility.

## Persistence

Explain what environmental state is persisted and restored.

## Testing

List:

* tests added;
* tests modified;
* tests executed;
* results.

## Performance

Provide measured or observed:

* environmental update cost;
* particle counts;
* renderer overhead;
* memory impact where available.

## Demonstration

Document the deterministic ecological/environmental demonstration.

Include:

```text
seed
initial state
simulation duration
observed environmental evolution
causal chain
final state
```

## Limitations

Explicitly document incomplete or approximate elements.

## Future work

Especially identify interfaces suitable for:

* acoustic ecology;
* spatial audio;
* OpenVDB;
* H3;
* USD;
* GPU acceleration;
* SCR environmental fields.

Do not claim those integrations exist.

---

# 41. Final Acceptance Criterion

This task is complete only when the following statement can reasonably be made:

> **The aquarium is no longer visually an empty container containing animated agents. It is a persistent environmental volume whose appearance changes as a consequence of the underlying ecological world.**

The environment should be sufficiently subtle that the viewer does not immediately think:

> "Look at all the effects."

Instead the intended response is:

> **"This place feels alive."**

The implementation should establish the foundation upon which the subsequent **Acoustic Ecology / Dynamic Soundscape** task can project sound from the same underlying environmental state.

The final architecture must therefore preserve this fundamental relationship:

```text
                 PERSISTENT WORLD
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ECOLOGICAL      ENVIRONMENTAL    HISTORY
      STATE            STATE          STATE
        │              │              │
        └──────────────┼──────────────┘
                       │
                 DERIVED FIELDS
                       │
              ┌────────┴────────┐
              │                 │
       VISUAL PROJECTION   FUTURE AUDIO
              │                 │
          RENDERER          SOUNDSCAPE
```

**Build the world first. Manifest it second. Do not reverse that relationship.**
