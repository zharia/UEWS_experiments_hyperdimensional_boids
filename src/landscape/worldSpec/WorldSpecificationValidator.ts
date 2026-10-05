/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * WorldSpecificationValidator: Strict semantic validation for untrusted external world specifications.
 */

import { VALID_DOMAINS, VALID_KINDS_BY_DOMAIN } from '../taxonomy';
import {
  FeatureSpecification,
  PopulationSpecification,
  RegionSpecification,
  ValidationIssue,
  WorldSpecification,
  WorldValidationResult,
  ZoneSpecification,
} from './worldSpecTypes';

export class WorldSpecificationValidator {
  private static readonly MAX_TOTAL_POPULATION_COUNT = 500;
  private static readonly WORLD_BOUNDS = { minX: -20.0, maxX: 20.0, minZ: -12.0, maxZ: 12.0 };

  /**
   * Validates an untrusted world specification against semantic and schema constraints.
   */
  public static validate(spec: unknown): WorldValidationResult {
    const issues: ValidationIssue[] = [];

    if (!spec || typeof spec !== 'object') {
      issues.push({ path: 'root', message: 'World specification must be a non-null object.', severity: 'error' });
      return this.buildResult(issues);
    }

    const s = spec as Partial<WorldSpecification>;

    // 1. Schema version
    if (s.schemaVersion !== '2.0.0') {
      issues.push({
        path: 'schemaVersion',
        message: `Unsupported schema version: expected '2.0.0', got '${String(s.schemaVersion)}'.`,
        severity: 'error',
      });
    }

    // 2. Seed validation
    if (typeof s.seed !== 'number' || !Number.isFinite(s.seed)) {
      issues.push({ path: 'seed', message: 'Seed must be a finite number.', severity: 'error' });
    }

    // 3. Metadata validation
    if (!s.metadata || typeof s.metadata !== 'object') {
      issues.push({ path: 'metadata', message: 'Metadata must be an object.', severity: 'error' });
    } else {
      if (!s.metadata.name || typeof s.metadata.name !== 'string') {
        issues.push({ path: 'metadata.name', message: 'Metadata name is required.', severity: 'error' });
      }
    }

    // Known ID registry for hierarchy and relationship checks
    const regionIds = new Set<string>();
    const zoneIds = new Set<string>();
    const featureIds = new Set<string>();

    // 4. Region validation
    if (!Array.isArray(s.regions)) {
      issues.push({ path: 'regions', message: 'Regions must be an array.', severity: 'error' });
    } else {
      for (let i = 0; i < s.regions.length; i++) {
        const reg = s.regions[i];
        this.validateRegion(reg, i, regionIds, zoneIds, issues);
      }
    }

    // 5. Population validation
    let totalPopulationCount = 0;
    if (s.populations !== undefined) {
      if (!Array.isArray(s.populations)) {
        issues.push({ path: 'populations', message: 'Populations must be an array if provided.', severity: 'error' });
      } else {
        for (let i = 0; i < s.populations.length; i++) {
          const pop = s.populations[i];
          totalPopulationCount += (pop && typeof pop.count === 'number' ? pop.count : 0);
          this.validatePopulation(pop, i, featureIds, zoneIds, regionIds, issues);
        }
      }
    }

    if (totalPopulationCount > this.MAX_TOTAL_POPULATION_COUNT) {
      issues.push({
        path: 'populations',
        message: `Total population count exceeds maximum allowed bound of ${this.MAX_TOTAL_POPULATION_COUNT} (requested: ${totalPopulationCount}).`,
        severity: 'error',
      });
    }

    // 6. Custom features validation
    if (s.customFeatures !== undefined) {
      if (!Array.isArray(s.customFeatures)) {
        issues.push({ path: 'customFeatures', message: 'CustomFeatures must be an array if provided.', severity: 'error' });
      } else {
        for (let i = 0; i < s.customFeatures.length; i++) {
          const feat = s.customFeatures[i];
          this.validateFeature(feat, i, featureIds, zoneIds, regionIds, issues);
        }
      }
    }

    // 7. Validate relationship target references across custom features
    if (Array.isArray(s.customFeatures)) {
      for (let i = 0; i < s.customFeatures.length; i++) {
        const feat = s.customFeatures[i];
        if (feat && Array.isArray(feat.relationships)) {
          for (let j = 0; j < feat.relationships.length; j++) {
            const rel = feat.relationships[j];
            if (rel && rel.targetId && rel.targetId !== 'TERRAIN') {
              if (!featureIds.has(rel.targetId) && !regionIds.has(rel.targetId) && !zoneIds.has(rel.targetId)) {
                // Warning if referencing future or dynamic target, error if malformed
                issues.push({
                  path: `customFeatures[${i}].relationships[${j}].targetId`,
                  message: `Relationship target '${rel.targetId}' does not exist in declared features or hierarchy.`,
                  severity: 'warning',
                });
              }
            }
          }
        }
      }
    }

    return this.buildResult(issues);
  }

  private static validateRegion(
    reg: RegionSpecification,
    idx: number,
    regionIds: Set<string>,
    zoneIds: Set<string>,
    issues: ValidationIssue[]
  ): void {
    const path = `regions[${idx}]`;
    if (!reg || typeof reg !== 'object') {
      issues.push({ path, message: 'Region must be an object.', severity: 'error' });
      return;
    }

    if (!reg.id || typeof reg.id !== 'string') {
      issues.push({ path: `${path}.id`, message: 'Region id is required.', severity: 'error' });
    } else if (regionIds.has(reg.id)) {
      issues.push({ path: `${path}.id`, message: `Duplicate region ID: '${reg.id}'.`, severity: 'error' });
    } else {
      regionIds.add(reg.id);
    }

    this.validateBounds(reg.bounds, `${path}.bounds`, issues);

    if (Array.isArray(reg.zones)) {
      for (let j = 0; j < reg.zones.length; j++) {
        const zone = reg.zones[j];
        this.validateZone(zone, `${path}.zones[${j}]`, reg.id, zoneIds, issues);
      }
    }
  }

  private static validateZone(
    zone: ZoneSpecification,
    path: string,
    expectedParentId: string,
    zoneIds: Set<string>,
    issues: ValidationIssue[]
  ): void {
    if (!zone || typeof zone !== 'object') {
      issues.push({ path, message: 'Zone must be an object.', severity: 'error' });
      return;
    }

    if (!zone.id || typeof zone.id !== 'string') {
      issues.push({ path: `${path}.id`, message: 'Zone id is required.', severity: 'error' });
    } else if (zoneIds.has(zone.id)) {
      issues.push({ path: `${path}.id`, message: `Duplicate zone ID: '${zone.id}'.`, severity: 'error' });
    } else {
      zoneIds.add(zone.id);
    }

    if (zone.parentId !== expectedParentId) {
      issues.push({
        path: `${path}.parentId`,
        message: `Zone parentId '${zone.parentId}' does not match enclosing region '${expectedParentId}'.`,
        severity: 'error',
      });
    }

    this.validateBounds(zone.bounds, `${path}.bounds`, issues);
  }

  private static validatePopulation(
    pop: PopulationSpecification,
    idx: number,
    featureIds: Set<string>,
    zoneIds: Set<string>,
    regionIds: Set<string>,
    issues: ValidationIssue[]
  ): void {
    const path = `populations[${idx}]`;
    if (!pop || typeof pop !== 'object') {
      issues.push({ path, message: 'Population must be an object.', severity: 'error' });
      return;
    }

    if (!pop.id || typeof pop.id !== 'string') {
      issues.push({ path: `${path}.id`, message: 'Population id is required.', severity: 'error' });
    } else if (featureIds.has(pop.id)) {
      issues.push({ path: `${path}.id`, message: `Duplicate population ID: '${pop.id}'.`, severity: 'error' });
    } else {
      featureIds.add(pop.id);
    }

    if (typeof pop.count !== 'number' || pop.count < 0 || !Number.isFinite(pop.count)) {
      issues.push({ path: `${path}.count`, message: 'Count must be a non-negative finite integer.', severity: 'error' });
    }

    this.validateDomainAndKind(pop.domain, pop.kind, path, issues);
    this.validateBounds(pop.spatialBounds, `${path}.spatialBounds`, issues);
    this.validateWRange(pop.wRange, `${path}.wRange`, issues);

    if (pop.parentId && !zoneIds.has(pop.parentId) && !regionIds.has(pop.parentId)) {
      issues.push({
        path: `${path}.parentId`,
        message: `Population parentId '${pop.parentId}' does not exist in defined regions or zones.`,
        severity: 'warning',
      });
    }
  }

  private static validateFeature(
    feat: FeatureSpecification,
    idx: number,
    featureIds: Set<string>,
    zoneIds: Set<string>,
    regionIds: Set<string>,
    issues: ValidationIssue[]
  ): void {
    const path = `customFeatures[${idx}]`;
    if (!feat || typeof feat !== 'object') {
      issues.push({ path, message: 'Feature must be an object.', severity: 'error' });
      return;
    }

    if (!feat.id || typeof feat.id !== 'string') {
      issues.push({ path: `${path}.id`, message: 'Feature id is required.', severity: 'error' });
    } else if (featureIds.has(feat.id)) {
      issues.push({ path: `${path}.id`, message: `Duplicate feature ID: '${feat.id}'.`, severity: 'error' });
    } else {
      featureIds.add(feat.id);
    }

    this.validateDomainAndKind(feat.domain, feat.kind, path, issues);
    this.validateVector4D(feat.position4D, `${path}.position4D`, issues);
    this.validateVector4D(feat.scale4D, `${path}.scale4D`, issues, true);
    this.validateWRange(feat.wRange, `${path}.wRange`, issues);

    if (feat.parentId && !zoneIds.has(feat.parentId) && !regionIds.has(feat.parentId)) {
      issues.push({
        path: `${path}.parentId`,
        message: `Feature parentId '${feat.parentId}' does not exist in defined regions or zones.`,
        severity: 'warning',
      });
    }
  }

  private static validateDomainAndKind(domain: any, kind: any, path: string, issues: ValidationIssue[]): void {
    if (!VALID_DOMAINS.has(domain)) {
      issues.push({
        path: `${path}.domain`,
        message: `Invalid domain: '${String(domain)}'. Must be one of: ${Array.from(VALID_DOMAINS).join(', ')}.`,
        severity: 'error',
      });
      return;
    }

    const validKinds = VALID_KINDS_BY_DOMAIN[domain as keyof typeof VALID_KINDS_BY_DOMAIN];
    if (!validKinds || !validKinds.has(kind)) {
      issues.push({
        path: `${path}.kind`,
        message: `Invalid kind '${String(kind)}' for domain '${String(domain)}'.`,
        severity: 'error',
      });
    }
  }

  private static validateBounds(
    b: { minX: number; maxX: number; minZ: number; maxZ: number } | undefined,
    path: string,
    issues: ValidationIssue[]
  ): void {
    if (!b || typeof b !== 'object') {
      issues.push({ path, message: 'Bounds must be an object with minX, maxX, minZ, maxZ.', severity: 'error' });
      return;
    }
    if (!Number.isFinite(b.minX) || !Number.isFinite(b.maxX) || b.minX >= b.maxX) {
      issues.push({ path: `${path}.x`, message: `Invalid X bounds: minX (${b.minX}) must be strictly less than maxX (${b.maxX}).`, severity: 'error' });
    }
    if (!Number.isFinite(b.minZ) || !Number.isFinite(b.maxZ) || b.minZ >= b.maxZ) {
      issues.push({ path: `${path}.z`, message: `Invalid Z bounds: minZ (${b.minZ}) must be strictly less than maxZ (${b.maxZ}).`, severity: 'error' });
    }
  }

  private static validateWRange(wRange: [number, number] | undefined, path: string, issues: ValidationIssue[]): void {
    if (!Array.isArray(wRange) || wRange.length !== 2) {
      issues.push({ path, message: 'wRange must be a 2-tuple [minW, maxW].', severity: 'error' });
      return;
    }
    const [wMin, wMax] = wRange;
    if (!Number.isFinite(wMin) || !Number.isFinite(wMax) || wMin > wMax) {
      issues.push({ path, message: `Invalid wRange: min (${wMin}) must be <= max (${wMax}).`, severity: 'error' });
    }
  }

  private static validateVector4D(v: any, path: string, issues: ValidationIssue[], positiveOnly = false): void {
    if (!v || typeof v !== 'object') {
      issues.push({ path, message: 'Vector4D must be an object with x, y, z, w.', severity: 'error' });
      return;
    }
    for (const axis of ['x', 'y', 'z', 'w']) {
      const val = v[axis];
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        issues.push({ path: `${path}.${axis}`, message: `Axis '${axis}' must be a finite number.`, severity: 'error' });
      } else if (positiveOnly) {
        if (axis === 'y') {
          if (val === 0) {
            issues.push({ path: `${path}.${axis}`, message: `Scale axis '${axis}' must be non-zero.`, severity: 'error' });
          }
        } else if (val <= 0) {
          issues.push({ path: `${path}.${axis}`, message: `Scale axis '${axis}' must be strictly positive (> 0).`, severity: 'error' });
        }
      }
    }
  }

  private static buildResult(issues: ValidationIssue[]): WorldValidationResult {
    const errors = issues.filter(i => i.severity === 'error').map(i => `[${i.path}] ${i.message}`);
    const warnings = issues.filter(i => i.severity === 'warning').map(i => `[${i.path}] ${i.message}`);
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      issues,
    };
  }
}
