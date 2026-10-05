/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * FeatureRelationshipGraph: Directed semantic relationship graph for 4D environmental features.
 */

import { FeatureRelationshipType } from './taxonomy';
import { FeatureRelationship } from './environmentalTypes';

export class FeatureRelationshipGraph {
  private outgoing: Map<string, FeatureRelationship[]> = new Map();
  private incoming: Map<string, FeatureRelationship[]> = new Map();

  /**
   * Adds a semantic relationship between two features.
   */
  public addRelationship(rel: FeatureRelationship): void {
    if (!rel.sourceId || !rel.targetId) {
      throw new Error('Relationship requires non-empty sourceId and targetId.');
    }

    if (!this.outgoing.has(rel.sourceId)) {
      this.outgoing.set(rel.sourceId, []);
    }
    this.outgoing.get(rel.sourceId)!.push({ ...rel });

    if (!this.incoming.has(rel.targetId)) {
      this.incoming.set(rel.targetId, []);
    }
    this.incoming.get(rel.targetId)!.push({ ...rel });
  }

  /**
   * Retrieves all outgoing relationships from a source feature.
   */
  public getOutgoing(sourceId: string, type?: FeatureRelationshipType): FeatureRelationship[] {
    const list = this.outgoing.get(sourceId) || [];
    if (!type) return [...list];
    return list.filter(r => r.type === type);
  }

  /**
   * Retrieves all incoming relationships to a target feature.
   */
  public getIncoming(targetId: string, type?: FeatureRelationshipType): FeatureRelationship[] {
    const list = this.incoming.get(targetId) || [];
    if (!type) return [...list];
    return list.filter(r => r.type === type);
  }

  /**
   * Retrieves all related feature IDs (both outgoing and incoming) optionally filtered by relationship type.
   */
  public getRelatedIds(featureId: string, type?: FeatureRelationshipType): string[] {
    const related = new Set<string>();
    for (const r of this.getOutgoing(featureId, type)) {
      related.add(r.targetId);
    }
    for (const r of this.getIncoming(featureId, type)) {
      related.add(r.sourceId);
    }
    return Array.from(related);
  }

  /**
   * Returns all relationships in the graph.
   */
  public getAll(): FeatureRelationship[] {
    const all: FeatureRelationship[] = [];
    for (const list of this.outgoing.values()) {
      all.push(...list);
    }
    return all;
  }

  /**
   * Removes all relationships associated with a feature ID.
   */
  public removeFeature(featureId: string): void {
    const outgoingList = this.outgoing.get(featureId) || [];
    for (const r of outgoingList) {
      const inc = this.incoming.get(r.targetId);
      if (inc) {
        this.incoming.set(r.targetId, inc.filter(x => x.sourceId !== featureId));
      }
    }
    this.outgoing.delete(featureId);

    const incomingList = this.incoming.get(featureId) || [];
    for (const r of incomingList) {
      const out = this.outgoing.get(r.sourceId);
      if (out) {
        this.outgoing.set(r.sourceId, out.filter(x => x.targetId !== featureId));
      }
    }
    this.incoming.delete(featureId);
  }

  /**
   * Clears the relationship graph.
   */
  public clear(): void {
    this.outgoing.clear();
    this.incoming.clear();
  }

  /**
   * Validates that all relationship targets exist in a provided set of valid IDs.
   * Returns a list of invalid dangling target references.
   */
  public validateDanglingReferences(validIds: Set<string>): Array<{ sourceId: string; targetId: string; type: string }> {
    const dangling: Array<{ sourceId: string; targetId: string; type: string }> = [];
    for (const list of this.outgoing.values()) {
      for (const r of list) {
        // Special reserved IDs like 'TERRAIN' are always considered valid
        if (r.targetId === 'TERRAIN') continue;
        if (!validIds.has(r.targetId)) {
          dangling.push({ sourceId: r.sourceId, targetId: r.targetId, type: r.type });
        }
      }
    }
    return dangling;
  }

  /**
   * Checks whether a directed relationship type contains cycles (e.g. 'sheltered-by', 'supported-by').
   */
  public hasCycle(type: FeatureRelationshipType): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);

      const neighbors = this.getOutgoing(node, type).map(r => r.targetId);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const node of this.outgoing.keys()) {
      if (!visited.has(node)) {
        if (dfs(node)) return true;
      }
    }
    return false;
  }
}
