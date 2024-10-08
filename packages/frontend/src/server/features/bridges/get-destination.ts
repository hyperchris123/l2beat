import { type ScalingProjectRiskViewEntry } from '@l2beat/config'

export function getDestination(
  destinations: string[],
): ScalingProjectRiskViewEntry {
  if (destinations.length === 0) {
    throw new Error('Invalid destination')
  }
  if (destinations.length === 1) {
    return { value: destinations[0]!, description: '', sentiment: 'neutral' }
  }

  return {
    value: 'Various',
    description: destinations.join(',\n'),
    sentiment: 'neutral',
  }
}
