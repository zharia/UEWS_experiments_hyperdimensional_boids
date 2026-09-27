# Task 004 Completion Report: Acoustic Ecology, Ambient Soundscape & Dynamic Environmental Audio

**Program Increment:** `v0.0.1`  
**Task:** `004`  
**Repository:** `https://github.com/zharia/UEWS_experiments_hyperdimensional_boids`  
**Implementation Date:** September 2026  
**Status:** Completed & Validated

---

## 1. Summary

Task 004 introduced a multi-layered, ambient, spatially coherent, and dynamically evolving soundscape into the artificial aquarium ecosystem. In accordance with the core design axiom—*"The aquarium should have an atmosphere, not a soundtrack"*—audio is modelled strictly as a one-way mathematical projection of the simulated world's authoritative physical, ecological, and historical state.

The system replaces arbitrary background music and canned sound effects with an emergent 6-layer acoustic ecology that reflects water dynamics, population densities, metabolic feeding frenzies, benthic disturbances, and verified antic consequences.

---

## 2. Architecture & Causal Flow

The implementation follows a strict separation of concerns where presentation derives from simulation truth, but never mutates it:

```text
                     AUTHORITATIVE WORLD
                            │
           ┌────────────────┼────────────────┐
           │                │                │
      ECOLOGICAL       ENVIRONMENTAL    HISTORICAL
        STATE              STATE           STATE
    (Populations,     (Water, Flow,    (Event Ledger,
      Habitats)        Substrate)         Antics)
           │                │                │
           └────────────────┼────────────────┘
                            │
                     Acoustic Derivation
                     (AcousticDerivation.ts)
                            │
                     Acoustic State & Field
                     (AcousticState.ts, AcousticField.ts)
                            │
                     Acoustic Projection
                     (AcousticProjection.ts)
                     [Observer Model: Gaze & Attention]
                            │
                      Sound Engine
                     (AcousticSoundscapeEngine.ts, aquariumAudio.ts)
                            │
                      Output Device
                     (Web Audio API Destination)
```

1. **Authoritative World:** Evaluates fluid dynamics, agent steering, metabolic hunger/energy, antic execution, and ecological phase progression.
2. **Acoustic Derivation (`AcousticDerivation.ts`):** Evaluates authoritative parameters, applies repetition suppression cooldowns, calculates deterministic parametric variance, and attaches historical causal traces.
3. **Acoustic Field (`AcousticField.ts`):** Maintains 3D spatial field properties, calculates habitat-specific damping/occlusion, and manages multi-scalar temporal hysteresis.
4. **Acoustic Projection (`AcousticProjection.ts`):** Translates acoustic state into gain and filter levels based on observer presence (`ABSENT`, `WATCHING`, `INTERACTING`, `INACTIVE`) and focal gaze.
5. **Sound Engine (`AcousticSoundscapeEngine.ts`):** Web Audio procedural synthesis and spatial stereo panner nodes, completely synthetic with zero external audio assets.

---

## 3. Acoustic Layers

| Layer | Name | Source & Synthesis Method | Dynamic Inputs |
| :--- | :--- | :--- | :--- |
| **Layer 0** | Environmental Bed | Filtered continuous pink noise with resonant lowpass filter (110Hz). Unobtrusive baseline room tone establishing physical presence. | Tank fluid enclosure, ambient baseline level. |
| **Layer 1** | Water Dynamics | Modulated bandpass filtered noise (340Hz) + procedural micro-bubble generator. | Bulk fluid flow vector (`flow.x/y/z`), dimensionless turbulence intensity, airstone bubble rate. |
| **Layer 2** | Biological Texture | Soft, high-frequency organic micro-impulses (radula grazing, fin-flick hydrodynamic whooshes). | Aggregate population biomass, live agent count, schooling velocity. |
| **Layer 3** | Spatial Audio | Stereo panning (`StereoPannerNode`), inverse distance attenuation, and depth-dependent high-frequency roll-off. | 3D Cartesian coordinates (`x, y, z`) relative to front camera listener position `(0, 0, 18)`. |
| **Layer 4** | Discrete Environmental Events | Synthesized water droplets, feeding pops, benthic settling thuds, mechanical shockwaves. | Authoritative events from `EcologicalEventLedger` (`FEEDING`, `PERTURBATION`, `DEATH`). |
| **Layer 5** | Significant Antics | Dual-tone harmonic shimmers, territorial alert snaps, foraging sediment puffs. | Verified active antics from `AnticScheduler` carrying physical/ecological consequences. |

---

## 4. Environmental & Ecological Coupling

- **Water Flow & Turbulence:** Convective flow velocity directly modulates Layer 1 bandpass gain and central filter frequency. Micro-turbulence dynamically scales bubble release frequency from 300ms to 1800ms intervals.
- **Substrate & Detritus:** Mechanical substrate disturbance and sediment layer thickness elevate benthic rumble intensity and drop high-frequency spectral cutoff.
- **Vegetation Biomass:** Canopy density provides acoustic absorption, reducing reverberance and shifting biological activity into rustling textures.
- **Population Density & Biomass:** Total biomass across teleost cohorts drives Layer 2 micro-impulse density, creating an aggregate ecological hum without rendering one audio voice per fish.
- **Circadian Cycle:** Illumination phase modulates spectral brightness; daytime features brighter surface activity, while nocturnal phases feature deeper benthic resonance and subdued biological texture.

---

## 5. Spatialisation & Occlusion

- **Stereo Positioning:** Source `x` coordinates are mapped linearly to stereo panning across `[-0.85, +0.85]`, providing natural spatial positioning across the 28-unit wide aquarium without jarring hard pans.
- **Distance Attenuation:** Implements clamped inverse distance roll-off:
  $$\text{Gain}(r) = \frac{1}{1 + 0.08 \cdot \max(0, r - 14.0)}$$
- **Depth & Benthic Occlusion:** Sounds originating deep within the tank ($z < 0$) or against the gravel bed ($y < -5.5$) undergo lowpass filtering down to 350Hz–1200Hz, simulating acoustic water column damping.
- **Habitat Zoning:**
  - `SURFACE`: High clarity, reduced reverberation.
  - `OPEN_WATER`: Balanced baseline transmission.
  - `VEGETATION`: High acoustic absorption, increased local biological density.
  - `BENTHIC_SUBSTRATE`: Heavy ground damping and reverberant reflections.

---

## 6. Antic Acoustic Manifestations & Causality

Antics do not trigger canned sound effects. Instead, antics produce discrete acoustic manifestations only when they carry verified physical or ecological consequences:
- Courtship rituals produce subtle harmonic vibrations.
- Foraging and substrate investigation produce sediment rustles and micro-thuds.
- Territorial chases produce hydrodynamic displacement whooshes.

Every discrete acoustic event retains an explicit reference to its cause (`eventId`, `anticId`, description), queryable via the **Acoustic Soundscape Inspector HUD** under the *"Why am I hearing this?"* section.

---

## 7. Temporal Behaviour & Hysteresis

To prevent unnatural volume jumps or mechanical switching, the acoustic field employs multi-scalar exponential hysteresis:
$$A(t + \Delta t) = A(t) + \left(1 - e^{-\Delta t / \tau}\right) \cdot (A_{\text{target}} - A(t))$$

- **Fast Scale ($\tau = 0.35\text{s}$):** Mechanical shocks, water surface ripples, perturbations.
- **Medium Scale ($\tau = 2.2\text{s}$):** Water flow changes, feeding activity density, substrate settling.
- **Slow Scale ($\tau = 12.0\text{s}$):** Baseline ambient bed, vegetation growth, diurnal transitions.

---

## 8. Persistence & Idle-Time Continuity

- **Authoritative Persistence:** World state snapshots serialize physical environmental variables, population counts, and historical ledgers. Transient audio-engine buffers, oscillator voices, and DSP nodes are deliberately omitted from persistence.
- **Reconstruction:** On world state load or page reload, the soundscape is immediately reconstructed from the restored authoritative world state.
- **Idle-Time Handling:** During idle catch-up intervals, simulation time and ecological state advance authoritatively. Upon the observer's return, the soundscape reflects the *current* world state without back-playing hours of accumulated historical audio.

---

## 9. Observer Model & Non-Dominance

- **Observer Integrity:** Observer transitions (`ABSENT`, `PRESENT`, `WATCHING`, `INTERACTING`, `INACTIVE`) modulate manifestation fidelity and master gain, but **never** author ecological events.
- **Observer Attention:** When an organism is inspected, focal attention biases distance attenuation to subtly emphasize local sounds near the inspected creature.
- **Extended Listening Restraint:** The master bus includes a dynamics compressor (-24dB threshold, 6:1 ratio) and lowpass smoothing (3200Hz) to ensure hours of fatigue-free background listening.

---

## 10. Automated Test Results

The full test suite passed with 100% success across 10 test suites and 56 unit/integration tests:

```text
✓ tests/acoustic_ecology.test.ts      (16 tests)  131ms
✓ tests/increment_004.test.ts         (5 tests)    74ms
✓ tests/task_003_environment.test.ts  (8 tests)    62ms
✓ tests/simulation.test.ts            (3 tests)    66ms
✓ tests/persistence.test.ts           (3 tests)    48ms
✓ tests/antics.test.ts                (4 tests)    16ms
✓ tests/environment.test.ts           (4 tests)    11ms
✓ tests/agent.test.ts                 (5 tests)     9ms
✓ tests/behaviour.test.ts             (4 tests)     7ms
✓ tests/phases.test.ts                (4 tests)     6ms

Test Files  10 passed (10)
Tests       56 passed (56)
Duration    3.20s
```

---

## 11. Deterministic Demonstration Summary

The deterministic demonstration (`runDeterministicAcousticDemonstration(4242)`) executed across 50 simulation seconds:

1. **Step 1 (t = 5s, Initial Calm):** Ambient bed presence at 0.22, baseline water flow 0.20, zero disturbance.
2. **Step 2 (t = 15s, Ecological Ramp):** External food pellet introduced; biological activity rises from 0.18 to 0.42; discrete feeding clicks register in the causal ledger.
3. **Step 3 (t = 20s, Environmental Perturbation):** 0.85 strength perturbation triggers hydrodynamic shockwave; disturbance registers at 0.85; substrate disturbance thud triggers with causal trace to `PERTURBATION` event.
4. **Step 4 (t = 50s, Settling Down):** Disturbance decays back to 0.00; water turbulence and flow settle; continuous acoustic field returns smoothly to equilibrium.

---

## 12. Limitations & Future Work

- **Current Approximations:** Sound propagation utilizes analytical geometric distance attenuation and biquad lowpass filtering rather than full wave equation boundary solvers or volumetric ray tracing.
- **Future Work:**
  - Agent acoustic perception (bi-directional ecological acoustics allowing prey to evade predator snap sounds).
  - Web Audio 3D HRTF listener orientation integration with Three.js camera rotation vectors.
  - Procedural fluid acoustic boundary synthesis using GPU compute shaders.
