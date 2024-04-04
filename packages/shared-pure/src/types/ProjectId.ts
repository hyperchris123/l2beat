import { Branded } from './branded'

export type ProjectId = Branded<string, 'ProjectId'>

export function ProjectId(value: string): ProjectId {
  if (value === '') {
    throw new TypeError('Invalid ProjectId')
  }
  return value as unknown as ProjectId
}

ProjectId.ALL = ProjectId('l2beat-all')
ProjectId.LAYER2S = ProjectId('l2beat-layer2s')
ProjectId.BRIDGES = ProjectId('l2beat-bridges')
ProjectId.ETHEREUM = ProjectId('ethereum')
ProjectId.ARBITRUM = ProjectId('arbitrum')
