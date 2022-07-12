import { providers } from 'ethers'

import { ProjectParameters } from '../types'
import { getGovernance } from './contracts/governance'
import { getPairManager } from './contracts/pairManager'
import { getUpgradeGatekeeper } from './contracts/upgradeGatekeeper'
import { getVerifier } from './contracts/verifier'
import { getVerifierExit } from './contracts/verifierExit'
import { getZkSync } from './contracts/zkSync'

export async function getZkSwap2Parameters(
  provider: providers.JsonRpcProvider,
): Promise<ProjectParameters> {
  return {
    name: 'ZkSwap 2.0',
    contracts: await Promise.all([
      getUpgradeGatekeeper(provider),
      getZkSync(provider),
      getGovernance(provider),
      getVerifier(provider),
      getVerifierExit(provider),
      getPairManager(provider),
    ]),
  }
}
