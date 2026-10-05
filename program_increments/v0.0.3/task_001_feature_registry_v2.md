# Development Instruction: Feature Registry v2 — Rich Procedural Environment Architecture

**Repository**

`https://github.com/zharia/UEWS_experiments_hyperdimensional_boids`

**Target**

`program_increments/v0.0.3/`

**Suggested instruction filename**

`program_increments/v0.0.3/task_001_feature_registry_v2.md`

---

# 1. Mission

Extend the existing `LandscapeFeatureRegistry` into a substantially richer semantic environmental system capable of producing a varied, coherent, deterministic and evolving aquarium world.

The objective is **not** merely to increase the number of rocks, reefs or plants.

The objective is to establish a reusable environmental vocabulary and generation architecture in which:

- geological structures create environmental context;
- structural features create shelter and spatial complexity;
- substrate types influence biological placement;
- biological colonies and vegetation occupy suitable environments;
- ecological regions emerge from combinations of environmental conditions;
- dynamic phenomena influence the environment;
- features have explicit relationships;
- features participate in the existing 4D landscape model;
- the renderer remains a projection of authoritative state;
- procedural generation is deterministic;
- generated environments can be reproduced from a seed;
- future AI-assisted world generation can produce structured specifications without becoming part of the simulation runtime.

The resulting environment should feel **ecologically and geometrically rich**, rather than like a collection of independently animated decorative objects.

---

# 2. Important architectural principle

The current architecture established by Tasks 007A and 007B is authoritative.

Do not regress it.

The following principles are mandatory:

```text
4D Landscape / Feature State
        ↓
Authoritative Evaluation
        ↓
Projection
        ↓
Renderer
```

The renderer is not authoritative.

Likewise:

```text
Seed / Scenario Specification
        ↓
Deterministic Feature Generation
        ↓
Feature Registry
        ↓
Authoritative Feature State
        ↓
Landscape / Ecology / Boids / Soundscape / Renderer
```

Do **not** introduce a design in which Gemini, an LLM, the renderer or random runtime behaviour becomes authoritative.

---

# 3. Context: current architecture

Before modifying anything, inspect the repository and understand the existing implementation of:

- `LandscapeFeature.ts`
- `LandscapeFeatureRegistry.ts`
- `LandscapeEvolutionSystem.ts`
- `LandscapeGeometry.ts`
- `LandscapeProjection.ts`
- `LandscapeTopology.ts`
- `aquariumScene.ts`
- `coralGeometries.ts`
- existing landscape tests
- Task 007A report
- Task 007B report
- all current Program Increment documentation.

Do not trust previous reports blindly.

Verify the implementation.

The current system already supports:

- 4D landscape state;
- explicit `w` evaluation;
- deterministic feature identities;
- feature projection;
- terrain deformation;
- rocks;
- reef structures;
- flora anchors;
- geological formations;
- semantic topology;
- renderer-independent feature evaluation;
- temporal isolation.

Preserve these capabilities.

---

# 4. Problem with the current registry

The existing registry is still too close to:

```text
rock
rock
rock
rock
reef
reef
flora
flora
formation
formation
```

That is an object catalogue.

The new system must become an **environmental semantic model**.

The registry should be able to express:

```text
geology
    ↓
geomorphology
    ↓
substrate
    ↓
structures
    ↓
habitat
    ↓
biological colonies
    ↓
ecological zones
    ↓
dynamic phenomena
    ↓
organism behaviour
```

This does not mean every relationship must be fully simulated in this task.

It means the architecture must make these relationships representable and testable.

---

# 5. New environmental taxonomy

Introduce a formal distinction between feature **domain** and feature **kind**.

For example:

```ts
FeatureDomain =
    | "geology"
    | "geomorphology"
    | "substrate"
    | "structure"
    | "habitat"
    | "vegetation"
    | "colony"
    | "ecological"
    | "phenomenon";
```

Feature kinds should include, at minimum, concepts equivalent to:

### Geology

- formation
- strata
- shelf
- basin
- trench
- ridge
- escarpment
- plateau
- channel
- gully
- sediment_fan
- deposit

### Structure

- rock
- boulder
- slab
- pillar
- pinnacle
- outcrop
- arch
- overhang
- cavern
- rubble_field
- reef
- reef_wall
- reef_mound
- reef_ridge

### Substrate

- sand
- gravel
- silt
- mud
- exposed_rock
- shell_bed
- organic_detritus

### Biological / vegetation

- coral_colony
- sponge_colony
- kelp_forest
- seagrass_meadow
- algae_bed
- anemone_field
- microbial_mat

### Habitat / ecology

- shelter_zone
- nursery_zone
- feeding_ground
- spawning_ground
- cleaning_station
- territorial_zone

### Dynamic phenomena

- current
- upwelling
- sediment_plume
- particulate_bloom
- bubble_field
- thermal_vent
- disturbance_zone

Do not implement every type as a fully bespoke renderer.

Some feature types should be semantic fields or regions rather than visible meshes.

---

# 6. Feature abstraction

Evolve the existing feature interface rather than replacing it.

The conceptual model should support:

```ts
interface ILandscapeFeature {

    id: string;

    domain: FeatureDomain;

    kind: FeatureKind;

    name?: string;

    position4D: Vector4;

    scale4D: Vector4;

    wRange: WRange;

    morphology?: MorphologyDescriptor;

    material?: MaterialDescriptor;

    spatialInfluence?: SpatialInfluence;

    temporalInfluence?: TemporalInfluence;

    environmentalPreferences?: EnvironmentalPreferences;

    substrateRequirements?: SubstrateRequirements;

    relationships: FeatureRelationship[];

    topologyRelations: TopologyRelation[];

    evaluate(
        w: number,
        context: FeatureEvaluationContext
    ): FeatureEvaluation;
}
```

The exact TypeScript design is up to the implementation agent.

Do not mechanically copy this interface.

Adapt it to the existing architecture.

---

# 7. Separate semantic feature state from rendering

A feature must not be defined by its mesh.

For example:

```text
ROCK_017
```

is a semantic object.

Its projection may become:

```text
mesh
position
scale
rotation
material
```

But the semantic feature itself should contain information such as:

```text
morphology
substrate relationship
4D position
4D scale
exposure
burial
roughness
elongation
flattening
environmental affinity
relationships
```

This allows the same semantic feature to support:

- rendering;
- ecology;
- boid navigation;
- shelter calculations;
- soundscape generation;
- future simulation;
- future alternative renderers.

---

# 8. Morphology descriptors

Introduce reusable morphology descriptors.

For structures such as rocks, support parameters conceptually equivalent to:

```ts
interface MorphologyDescriptor {
    archetype: string;

    elongation?: number;
    flattening?: number;
    roughness?: number;
    asymmetry?: number;

    orientation?: Vector3;

    scaleVariance?: number;

    surfaceComplexity?: number;
}
```

Possible rock archetypes:

```text
rounded
angular
slab
shard
pillar
pinnacle
boulder
plate
outcrop
fragment
```

Do not create separate classes for every morphology unless there is a strong architectural reason.

Prefer parameterized morphology.

---

# 9. Rock populations

Do not simply expand the registry from 5 rocks to 500 individually hand-authored rocks.

Introduce a concept equivalent to:

```text
FeaturePopulation
```

A population should describe:

```text
archetype
density
spatial domain
size distribution
orientation distribution
morphology distribution
seed
substrate affinity
cluster behaviour
w-domain
```

For example:

```text
ROCK_FIELD_WEST_01

    archetypes:
        rounded
        angular
        slab
        rubble

    density:
        variable

    clustering:
        moderate

    substrate:
        exposed_rock
        sand

    temporal behaviour:
        slow
```

The population generator then produces deterministic feature instances.

---

# 10. Feature generators

Introduce a general generation abstraction.

Conceptually:

```ts
interface FeatureGenerator<T> {

    generate(
        context: GenerationContext
    ): T[];
}
```

Possible generators:

```text
GeologyGenerator
GeomorphologyGenerator
SubstrateGenerator
RockFieldGenerator
ReefGenerator
CoralColonyGenerator
VegetationGenerator
HabitatGenerator
PhenomenonGenerator
```

Do not over-engineer the first implementation.

The architecture should permit additional generators without modifying the core registry.

---

# 11. Deterministic generation

All procedural generation MUST be deterministic.

Given:

```text
world seed
+
generator identity
+
feature identity
+
spatial region
```

the same environment must be reproduced.

Avoid:

```ts
Math.random()
```

for authoritative generation.

Use the project's existing deterministic/random infrastructure if one exists.

If none exists, introduce a small deterministic seeded mechanism.

Do not introduce a large external procedural-generation dependency.

---

# 12. Spatial hierarchy

Introduce a conceptual hierarchy.

The exact implementation may differ, but the model should support:

```text
WORLD
 ├── REGION
 │    ├── ZONE
 │    │    ├── CLUSTER
 │    │    │    └── FEATURE
```

Example:

```text
WORLD
 ├── WEST_SHELF
 │    ├── REEF_ZONE_01
 │    │    ├── ROCK_CLUSTER_04
 │    │    ├── CORAL_COLONY_12
 │    │    └── KELP_PATCH_03
 │    │
 │    └── SAND_CHANNEL_02
 │
 └── CENTRAL_TRENCH
      ├── VENT_ZONE_01
      └── ROCK_FIELD_02
```

This hierarchy must not become a second spatial coordinate system.

The existing 4D coordinate model remains authoritative.

The hierarchy is semantic organization and generation locality.

---

# 13. Feature relationship graph

Extend the existing topology relationship concept into a general feature relationship graph.

Support relationship categories equivalent to:

```text
embedded-in
attached-to
rooted-in
supported-by
sheltered-by
inside
near
associated-with
derived-from
feeds-from
grows-on
surrounds
connects-to
```

Example:

```text
ROCK_014
    embedded-in
        RIDGE_003

CORAL_COLONY_021
    attached-to
        ROCK_014

KELP_FOREST_002
    rooted-in
        SUBSTRATE_008

NURSERY_004
    sheltered-by
        REEF_007

FEEDING_GROUND_002
    associated-with
        UPWELLING_003
```

Do not confuse this relationship graph with geometric mesh topology.

Maintain the distinction:

```text
semantic topology
≠
geometric topology
≠
render topology
```

---

# 14. Environmental suitability

Introduce environmental preference descriptors.

Features should be capable of expressing constraints/preferences such as:

```text
depth range
slope range
substrate affinity
light availability
current affinity
temperature range
salinity range
nutrient availability
exposure
```

Conceptually:

```ts
interface EnvironmentalPreferences {
    depth?: Range;
    slope?: Range;

    substrateAffinity?: Record<string, number>;

    light?: Range;

    current?: Range;

    temperature?: Range;

    salinity?: Range;

    nutrients?: Range;
}
```

These values are not necessarily all active simulation variables yet.

The purpose is to establish the semantic basis for causal environment generation.

---

# 15. Density fields

Do not rely exclusively on discrete objects.

Introduce the concept of density fields.

For example:

\[
D_f(x,z,w)
\]

where `f` is a feature population.

Examples:

```text
D_rock(x,z,w)
D_coral(x,z,w)
D_kelp(x,z,w)
D_algae(x,z,w)
```

A coral density field could depend conceptually upon:

\[
D_{coral}
=
f(
depth,
substrate,
slope,
current,
distanceToReef,
w
)
\]

The first implementation does not need a sophisticated numerical ecology engine.

The architecture merely needs to allow density to be evaluated deterministically.

---

# 16. Geomorphological grammar

Geological diversity must not be generated as white noise.

Introduce a small grammar of large-scale structures.

For example:

```text
formation
    → shelf
    → basin
    → ridge
    → trench
    → plateau

ridge
    → escarpment
    → rock field
    → reef wall

channel
    → sediment deposit
    → rubble
    → biological corridor
```

This should produce recognizable environmental structure.

The goal is:

```text
large-scale geography
        +
mesoscale structures
        +
small-scale detail
```

rather than:

```text
noise + random rocks + random coral
```

---

# 17. Reef generation

Expand reef structures beyond the current small number of static features.

Support archetypes such as:

```text
mound
ridge
wall
pillar
arch
bridge
overhang
cavern
labyrinth
rubble
```

Reef structures should provide semantic information such as:

```text
shelterVolume
entranceDirection
interiorDepth
surfaceArea
attachmentSurface
```

This information can later influence boid behaviour and habitat generation.

Do not implement full cave physics unless required.

---

# 18. Coral colonies

Do not register every coral polyp.

Use colony-level semantic features.

Conceptually:

```ts
CoralColonyFeature {

    center

    radius

    height

    density

    branching

    morphology

    speciesType

    age

    health
}
```

Possible morphologies:

```text
branching
brain
plate
table
fan
tube
massive
encrusting
```

A colony may generate many visual structures while remaining one semantic feature.

---

# 19. Vegetation and habitat patches

Use population/patch features rather than individual registry entries.

Examples:

```text
KELP_FOREST_001
SEAGRASS_MEADOW_001
ALGAE_BED_001
SPONGE_GARDEN_001
ANEMONE_FIELD_001
```

A patch should support:

```text
density
height distribution
orientation
species distribution
substrate requirements
spatial falloff
w behaviour
```

Individual visual instances can be generated downstream.

---

# 20. Habitat features

Introduce semantic ecological regions.

Examples:

```text
NURSERY_001
FEEDING_GROUND_001
SHELTER_ZONE_001
SPAWNING_GROUND_001
CLEANING_STATION_001
TERRITORIAL_ZONE_001
```

These should initially be semantic.

They do not need to be visible.

Their purpose is to establish the bridge:

```text
environment
    ↓
habitat
    ↓
organism behaviour
```

This will later allow boids to respond to meaningful environments instead of arbitrary coordinates.

---

# 21. Dynamic phenomena

Establish architecture for dynamic environmental features:

```text
CURRENT_001
UPWELLING_001
SEDIMENT_PLUME_001
BUBBLE_FIELD_001
THERMAL_VENT_001
PARTICULATE_BLOOM_001
DISTURBANCE_001
```

These are especially important because they can eventually connect:

```text
landscape
→ ecology
→ organism behaviour
→ soundscape
```

Do not attempt a full fluid simulation in this task.

Represent the phenomena semantically and provide deterministic evaluation hooks.

---

# 22. Temporal semantics

Do not assume:

```text
w == wall-clock time
```

The existing architecture treats `w` as a coordinate through the generated 4D environment.

Preserve that interpretation.

Features should therefore be capable of expressing temporal/world-coordinate behaviour such as:

```text
static
slow
dynamic
event
```

Example:

```text
geological formation
    very slow

rock
    slow

reef growth
    slow

coral
    slow / medium

kelp
    medium

algae
    medium

current
    dynamic

sediment plume
    dynamic

disturbance
    event
```

Do not collapse these concepts into one generic animation timer.

---

# 23. Environmental causality

The architecture should support relationships such as:

```text
geology
    ↓
substrate
    ↓
rock structure
    ↓
attachment surface
    ↓
coral colony
    ↓
shelter
    ↓
fish aggregation
```

and:

```text
upwelling
    ↓
nutrients
    ↓
algae
    ↓
small organisms
    ↓
feeding ground
    ↓
boid aggregation
```

The goal is to move toward a **causally generated environment**.

Do not implement a full ecological simulation yet.

Establish the abstractions and implement a minimal working subset.

---

# 24. Gemini / Google AI Studio integration

This section is important.

The project should be architected so that Google Gemini / Google AI Studio can eventually be used as a **world-design and scenario-generation layer**.

Google AI Studio can import an existing GitHub project and iterate on it through natural-language instructions. Gemini also supports structured JSON output and function calling, making it suitable for producing validated environmental specifications rather than arbitrary text.

However:

## Gemini MUST NOT become the simulation runtime.

Do not:

- call Gemini every frame;
- ask Gemini to determine fish positions;
- ask Gemini to continuously generate terrain;
- make world state dependent on API availability;
- introduce network dependency into the deterministic simulation;
- put LLM calls inside `LandscapeEvolutionSystem`;
- make rendering dependent on Gemini;
- use natural-language output as authoritative state.

Instead establish a future-compatible boundary:

```text
Gemini / AI Studio
        ↓
World Design Specification
        ↓
Schema Validation
        ↓
Deterministic Compiler
        ↓
Feature Registry
        ↓
Simulation
```

Gemini should eventually be capable of generating something conceptually like:

```json
{
  "world": {
    "seed": 421991,
    "theme": "continental shelf transitioning into reef trench"
  },

  "regions": [
    {
      "id": "WEST_SHELF",
      "kind": "shelf",
      "features": [
        {
          "kind": "reef",
          "density": 0.62
        },
        {
          "kind": "rock_field",
          "density": 0.41
        }
      ]
    }
  ]
}
```

The exact schema is for the implementation agent to determine.

The generated specification must then be:

1. schema validated;
2. semantically validated;
3. converted into deterministic feature-generation parameters;
4. reproducible without Gemini;
5. executable offline.

Gemini is therefore a **compiler input / design assistant**, not the runtime.

---

# 25. Structured world specifications

Introduce a versioned world/scenario specification format.

For example:

```text
WorldSpecification
    schemaVersion
    seed
    metadata
    regions
    generators
    featurePolicies
    ecologicalPolicies
```

The format must be:

- deterministic;
- serializable;
- human-readable;
- versioned;
- validated;
- renderer-independent.

JSON is acceptable as the interchange representation.

Do not make JSON the internal runtime representation if that would degrade the existing TypeScript architecture.

---

# 26. AI-generated content must be constrained

If a Gemini-generated world specification is accepted, it must be treated as untrusted input.

The compiler must reject:

- unknown feature kinds;
- invalid numeric ranges;
- impossible spatial ranges;
- invalid relationships;
- duplicate authoritative IDs;
- malformed w ranges;
- incompatible domain/kind combinations;
- unsupported morphology types;
- excessive feature counts;
- invalid hierarchy references.

The system must never assume that an LLM-generated specification is semantically correct simply because it conforms to JSON.

Structured output provides syntactic guarantees, not semantic correctness. Google explicitly recommends application-side validation of structured output.

---

# 27. AI Studio should be treated as an authoring tool

The desired future workflow is:

```text
Human
  ↓
Gemini / Google AI Studio
  ↓
World Specification
  ↓
Validation
  ↓
Deterministic Generation
  ↓
Simulation
```

This enables prompts such as:

> Create a cold-water continental shelf environment transitioning into a deep trench, with sparse kelp on the shelf, exposed rock around the escarpment, a dense reef complex near the transition zone, and a sediment-rich trench.

Gemini should translate that into structured semantic parameters.

The simulation then determines exactly what that means.

This is preferable to asking an LLM to directly invent runtime geometry.

---

# 28. Registry architecture

The resulting conceptual architecture should resemble:

```text
                         World Specification
                                │
                                ▼
                       Deterministic Generators
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
         Geology            Structure           Biology
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ▼
                         Feature Registry
                                │
                                ▼
                         Feature Graph
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
         Landscape           Ecology            Habitat
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ▼
                         Boid Environment
                                │
                                ▼
                           Soundscape
                                │
                                ▼
                            Renderer
```

The renderer must remain downstream.

---

# 29. Migration requirements

Existing features must continue to work.

Preserve existing IDs:

```text
ROCK_001 ...
ROCK_005

REEF_001 ...
REEF_003

FORMATION_...
```

Do not casually rename existing IDs.

If aliases are necessary, preserve compatibility.

Existing tests must continue to pass.

---

# 30. First concrete environment

Do not attempt to generate an infinite ecosystem immediately.

Create one substantially richer deterministic environment.

It should contain at least:

### Geological

- 1 major shelf
- 1 ridge
- 1 trench/basin transition
- 1–2 channels
- multiple sediment regions

### Structures

- multiple rock populations
- at least three rock morphology classes
- at least two reef morphology classes
- at least one overhang/arch/cavern semantic feature
- rubble field

### Biology

- coral colonies
- algae patch
- kelp/seagrass patch
- sponge or anemone colony

### Ecology

- shelter zone
- feeding ground
- nursery zone

### Dynamic phenomena

- at least one current
- at least one sediment/upwelling phenomenon

The result should visibly and semantically differ from the current environment.

---

# 31. Avoid visual clutter

Richness does not mean maximum density.

The generator must support:

```text
open areas
dense areas
transition zones
sparse regions
high-relief regions
low-relief regions
```

A convincing environment needs negative space.

Avoid the failure mode:

```text
everything everywhere
```

The environment should contain ecological gradients.

---

# 32. Feature density should be spatially correlated

Avoid independent random placement.

Bad:

```text
random rock
random coral
random plant
random rock
random coral
```

Prefer:

```text
geology
    ↓
substrate
    ↓
structure
    ↓
habitat suitability
    ↓
biological density
```

The environment should therefore have recognizable spatial organisation.

---

# 33. Performance

Do not instantiate thousands of expensive Three.js/Ogre/render objects merely because the registry contains many semantic features.

Separate:

```text
semantic feature count
```

from:

```text
render instance count
```

Use population descriptors and procedural generation where appropriate.

Measure:

- registry generation time;
- feature evaluation time;
- relationship construction time;
- landscape projection time;
- renderer projection time;
- memory usage;
- feature count;
- generated instance count.

Compare against the existing baseline.

---

# 34. Testing requirements

Add comprehensive tests.

At minimum:

## Taxonomy

Verify all supported domains and kinds.

## Identity

Every generated feature has a stable unique ID.

## Determinism

Same seed produces identical registry.

```text
generate(seed)
==
generate(seed)
```

## Variation

Different seeds produce meaningfully different environments.

## Hierarchy

All hierarchy references resolve.

## Relationships

No dangling relationships.

## Environmental constraints

Generated features respect declared suitability constraints.

## Temporal evaluation

Feature evaluation at explicit `w` must not depend upon mutable current time.

## Renderer independence

Feature generation/evaluation must work without renderer initialization.

## Serialization

World specification round-trips correctly.

## Validation

Invalid AI-generated specifications are rejected.

## Population consistency

Generated population instances are deterministic.

## Legacy compatibility

All existing 007A/007B tests continue passing.

---

# 35. Adversarial testing

Do not merely test happy paths.

Attempt to falsify:

### Identity

Can two generators produce the same authoritative ID?

### Determinism

Can iteration order alter generated features?

### Temporal isolation

Can mutable `time4D` leak into explicit evaluation?

### Hierarchy

Can a feature reference a nonexistent parent?

### Relationship graph

Can relationships become cyclic where they should not?

### AI specification

Can malformed or semantically invalid generated JSON enter the registry?

### Renderer dependence

Can generation accidentally require a renderer?

### Performance

Can a pathological world specification cause unbounded feature generation?

### Density

Can overlapping population fields create pathological feature counts?

### Compatibility

Can existing feature IDs disappear?

Every discovered failure should become a regression test.

---

# 36. Documentation

Create:

```text
program_increments/v0.0.3/reports/
    feature_registry_v2_implementation_report.md
```

Document:

1. architecture;
2. taxonomy;
3. generators;
4. hierarchy;
5. relationship graph;
6. environmental suitability;
7. deterministic generation;
8. world specification;
9. AI Studio/Gemini boundary;
10. validation;
11. performance;
12. tests;
13. limitations;
14. known technical debt;
15. future work.

Do not claim capabilities that the implementation does not actually possess.

---

# 37. Explicitly qualify the 4D model

Maintain the distinction established in Task 007A/007B:

The environment is represented using an analytical/parametric 4D model.

Do not describe it as a literal volumetric 4D mesh intersection unless that has actually been implemented.

Likewise:

```text
semantic topology
```

must not be described as complete computational topology.

And:

```text
conformal
```

must only be claimed where mathematically supported by the implementation.

Accuracy of terminology is mandatory.

---

# 38. No unrelated technology expansion

Do NOT introduce:

- OpenUSD;
- OpenVDB;
- H3;
- MLIR;
- Mojo;
- ROS2;
- O3DE;
- external physics engines;
- network services;
- cloud services;
- database systems;
- new rendering engines.

Those technologies may become relevant elsewhere in the broader architecture.

They are not part of this task.

The purpose of this task is to make the current Feature Registry substantially more expressive.

---

# 39. Definition of success

The task succeeds only if the resulting system demonstrates all of the following:

```text
More feature types
        +
More morphological variation
        +
Spatial organisation
        +
Semantic relationships
        +
Environmental suitability
        +
Deterministic generation
        +
4D evolution
        +
Ecological structure
        +
Renderer independence
        +
AI-compatible world specifications
```

The visual result should no longer resemble:

```text
terrain
+
five rocks
+
three reefs
+
some plants
```

It should resemble:

```text
a generated environment
```

with:

- large-scale geographic structure;
- distinct environmental regions;
- transitions between regions;
- clustered geological structures;
- biological communities associated with those structures;
- open areas;
- shelter;
- ecological zones;
- dynamic phenomena;
- coherent spatial relationships.

---

# 40. AI-assisted development workflow

Use Gemini/Google AI Studio where useful for:

- analysing the existing code;
- proposing taxonomy variants;
- generating candidate world specifications;
- generating structured test cases;
- identifying missing relationships;
- adversarial review;
- documentation review;
- generating scenario variants.

Do not blindly accept generated code or specifications.

For every AI-generated architectural proposal:

```text
proposal
    ↓
inspect
    ↓
challenge assumptions
    ↓
compare against repository architecture
    ↓
implement
    ↓
test
    ↓
measure
```

Use structured outputs where machine-readable specifications are generated.

If a Gemini integration is eventually added, use structured schemas and application-side semantic validation. Gemini function calling can also provide a clean future mechanism for controlled interaction with generation/validation tools, but function execution must remain under application control.

Do not introduce an AI API dependency merely to satisfy this task.

---

# 41. Required implementation sequence

Implement in this order.

### Step 1 — Repository audit

Understand and document the existing registry and 007A/007B architecture.

### Step 2 — Taxonomy

Introduce domain/kind vocabulary.

### Step 3 — Feature metadata

Extend the existing feature abstraction.

### Step 4 — Relationships

Introduce the feature relationship graph.

### Step 5 — Hierarchy

Introduce region/zone/cluster organisation.

### Step 6 — Deterministic generators

Implement:

```text
GeologyGenerator
RockFieldGenerator
ReefGenerator
Biology/HabitatGenerator
```

Start small.

### Step 7 — Environmental suitability

Add environmental preference evaluation.

### Step 8 — Population generation

Replace hand-authored repetition with deterministic population generation.

### Step 9 — Rich demonstration world

Generate the first substantially richer aquarium.

### Step 10 — Validation and testing

Add adversarial tests.

### Step 11 — Performance measurement

Measure registry and projection cost.

### Step 12 — Documentation

Complete the implementation report.

---

# 42. Required final report

The implementation report must answer explicitly:

### A. What changed?

### B. What new semantic feature types exist?

### C. How are features generated?

### D. How is determinism guaranteed?

### E. How are feature relationships represented?

### F. How are populations represented?

### G. How is 4D evaluation preserved?

### H. How is renderer independence preserved?

### I. How can an AI-generated world specification eventually enter the system safely?

### J. What is genuinely implemented versus merely architecturally prepared?

### K. What are the performance characteristics?

### L. What limitations remain?

### M. What should Task 002 address next?

---

# 43. Final acceptance criterion

Do not declare success merely because tests pass.

The implementation must satisfy three independent gates:

## Gate 1 — Semantic

The registry represents a meaningful environmental ontology rather than a mesh catalogue.

## Gate 2 — Computational

Generation is deterministic, testable, temporally isolated and performant.

## Gate 3 — Experiential

The resulting aquarium is visibly and structurally richer.

The final test should be:

> If the renderer were completely replaced tomorrow, would the Feature Registry still constitute a meaningful description of the environment?

If the answer is no, the implementation has failed architecturally.

A second test:

> If Gemini were unavailable tomorrow, could the exact same generated environment still be reconstructed from its seed/specification?

If the answer is no, the implementation has incorrectly made AI part of the simulation runtime.

A third test:

> Does the environment exhibit spatial/ecological organisation rather than merely a higher density of objects?

If the answer is no, the implementation has increased object count without increasing environmental richness.

Do not declare COMPLETE until all three gates pass.

---

# 44. Deliverables

Commit:

```text
program_increments/v0.0.3/task_001_feature_registry_v2.md

program_increments/v0.0.3/reports/
    feature_registry_v2_implementation_report.md
```

plus all required source files and tests.

Update any affected:

```text
101_definition.md
102_status.yaml
103_library.graph.json
```

files where repository conventions require it.

All existing tests must pass.

All new tests must pass.

The final report must distinguish:

```text
IMPLEMENTED
ARCHITECTURALLY PREPARED
NOT IMPLEMENTED
KNOWN LIMITATION
```

Do not blur these categories.

# End of instruction