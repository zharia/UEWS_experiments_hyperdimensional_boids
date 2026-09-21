/**
 * Agent Interpersonal & Inter-species Relationship System.
 *
 * Tracks social ties:
 *  - affinity: [-1.0 (hostile/disliked) to +1.0 (close bonded companion)]
 *  - familiarity: [0.0 (total stranger) to 1.0 (well known)]
 *  - fear: [0.0 (no fear) to 1.0 (terrified/submissive)]
 *  - dominance: [-1.0 (submissive) to +1.0 (alpha/dominant)]
 *  - cooperationCount: historical number of joint antics or shared feeding events
 */

export interface AgentRelationship {
  targetAgentId: string;
  affinity: number;       // -1.0 to +1.0
  familiarity: number;    // 0.0 to 1.0
  fear: number;           // 0.0 to 1.0
  dominance: number;      // -1.0 to +1.0
  cooperationCount: number;
  lastInteractionTime: number;
}

export interface IRelationshipsJSON {
  relationships: Record<string, AgentRelationship>;
}

export class RelationshipSystem {
  private _relationships: Map<string, AgentRelationship> = new Map();

  public getRelationship(targetId: string): AgentRelationship {
    let rel = this._relationships.get(targetId);
    if (!rel) {
      rel = {
        targetAgentId: targetId,
        affinity: 0.0,
        familiarity: 0.0,
        fear: 0.0,
        dominance: 0.0,
        cooperationCount: 0,
        lastInteractionTime: 0,
      };
      this._relationships.set(targetId, rel);
    }
    return rel;
  }

  public modifyRelationship(
    targetId: string,
    deltaAffinity: number,
    deltaFamiliarity: number,
    deltaFear: number,
    simTime: number
  ): AgentRelationship {
    const rel = this.getRelationship(targetId);
    rel.affinity = Math.max(-1.0, Math.min(1.0, rel.affinity + deltaAffinity));
    rel.familiarity = Math.max(0.0, Math.min(1.0, rel.familiarity + deltaFamiliarity));
    rel.fear = Math.max(0.0, Math.min(1.0, rel.fear + deltaFear));
    rel.lastInteractionTime = simTime;
    return rel;
  }

  public recordCooperation(targetId: string, simTime: number): void {
    const rel = this.getRelationship(targetId);
    rel.cooperationCount++;
    rel.affinity = Math.min(1.0, rel.affinity + 0.15);
    rel.familiarity = Math.min(1.0, rel.familiarity + 0.2);
    rel.lastInteractionTime = simTime;
  }

  public recordAggression(targetId: string, isSelfAggressor: boolean, simTime: number): void {
    const rel = this.getRelationship(targetId);
    rel.familiarity = Math.min(1.0, rel.familiarity + 0.25);
    rel.affinity = Math.max(-1.0, rel.affinity - 0.35);
    if (isSelfAggressor) {
      rel.dominance = Math.min(1.0, rel.dominance + 0.2);
    } else {
      rel.fear = Math.min(1.0, rel.fear + 0.35);
      rel.dominance = Math.max(-1.0, rel.dominance - 0.2);
    }
    rel.lastInteractionTime = simTime;
  }

  public getAllRelationships(): AgentRelationship[] {
    return Array.from(this._relationships.values());
  }

  public toJSON(): IRelationshipsJSON {
    const relMap: Record<string, AgentRelationship> = {};
    for (const [id, rel] of this._relationships.entries()) {
      relMap[id] = { ...rel };
    }
    return { relationships: relMap };
  }

  public fromJSON(data: IRelationshipsJSON): void {
    if (!data?.relationships) return;
    this._relationships.clear();
    for (const [id, rel] of Object.entries(data.relationships)) {
      this._relationships.set(id, { ...rel });
    }
  }
}
