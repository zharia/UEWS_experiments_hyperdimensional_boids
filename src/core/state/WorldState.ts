/**
 * Versioned World State Schema (v0.2).
 *
 * Defines serializable representation of complete simulation state:
 *  - schemaVersion ('0.1' or '0.2')
 *  - savedAtWallTime (wall-clock timestamp for idle-time simulation catchup)
 *  - clock snapshot (simulationTime, timeScale)
 *  - ecological phase and history
 *  - populations (demographics, carrying capacity, birth/mortality rates)
 *  - habitats (spatial zones, environmental profiles, capacities)
 *  - eventLedger (authoritative event history with causal links)
 *  - agents (identity, physical, latent, drives, memory, relationships, behaviour, lifecycle)
 *  - ecological resources (food, detritus, biofilms, shelters)
 *  - environmental fields (nutrients, illumination, oxygen, temperature)
 *  - antic history and active antics
 */

import { ClockSnapshot } from '../clock/SimulationClock';
import { IAgentJSON } from '../../agents/agent/EcologicalAgent';
import { IResourceSystemJSON } from '../../ecology/resources/ResourceSystem';
import { IPhaseStateJSON } from '../../phases/phase/EcologicalPhase';
import { IAnticHistoryJSON } from '../../antics/history/AnticHistory';
import { IAnticJSON } from '../../antics/antic/Antic';
import { IPopulationManagerJSON } from '../../population/PopulationManager';
import { IHabitatManagerJSON } from '../../ecology/habitats/HabitatManager';
import { IEventLedgerJSON } from '../../history/EcologicalEventLedger';

export interface IWorldStateV02 {
  schemaVersion: '0.1' | '0.2';
  savedAtWallTime: number;
  clock: ClockSnapshot;
  phaseState: IPhaseStateJSON;
  agents: IAgentJSON[];
  resources: IResourceSystemJSON;
  fields: any;
  anticHistory: IAnticHistoryJSON;
  activeAntics: IAnticJSON[];
  populations?: IPopulationManagerJSON;
  habitats?: IHabitatManagerJSON;
  eventLedger?: IEventLedgerJSON;
  metadata?: {
    tankName: string;
    description?: string;
  };
}

export type IWorldStateV01 = IWorldStateV02;

export function isValidWorldStateV01(data: any): data is IWorldStateV02 {
  if (!data || typeof data !== 'object') return false;
  if (data.schemaVersion !== '0.1' && data.schemaVersion !== '0.2') return false;
  if (!data.clock || typeof data.clock.simulationTimeSeconds !== 'number') return false;
  if (!data.phaseState || typeof data.phaseState.currentPhase !== 'string') return false;
  if (!Array.isArray(data.agents)) return false;
  return true;
}
