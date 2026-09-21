/**
 * Antic Salience and Manifestation Promotion.
 *
 * Distinguishes:
 *  - Latent Antics (subconscious or background simulation events occurring unseen)
 *  - Manifest Antics (salient episodes promoted to observer visual focus / HUD)
 */

import { Antic } from '../antic/Antic';

export type ObserverState = 'ABSENT' | 'PRESENT' | 'WATCHING' | 'INTERACTING' | 'INACTIVE';

export class AnticSalienceEvaluator {
  /**
   * Evaluates overall salience score [0.0 to 1.0] for an antic candidate
   */
  public evaluateSalience(
    antic: Antic,
    observerState: ObserverState,
    noveltyScore: number,
    participantCount: number
  ): { salience: number; shouldManifest: boolean } {
    let baseSalience = antic.salience;

    // Dramatic/Novelty boost
    baseSalience = baseSalience * 0.5 + noveltyScore * 0.3 + Math.min(1.0, participantCount * 0.1) * 0.2;

    // Observer modulation
    let manifestThreshold = 0.65; // Default: high barrier to prevent clutter
    switch (observerState) {
      case 'WATCHING':
        // Observer is actively watching: lower threshold so subtle interesting antics manifest
        manifestThreshold = 0.45;
        baseSalience *= 1.2;
        break;
      case 'INTERACTING':
        manifestThreshold = 0.40;
        baseSalience *= 1.3;
        break;
      case 'PRESENT':
        manifestThreshold = 0.60;
        break;
      case 'INACTIVE':
      case 'ABSENT':
        // Observer absent: antics stay latent in simulation background
        manifestThreshold = 0.95;
        baseSalience *= 0.8;
        break;
    }

    const finalSalience = Math.max(0.0, Math.min(1.0, baseSalience));
    const shouldManifest = finalSalience >= manifestThreshold;

    return {
      salience: finalSalience,
      shouldManifest,
    };
  }
}
