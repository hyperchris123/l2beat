import { ConfigReader } from '@l2beat/discovery'
import { DiscoveryOutput } from '@l2beat/discovery-types'
import { ChainConverter, ChainId, EthereumAddress } from '@l2beat/shared-pure'
import { expect, mockObject } from 'earl'

import { Database, UpdateMonitorRecord } from '@l2beat/database'
import { ImplementationChangeController } from './ImplementationChangeController'

describe(ImplementationChangeController.name, () => {
  const CONTRACT_A = EthereumAddress.random()
  const IMPLEMENTATION_A_BEFORE = EthereumAddress.random()
  const IMPLEMENTATION_A_AFTER = EthereumAddress.random()

  function getRecord(
    chainId: ChainId,
    projectName: string,
  ): UpdateMonitorRecord {
    return {
      chainId,
      projectName,
      discovery: {
        contracts: [
          {
            address: CONTRACT_A,
            values: {
              $implementation: IMPLEMENTATION_A_AFTER,
            },
          },
        ],
      },
      // TODO: (sz-piotr) This is a very ugly workaround
    } as unknown as UpdateMonitorRecord
  }

  it('returns empty for nothing returned', async () => {
    const repository = mockObject<Database['updateMonitor']>({
      getAll: async () => {
        return [
          getRecord(ChainId(1), 'optimism'),
          getRecord(ChainId(1), 'arbitrum'),
          getRecord(ChainId(42161), 'optimism'),
          getRecord(ChainId(42161), 'arbitrum'),
        ]
      },
    })
    const configReader = mockObject<ConfigReader>({
      readAllChains: () => {
        return ['ethereum', 'arbitrum']
      },
      readAllProjectsForChain: (chain: string) => {
        if (chain === 'ethereum') return ['optimism', 'arbitrum']
        if (chain === 'arbitrum') return ['arbitrum']
        return []
      },
      readDiscovery: (name: string, chain: string) => {
        return {
          contracts: [
            {
              address: CONTRACT_A,
              values: {
                $implementation:
                  chain === 'ethereum' && name === 'arbitrum'
                    ? IMPLEMENTATION_A_BEFORE
                    : IMPLEMENTATION_A_AFTER,
              },
            },
          ],
          // TODO: (sz-piotr) This is a very ugly workaround
        } as unknown as DiscoveryOutput
      },
    })

    const chainConverter = new ChainConverter([
      { name: 'ethereum', chainId: ChainId(1) },
      { name: 'arbitrum', chainId: ChainId(42161) },
    ])

    const controller = new ImplementationChangeController(
      mockObject<Database>({ updateMonitor: repository }),
      configReader,
      chainConverter,
    )
    const result = await controller.getImplementationChangeReport()

    expect(result).toEqual({
      projects: {
        arbitrum: {
          ethereum: [
            {
              containingContract: CONTRACT_A,
              newImplementations: [IMPLEMENTATION_A_AFTER],
            },
          ],
        },
      },
    })
  })

  it('returns empty for nothing returned', async () => {
    const repository = mockObject<Database['updateMonitor']>({
      getAll: async () => {
        return [{} as UpdateMonitorRecord]
      },
    })
    const configReader = mockObject<ConfigReader>({
      readAllChains: () => {
        return ['ethereum', 'arbitrum']
      },
      readAllProjectsForChain: (chian: string) => {
        if (chian === 'ethereum') return ['optimism', 'arbitrum']
        if (chian === 'arbitrum') return ['arbitrum']
        return []
      },
      readDiscovery: () => {
        return {} as DiscoveryOutput
      },
    })

    const chainConverter = new ChainConverter([
      { name: 'ethereum', chainId: ChainId(1) },
      { name: 'arbitrum', chainId: ChainId(42161) },
    ])

    const controller = new ImplementationChangeController(
      mockObject<Database>({ updateMonitor: repository }),
      configReader,
      chainConverter,
    )
    const result = await controller.getImplementationChangeReport()

    expect(result).toEqual({
      projects: {},
    })
  })
})
