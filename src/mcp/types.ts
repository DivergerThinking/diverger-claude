import type { Profile, ProfileLayer } from '../core/types.js';

/** Lightweight summary of a profile for list_profiles responses */
export interface ProfileSummary {
  id: string;
  name: string;
  layer: ProfileLayer;
  layerName: string;
  technologyIds: string[];
  dependsOn?: string[];
}

/** Map numeric layer to human-readable name */
export function layerName(layer: ProfileLayer): string {
  switch (layer) {
    case 0: return 'base';
    case 10: return 'language';
    case 20: return 'framework';
    case 30: return 'testing';
    case 40: return 'infra';
    default: return 'unknown';
  }
}

/** Convert a full Profile to a lightweight summary */
export function toProfileSummary(profile: Profile): ProfileSummary {
  return {
    id: profile.id,
    name: profile.name,
    layer: profile.layer,
    layerName: layerName(profile.layer),
    technologyIds: profile.technologyIds,
    ...(profile.dependsOn ? { dependsOn: profile.dependsOn } : {}),
  };
}
