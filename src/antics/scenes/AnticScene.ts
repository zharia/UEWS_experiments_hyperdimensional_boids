/**
 * Antic Scene Manifestation Representation.
 *
 * Lightweight semantic description of a manifested episodic antic episode.
 * Establishes a strict boundary between simulation state and visual rendering.
 * Contains no renderer-specific commands or graphic assumptions.
 */

import { Vector3D } from '../../space/physical/Vector3D';
import { AnticType, AnticParticipant } from '../antic/Antic';

export interface AnticScene {
  id: string;
  anticId: string;
  type: AnticType;
  participants: AnticParticipant[];
  spatialFocus: { x: number; y: number; z: number };
  spatialRadius: number;
  temporalInterval: {
    startTime: number;
    duration: number;
  };
  eventContext: string;
  significance: number; // 0 to 1
  recommendedDuration: number; // suggested duration for observation
  dominantEmotionOrDrive?: string;
  historicalEventId?: string;
}

export class AnticSceneFactory {
  public static createScene(config: {
    anticId: string;
    type: AnticType;
    participants: AnticParticipant[];
    spatialFocus: Vector3D;
    spatialRadius?: number;
    startTime: number;
    duration: number;
    eventContext: string;
    significance: number;
    historicalEventId?: string;
  }): AnticScene {
    return {
      id: `scene_${config.anticId}_${Math.floor(config.startTime)}`,
      anticId: config.anticId,
      type: config.type,
      participants: [...config.participants],
      spatialFocus: config.spatialFocus.toJSON(),
      spatialRadius: config.spatialRadius || 4.0,
      temporalInterval: {
        startTime: config.startTime,
        duration: config.duration,
      },
      eventContext: config.eventContext,
      significance: Math.min(1.0, Math.max(0.0, config.significance)),
      recommendedDuration: Math.max(2.0, config.duration),
      historicalEventId: config.historicalEventId,
    };
  }
}
