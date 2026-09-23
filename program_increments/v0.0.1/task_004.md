# Development Agent Instruction

## Program Increment v0.0.1 — Task 004

### Acoustic Ecology, Ambient Soundscape & Dynamic Environmental Audio

**Repository:** `https://github.com/zharia/UEWS_experiments_hyperdimensional_boids`

**Task file:** `program_increments/v0.0.1/task_004.md`

---

# 1. Mission

Upgrade the existing aquarium simulation with a **multi-layered, ambient, spatially coherent, dynamically evolving soundscape**.

The soundscape must make the simulated world feel acoustically alive without becoming distracting, repetitive, musical, or mechanically event-driven.

The primary design principle is:

> **The aquarium should have an atmosphere, not a soundtrack.**

Audio must be treated as a **projection of the simulated world's environmental and ecological state**.

The desired causal relationship is:

```text
                    AUTHORITATIVE WORLD
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     Ecological        Environmental     Historical
        State              State            State
          │                │                │
          └────────────────┼────────────────┘
                           │
                    Acoustic State
                           │
                    Acoustic Field
                           │
                    Audio Projection
                           │
                     Sound Engine
                           │
                        Output
```

The implementation must not turn the simulation into:

```text
background music
+
random sound effects
+
occasional fish noises
```

That architecture is explicitly rejected.

The intended result is a **persistent ecological soundscape** whose character changes because the underlying world changes.

---

# 2. Scope

This task covers:

* acoustic environmental state;
* continuous ambient sound;
* water acoustics;
* environmental activity;
* biological acoustic texture;
* spatial sound;
* ecological event sounds;
* antic-related acoustic manifestation;
* temporal evolution;
* acoustic persistence where appropriate;
* dynamic mixing;
* observer-aware manifestation fidelity;
* deterministic behaviour;
* audio/rendering separation;
* testing and instrumentation.

This task does **not** require:

* realistic biological acoustics;
* species-specific scientific sound modelling;
* speech;
* music;
* voice;
* complex cinematic scoring;
* machine learning;
* OpenVDB;
* H3;
* USD;
* GPU audio;
* SCR/MLIR integration;
* multiplayer/distributed audio.

Future provider boundaries may be documented but must not be prematurely implemented.

---

# 3. Preliminary Investigation

Before implementation:

1. Inspect the complete repository.
2. Read the current documentation and status reports.
3. Read the implementation report for Task 003.
4. Identify the environmental state established by Task 003.
5. Identify:

   * simulation clock;
   * ecological phase;
   * environmental state;
   * agent state;
   * habitats;
   * resources;
   * antics;
   * event history;
   * persistence;
   * deterministic RNG;
   * observer model;
   * renderer boundary;
   * existing audio implementation, if any.
6. Determine which environmental variables are already available for acoustic projection.
7. Identify any existing audio abstraction before creating another.
8. Determine whether the current runtime can support:

   * continuous audio;
   * procedural synthesis;
   * sampled sources;
   * spatialisation;
   * mixing;
   * volume/frequency filtering;
   * event scheduling.

Do not assume the repository has a particular audio framework.

Select technology based on the actual implementation environment.

Do not rewrite the simulation merely to accommodate audio.

---

# 4. Architectural Principle

Audio is a **derived manifestation**.

The authoritative world remains independent of the audio engine.

The required separation is:

```text
Simulation State
      │
      ▼
Acoustic Derivation
      │
      ▼
Acoustic State
      │
      ▼
Acoustic Projection
      │
      ▼
Audio Engine
      │
      ▼
Output Device
```

The audio engine may maintain:

* buffers;
* voices;
* mixers;
* DSP state;
* spatialisation state;
* transient audio resources.

These are not authoritative simulation state.

The simulation must remain valid if audio is disabled.

Conversely, restarting the audio subsystem must not reset the ecological world.

---

# 5. Acoustic Field

Introduce or extend an `AcousticField` abstraction.

Conceptually:

```text
AcousticField(x,y,z,t)
```

The exact representation must follow repository architecture.

The field may expose derived values such as:

```text
ambient_level
water_activity
current_activity
turbulence
biological_activity
substrate_activity
vegetation_activity
disturbance
distant_activity
local_activity
spectral_character
```

Do not interpret these as physically accurate acoustic measurements unless they actually are.

They are **semantic acoustic parameters** describing how the simulated environment should sound.

---

# 6. Acoustic State vs Acoustic Event

Maintain a strict distinction between:

### Continuous acoustic state

Examples:

* water ambience;
* current;
* distant biological activity;
* environmental hum;
* vegetation/water interaction;
* general ecological activity.

### Discrete acoustic events

Examples:

* bubble;
* substrate disturbance;
* sudden movement;
* collision;
* feeding disturbance;
* territorial interaction;
* antic manifestation.

Therefore:

```text
Continuous world
      ↓
Acoustic field

Discrete world event
      ↓
Acoustic event
```

Do not make every ecological event produce a sound.

Do not make every sound correspond to a discrete event.

---

# 7. Layered Soundscape

Implement a layered acoustic architecture.

A useful conceptual model is:

```text
Acoustic World
│
├── Layer 0 — Environmental Bed
│
├── Layer 1 — Water Dynamics
│
├── Layer 2 — Biological Texture
│
├── Layer 3 — Spatial Activity
│
├── Layer 4 — Discrete Events
│
└── Layer 5 — Significant Antics
```

Each layer must have independent controls and environmental inputs.

The layers must combine into a coherent acoustic environment.

---

# 8. Layer 0 — Environmental Bed

Create a very subtle continuous acoustic foundation.

Possible components:

* low-level water ambience;
* low-frequency environmental rumble;
* filtration-like texture if appropriate;
* extremely distant water movement;
* barely perceptible environmental noise.

This layer establishes presence.

The listener should generally not consciously notice it.

A useful test is:

> If the layer is removed, the aquarium should feel unnaturally dead; while present, it should not demand attention.

Avoid music.

Avoid obvious loops.

Avoid a recognisable soundtrack.

---

# 9. Layer 1 — Water Dynamics

Derive acoustic characteristics from environmental water state.

Inputs may include:

```text
current
turbulence
flow direction
water movement
bubble activity
turbidity
environmental disturbance
```

The soundscape should change subtly as those values change.

Conceptually:

```text
current ↑
    │
    ├── fish movement changes
    ├── vegetation movement changes
    ├── particles change
    └── water acoustic character changes
```

This is a key coupling requirement.

One environmental cause should be capable of producing multiple manifestations.

---

# 10. Layer 2 — Biological Texture

Introduce low-level biological acoustic texture.

Possible manifestations include:

* tiny clicks;
* faint pulses;
* distant biological movement;
* subtle feeding texture;
* occasional small disturbances;
* aggregate activity.

Do not attempt realistic zoological sound reproduction unless scientifically justified.

The objective is **ecological plausibility**, not taxonomic simulation.

The system should be able to produce:

```text
low activity
      ↓
sparse acoustic texture

high activity
      ↓
denser acoustic texture
```

The acoustic density should respond to actual ecological state.

---

# 11. Population-Driven Acoustic Activity

Where population information is available, derive acoustic activity from ecological state.

Potential inputs:

```text
population density
species/activity groups
feeding activity
movement density
territorial activity
social activity
reproductive activity
habitat occupancy
```

Do not directly map:

```text
10 fish = 10 sounds
```

That would be mechanical.

Instead derive aggregate activity.

For example:

```text
activity_density =
    movement contribution
  + feeding contribution
  + social contribution
  + environmental interaction
```

Then use that value to influence acoustic texture.

---

# 12. Layer 3 — Spatial Acoustic Activity

Audio must have spatial meaning.

A sound generated by an event at:

```text
x = 0.8
y = 0.4
z = 0.2
```

should not sound identical to one at another location.

At minimum support:

* left/right positioning;
* distance attenuation;
* local/global classification.

If the existing audio engine supports true 3D spatialisation, use it where appropriate.

If not, implement a lightweight spatial abstraction that can later be upgraded.

Do not force a heavyweight 3D audio engine into the project merely for this task.

---

# 13. Spatial Acoustic Field

Where practical, support spatial variation:

```text
+---------------------------+
| quiet         active      |
|                           |
|       vegetation          |
|                           |
| active          quiet     |
+---------------------------+
```

The acoustic environment should not be globally homogeneous.

For example:

* a vegetation region can have more biological activity;
* a feeding region can have local activity;
* a cave can have reduced/highly filtered activity;
* a current region can have stronger water texture.

This should derive from actual habitat/environmental state.

---

# 14. Occlusion and Environmental Filtering

Where the renderer/audio architecture allows it, introduce environmental filtering.

For example:

```text
source → vegetation → observer
```

may sound different from:

```text
source → open water → observer
```

Likewise:

```text
source → cave → observer
```

may have:

* reduced amplitude;
* altered spectral character;
* increased reverberant character.

The implementation may be approximate.

The purpose is to establish **acoustic spatiality**.

Do not pursue physically accurate underwater acoustics.

---

# 15. Layer 4 — Discrete Environmental Events

Support acoustic manifestations for selected environmental events.

Examples:

* bubble release;
* substrate disturbance;
* sudden water disturbance;
* vegetation disturbance;
* significant collision;
* feeding disturbance;
* local ecological event.

The sound must be caused by an actual event.

Do not create:

```text
every 20 seconds → play bubble.wav
```

Instead:

```text
actual environmental condition
        ↓
event
        ↓
acoustic manifestation candidate
```

---

# 16. Antic Acoustic Manifestation

Integrate with the existing Antic subsystem.

An antic may produce an acoustic manifestation.

However:

> **Antic ≠ sound effect.**

The causal chain should be:

```text
Antic
  ↓
actual ecological consequence
  ↓
environmental/ecological state change
  ↓
acoustic derivation
  ↓
sound manifestation
```

For example:

```text
fish investigates cave
        ↓
disturbs substrate
        ↓
sediment rises
        ↓
local environmental disturbance
        ↓
subtle acoustic event
```

Do not implement:

```text
ANTIC_INVESTIGATE_CAVE → PLAY_INVESTIGATION_SOUND
```

unless the sound represents an actual causal consequence.

---

# 17. Acoustic Significance

Not all sounds should have equal prominence.

Use the existing antic/event significance model where possible.

Potential factors:

```text
novelty
rarity
magnitude
participants
ecological consequence
spatial relevance
observer relevance
historical significance
```

But do not convert significance into a loudness-only mechanism.

A significant event may be:

* spatially clearer;
* longer-lived;
* spectrally distinctive;
* acoustically more prominent;

rather than simply louder.

---

# 18. Repetition Suppression

Avoid repetitive procedural audio.

The system must suppress or vary recurring manifestations.

Avoid:

```text
bubble
bubble
bubble
bubble
bubble
```

with identical timing and sound.

Variation may include:

* timing;
* amplitude;
* source position;
* duration;
* spectral characteristics;
* spatial distribution.

But variation must remain deterministic under a fixed seed.

---

# 19. No Musical Composition

Do not introduce:

* melodies;
* chord progressions;
* rhythmic loops;
* conventional background music;
* "mood music";
* soundtrack cues.

The aquarium should not have a score.

If a future design explicitly calls for music, that must be a separate architectural decision.

This task is **environmental acoustics**, not music composition.

---

# 20. Temporal Evolution

The soundscape must evolve over multiple timescales.

### Fast

```text
milliseconds/seconds
individual events
movement
bubbles
disturbances
```

### Medium

```text
seconds/minutes
activity density
water movement
biological texture
```

### Slow

```text
minutes/hours
ecological phase
population changes
resource changes
habitat changes
environmental character
```

The soundscape must not reset its character every frame.

---

# 21. Acoustic Hysteresis

Acoustic state should have inertia.

Avoid:

```text
activity begins
    ↓
sound instantly jumps to maximum

activity ends
    ↓
sound instantly stops
```

Instead use gradual transitions.

Conceptually:

```text
A(t+dt) =
    A(t) + α(target(t) - A(t))
```

Different layers may have different response rates.

The result should feel like an environment rather than a mixer responding to boolean switches.

---

# 22. Acoustic "Character"

Derive an aggregate acoustic signature from the world.

Conceptually:

```text
AcousticSignature

ambient_level
activity
water_activity
biological_activity
disturbance
spatial_density
event_density
spectral_character
```

This should be derived from simulation/environmental state.

Do not create arbitrary mood labels such as:

```text
CALM
EXCITING
SAD
DANGEROUS
```

unless they emerge from actual state.

The soundscape should **sound calm because activity is low**, not because the world was assigned a "CALM mood."

---

# 23. Diurnal and Ecological Cycles

Where Task 003 has established temporal/environmental cycles, use them.

For example:

```text
DAWN
    ↓
activity gradually increases

DAY
    ↓
stable activity

DUSK
    ↓
transition

NIGHT
    ↓
reduced/different activity
```

Species or ecological groups may have different activity patterns.

Do not simply fade the entire soundtrack down at night.

The acoustic composition should change according to actual activity.

---

# 24. Persistence

Determine which acoustic state should persist.

Generally:

### Persist

The environmental conditions from which acoustic state derives:

* environmental activity;
* ecological state;
* habitat state;
* population state;
* resource state;
* historical environmental consequences.

### Do not necessarily persist

Transient audio-engine state:

* currently playing buffer;
* active voice;
* DSP state;
* output-device state.

After restart, the soundscape should be reconstructed from authoritative state.

This is preferred over persisting arbitrary audio-engine internals.

---

# 25. Idle-Time Continuity

Respect the existing idle-time simulation model.

If the simulation advances while the observer is absent:

```text
world evolves
    ↓
environment evolves
    ↓
ecological state changes
    ↓
acoustic state changes
```

When the observer returns, audio should represent the **current world**.

Do not replay hours of historical audio.

Do not fabricate sounds for events that did not happen.

The observer returns to the present acoustic state.

---

# 26. Observer Model

Respect:

```text
ABSENT
PRESENT
WATCHING
INTERACTING
INACTIVE
```

Observer presence must not directly cause ecological audio activity.

Reject:

```text
observer arrives
    ↓
increase sound activity
```

Instead:

```text
world continues
    ↓
observer arrives
    ↓
audio manifestation becomes active
```

Observer state may alter:

* audio resolution;
* number of audible layers;
* spatialisation quality;
* detail level;
* event manifestation threshold.

It must not author the underlying events.

---

# 27. Observer Attention

If a local attention model exists, allow it to influence acoustic manifestation.

Conceptually:

```text
ObserverAttention(x,y,z)
```

can affect how strongly distant/local acoustic information is represented.

However:

> **Attention changes perception, not reality.**

The world must continue independently.

---

# 28. Audio Mixing

Implement a structured mixer.

Conceptually:

```text
                         MASTER
                           │
              ┌────────────┼────────────┐
              │            │            │
          ENVIRONMENT    BIOLOGY      EVENTS
              │            │            │
        ┌─────┼─────┐      │            │
        │     │     │      │            │
       water current bubbles organisms antics
```

Each layer should have:

* independent gain;
* environmental control;
* spatial control where applicable;
* temporal smoothing;
* enable/disable capability for testing.

The master output must remain restrained.

Avoid excessive dynamic range.

Avoid sudden loud events.

---

# 29. Loudness and Non-Distracting Behaviour

The default soundscape should be quiet enough for extended listening.

A user should be able to leave the simulation running for hours without the sound becoming irritating.

Avoid:

* sudden loudness;
* repetitive high-frequency clicks;
* constant event sounds;
* aggressive stereo movement;
* dramatic volume ramps.

The desired acoustic hierarchy is:

```text
ambient environment
        ↓
continuous ecological texture
        ↓
local events
        ↓
rare significant events
```

Not:

```text
events
events
events
events
```

---

# 30. Sampled vs Procedural Audio

Use a hybrid strategy where appropriate.

### Procedural

Potentially useful for:

* low-level water texture;
* noise beds;
* turbulence;
* subtle environmental modulation.

### Sampled

Potentially useful for:

* bubbles;
* biological textures;
* substrate disturbances;
* special environmental events.

### Hybrid

Use simulation-controlled modulation of sampled/procedural sources.

Do not introduce a large sound library without need.

Prefer a small number of flexible sources over dozens of bespoke sound files.

---

# 31. Sound Variation

Repeated sounds must vary naturally.

Variation may include:

```text
amplitude
duration
pitch
spectral filtering
spatial position
timing
layer density
```

The variation must remain within a coherent acoustic identity.

Do not make random variation so large that the environment sounds chaotic.

---

# 32. Determinism

All simulation-affecting acoustic decisions must respect deterministic execution.

Given:

```text
same seed
same initial state
same simulation time
same inputs
```

the derived acoustic state should be reproducible.

If audio-engine-level stochasticity is required, derive it from deterministic seeds.

Avoid global uncontrolled randomness.

Audio playback timing must not alter simulation state.

---

# 33. Audio Must Never Affect Authoritative Simulation

Unless explicitly introduced in a future simulation design, audio is one-way:

```text
simulation → audio
```

not:

```text
simulation ↔ audio
```

The following are prohibited:

```text
sound played
    ↓
fish behaviour changes
```

unless the simulation itself explicitly models acoustic perception.

Likewise:

```text
audio buffer underrun
    ↓
simulation state changes
```

must never happen.

Audio failure must degrade presentation only.

---

# 34. Future Acoustic Perception

Document, but do not implement unless already present, a future possibility:

```text
Environmental acoustic field
          ↓
agent perception
          ↓
behaviour
```

This would allow creatures to respond to sound.

That is a potentially important future ecological capability, but it is **not required for Task 004**.

Do not accidentally create it while implementing output audio.

---

# 35. Spatial Audio Abstraction

Create a clean abstraction separating:

```text
Acoustic Source
Acoustic Event
Acoustic Field
Spatialisation
Audio Engine
```

Conceptually:

```text
AcousticEvent
├── source
├── location
├── intensity
├── duration
├── spectral_character
├── ecological_context
└── significance
```

The exact API should follow repository conventions.

Avoid overengineering.

The abstraction exists so that future audio providers can be substituted.

---

# 36. Performance

The soundscape must operate without materially degrading simulation performance.

Measure:

* acoustic-state update time;
* active voices;
* mixer overhead;
* procedural synthesis cost;
* event scheduling cost;
* memory usage;
* spatialisation cost.

Avoid creating one audio voice per agent.

Prefer aggregate acoustic texture for populations.

Use spatial/event voices selectively.

---

# 37. Required Instrumentation

Developer/debug mode should expose:

```text
simulation time
acoustic state
ambient level
water activity
biological activity
disturbance
active acoustic sources
active event sounds
active antic manifestations
spatial source count
audio update cost
```

A debug representation should make it possible to answer:

> "Why am I hearing this?"

with a causal chain.

For example:

```text
Acoustic Event #182
    ↓
Cause: feeding interaction #94
    ↓
Location: habitat/open-water/...
    ↓
Environmental effect: substrate disturbance
    ↓
Acoustic manifestation: low-level disturbance
```

This is extremely valuable for debugging emergent behaviour.

---

# 38. Required Causal Trace

Where feasible, acoustic events should retain a reference to their cause.

Conceptually:

```text
AcousticEvent
├── event_id
├── simulation_time
├── source
├── location
├── cause
├── ecological_context
└── manifestation_parameters
```

The cause should reference existing event/antic identifiers where available.

Do not duplicate the event system.

Reference it.

---

# 39. Testing

Implement tests covering:

## Acoustic state

* valid initialisation;
* valid state ranges;
* state evolution;
* temporal smoothing;
* deterministic derivation.

## Environmental coupling

* water activity affects acoustic state;
* environmental activity affects acoustic texture;
* biological activity affects acoustic state;
* habitat differences produce permitted acoustic differences;
* disturbance affects acoustic manifestation.

## Events

* actual environmental events can produce acoustic candidates;
* non-events do not generate fabricated acoustic events;
* event causes remain traceable;
* repeated events are appropriately suppressed/varied.

## Antics

* significant antics may produce acoustic manifestations;
* antic sounds correspond to actual consequences;
* antic manifestation does not invent ecological state.

## Spatial

* source positions affect spatial output;
* distance attenuation works;
* environmental filtering works where implemented.

## Temporal

* acoustic state follows simulation time;
* frame rate does not change authoritative acoustic state;
* idle-time continuation reconstructs current acoustic state.

## Observer

* observer arrival does not create sound-producing events;
* observer state may affect manifestation fidelity;
* observer state does not mutate authoritative state.

## Persistence

* world state survives restart;
* acoustic state can be reconstructed from world state;
* audio engine restart does not reset simulation.

---

# 40. Required Invariants

Maintain these invariants:

### 1. World Authority

The simulation is the source of truth.

### 2. Projection

Audio is derived from world state.

### 3. Causality

Discrete sounds correspond to actual causes.

### 4. Determinism

Seeded execution is reproducible.

### 5. Temporal Integrity

Audio follows simulation time, not render-frame count.

### 6. Spatial Integrity

Acoustic events retain meaningful spatial context.

### 7. Observer Integrity

Observation does not manufacture ecological events.

### 8. Persistence

The soundscape can be reconstructed from persisted world state.

### 9. Non-Dominance

The acoustic environment does not overwhelm the visual/interactive experience.

### 10. Independence

Audio failure cannot corrupt the simulation.

### 11. No-Soundtrack

The system is environmental acoustics, not a conventional musical score.

### 12. No-Canned-Events

Sound is not used as a substitute for ecological causality.

---

# 41. Required Demonstration

Create a deterministic demonstration showing:

```text
initial environment
        ↓
low activity acoustic state
        ↓
ecological activity increases
        ↓
environment changes
        ↓
acoustic texture changes
        ↓
local ecological event occurs
        ↓
spatial acoustic manifestation
        ↓
activity declines
        ↓
soundscape gradually settles
```

The demonstration must not be a scripted sound sequence.

Document:

```text
seed
initial state
simulation rules
events
environmental changes
acoustic changes
causal relationships
final state
```

---

# 42. Required Long-Duration Demonstration

Run the simulation for a meaningful period.

Observe:

* short-term sound variation;
* medium-term soundscape changes;
* environmental changes;
* population activity;
* ecological phase;
* persistence.

Then stop and restart.

Verify that the soundscape reconstructs itself from the current world state.

It must not replay the previous session's sounds.

---

# 43. Qualitative Evaluation

The implementation must be evaluated acoustically as well as through automated tests.

### Test A — Dead World

Disable all ecological activity.

Question:

> Does the environmental bed still make the tank feel physically present?

If no, strengthen environmental ambience rather than adding event sounds.

### Test B — Too Busy

Run normal simulation.

Question:

> Does the listener start consciously tracking individual sounds?

If yes, reduce event density and increase aggregation.

### Test C — Repetition

Listen for an extended period.

Question:

> Can repeated sound patterns become obvious or irritating?

If yes, improve temporal/spatial variation or reduce event frequency.

### Test D — Causality

When an obvious ecological event occurs:

> Is there a plausible acoustic consequence?

If no, investigate the environmental/acoustic coupling.

### Test E — Observer Independence

Leave the simulation alone.

Question:

> Does the world continue producing a coherent acoustic state without the observer?

If no, investigate idle-time and observer handling.

### Test F — Return

Leave the simulation running or allow idle-time progression.

Return later.

Question:

> Does the acoustic environment reflect the changed world?

If no, investigate persistence and temporal integration.

---

# 44. Anti-Requirements

Do NOT:

* add conventional background music;
* add a soundtrack;
* create scripted daily audio sequences;
* play random sound effects at fixed intervals;
* attach a unique sound to every fish;
* make every antic produce a sound;
* make every event loud;
* use sound to manufacture ecological events;
* let observer presence create events;
* reset the soundscape on restart;
* use uncontrolled randomness;
* make audio influence simulation state;
* create a large asset library without architectural justification;
* overuse stereo movement;
* make the soundscape louder merely to make it "noticeable";
* implement acoustic perception by agents unless already part of the model;
* introduce OpenVDB/H3/USD/GPU/SCR infrastructure prematurely.

---

# 45. Future Provider Boundary

Document the intended future architecture:

```text
                 Acoustic State
                       │
                 Acoustic Field
                       │
              Acoustic Projection
                       │
          ┌────────────┼────────────┐
          │            │            │
      Native Audio   Procedural   External
        Provider       Provider     Provider
```

The current implementation should not make future provider replacement unnecessarily difficult.

Potential future integrations may include:

* spatial audio providers;
* procedural synthesis;
* higher-order spatialisation;
* GPU audio;
* SCR acoustic fields;
* agent acoustic perception.

These are future concerns.

---

# 46. Suggested Implementation Sequence

Unless repository inspection reveals a better ordering:

## 004.001 — Repository/audio audit

Understand current architecture and Task 003 output.

## 004.002 — Acoustic state model

Implement the authoritative/derived acoustic representation.

## 004.003 — Acoustic field

Implement spatial/temporal acoustic derivation.

## 004.004 — Environmental bed

Implement subtle continuous environmental ambience.

## 004.005 — Water acoustics

Connect current/turbulence/environmental water state.

## 004.006 — Biological texture

Connect population/ecological activity.

## 004.007 — Spatial acoustic sources

Implement location and attenuation.

## 004.008 — Environmental event acoustics

Implement causally derived discrete events.

## 004.009 — Antic acoustic manifestation

Connect significant existing antics through actual consequences.

## 004.010 — Acoustic hysteresis

Implement temporal smoothing and decay.

## 004.011 — Temporal/ecological evolution

Connect acoustic character to environmental/ecological cycles.

## 004.012 — Persistence/idle-time

Reconstruct acoustic state from the persistent world.

## 004.013 — Observer integration

Implement manifestation-resolution behaviour.

## 004.014 — Mixing

Implement layered acoustic mixing and gain management.

## 004.015 — Instrumentation

Expose acoustic state and causal traces.

## 004.016 — Deterministic demonstration

Create and document emergent acoustic evolution.

## 004.017 — Tests/verification

Run complete test suite and add missing tests.

## 004.018 — Documentation/cleanup

Complete architectural documentation.

---

# 47. Completion Report

Produce a detailed implementation report containing:

## Summary

What was implemented.

## Architecture

Explain:

```text
world
 ↓
environment
 ↓
acoustic field
 ↓
audio projection
 ↓
audio engine
```

## Acoustic layers

Describe every implemented layer.

## Environmental coupling

Document which environmental variables affect audio.

## Ecological coupling

Document how population/activity/events influence sound.

## Spatialisation

Document spatial capabilities and limitations.

## Antics

Document how antic consequences become acoustic manifestations.

## Temporal behaviour

Document fast, medium and slow acoustic evolution.

## Persistence

Document what is reconstructed and what is transient.

## Observer

Document observer-related manifestation behaviour.

## Determinism

Document seed handling.

## Testing

List all tests and their results.

## Performance

Document measured audio overhead.

## Demonstration

Document:

```text
seed
initial state
simulation duration
causal chain
acoustic evolution
final state
```

## Limitations

Explicitly identify approximations.

## Future work

Identify suitable future work for:

* acoustic perception;
* advanced spatial audio;
* procedural synthesis;
* OpenVDB/H3 spatial fields;
* SCR integration;
* GPU audio.

---

# 48. Final Acceptance Criterion

Task 004 is complete only when the aquarium's soundscape can reasonably be described as:

> **A quiet, persistent acoustic environment whose character emerges from the physical, ecological and historical state of the simulated world.**

It must not sound like:

> "a program playing aquarium sound effects."

It should instead feel like:

> **the sound of a place that happens to contain living things.**

The ultimate architecture should therefore be:

```text
                         WORLD
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      ECOLOGY         ENVIRONMENT        HISTORY
          │                │                │
          └────────────────┼────────────────┘
                           │
                   DERIVED FIELDS
                           │
             ┌─────────────┴─────────────┐
             │                           │
        VISUAL FIELD                ACOUSTIC FIELD
             │                           │
        visual projection          audio projection
             │                           │
          RENDERER                  SOUND ENGINE
```

The same world should therefore produce both its **visible atmosphere** and its **audible atmosphere**.

The implementation succeeds when these two manifestations feel as though they belong to the **same place**, rather than being two independent effects systems.
