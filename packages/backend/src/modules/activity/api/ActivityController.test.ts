import {
  ActivityApiChartPoint,
  ActivityApiResponse,
  ProjectId,
  UnixTime,
} from '@l2beat/shared-pure'
import { expect, mockFn, mockObject } from 'earl'

import { ActivityRecord, Database } from '@l2beat/database'
import { range } from 'lodash'
import { Clock } from '../../../tools/Clock'
import { ActivityController } from './ActivityController'
import { DailyTransactionCount } from './types'

const PROJECT_A = ProjectId('project-a')
const PROJECT_B = ProjectId('project-b')
const NOW = UnixTime.now()
const TODAY = NOW.toStartOf('day')

describe(ActivityController.name, () => {
  describe(ActivityController.prototype.getActivity.name, () => {
    it('returns only included projects', async () => {
      const includedIds: ProjectId[] = [ProjectId.ETHEREUM, PROJECT_A]

      const controller = createController({
        includedIds,
        repository: mockRepository([
          {
            projectId: ProjectId.ETHEREUM,
            timestamp: TODAY.add(-2, 'days'),
            count: 2137,
            start: 0,
            end: 0,
          },
          {
            projectId: ProjectId.ETHEREUM,
            timestamp: TODAY.add(-1, 'days'),
            count: 420,
            start: 0,
            end: 0,
          },
          {
            projectId: ProjectId.ETHEREUM,
            timestamp: TODAY,
            count: 100,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_A,
            timestamp: TODAY.add(-2, 'days'),
            count: 2,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_A,
            timestamp: TODAY.add(-1, 'days'),
            count: 1,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_A,
            timestamp: TODAY,
            count: 2,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_B,
            timestamp: TODAY.add(-2, 'days'),
            count: 2,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_B,
            timestamp: TODAY.add(-1, 'days'),
            count: 1,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_B,
            timestamp: TODAY,
            count: 2,
            start: 0,
            end: 0,
          },
        ]),
        clock: mockObject<Clock>({ getLastHour: () => NOW }),
      })

      expect(await controller.getActivity()).toEqual({
        type: 'success',
        data: formatActivity({
          combined: {
            data: [
              [TODAY.add(-2, 'days'), 2, 2137],
              [TODAY.add(-1, 'days'), 1, 420],
            ],
            estimatedImpact: 0,
            estimatedSince: TODAY,
          },
          projects: {
            'project-a': [
              [TODAY.add(-2, 'days'), 2, 2137],
              [TODAY.add(-1, 'days'), 1, 420],
            ],
          },
        }),
      })
    })

    it('groups data', async () => {
      const includedIds: ProjectId[] = [
        PROJECT_A,
        PROJECT_B,
        ProjectId.ETHEREUM,
      ]

      const controller = createController({
        includedIds,
        repository: mockRepository([
          {
            projectId: ProjectId.ETHEREUM,
            timestamp: TODAY.add(-2, 'days'),
            count: 2137,
            start: 0,
            end: 0,
          },
          {
            projectId: ProjectId.ETHEREUM,
            timestamp: TODAY.add(-1, 'days'),
            count: 420,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_A,
            timestamp: TODAY.add(-2, 'days'),
            count: 2,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_A,
            timestamp: TODAY.add(-1, 'days'),
            count: 1,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_B,
            timestamp: TODAY.add(-2, 'days'),
            count: 1337,
            start: 0,
            end: 0,
          },
          {
            projectId: PROJECT_B,
            timestamp: TODAY.add(-1, 'days'),
            count: 69,
            start: 0,
            end: 0,
          },
        ]),
        clock: mockObject<Clock>({ getLastHour: () => NOW }),
      })

      expect(await controller.getActivity()).toEqual({
        type: 'success',
        data: formatActivity({
          combined: {
            data: [[TODAY.add(-2, 'days'), 1339, 2137]],
            estimatedImpact: 0,
            estimatedSince: TODAY.add(-1, 'days'),
          },
          projects: {
            [PROJECT_A.toString()]: [[TODAY.add(-2, 'days'), 2, 2137]],
            [PROJECT_B.toString()]: [[TODAY.add(-2, 'days'), 1337, 2137]],
          },
        }),
      })
    })

    it('returns alignActivityData errors', async () => {
      const controller = createController({
        clock: mockObject<Clock>({
          getLastHour: () => UnixTime.now().toStartOf('hour'),
        }),
      })
      const mockAlignActivityData = mockFn().returns({
        type: 'error',
        error: 'RANDOM_ERROR',
      })
      controller.alignActivityData = mockAlignActivityData

      const result = await controller.getActivity()

      expect(result).toEqual({
        type: 'error',
        error: expect.a(String),
      })
    })
  })

  describe(ActivityController.prototype.getAggregatedActivity.name, () => {
    it('returns activity data for given projects', async () => {
      const projectIds = [
        ProjectId('arbitrum'),
        ProjectId('starknet'),
        ProjectId('zksync-era'),
      ]

      const controller = createController({
        repository: mockObject<Database['activity']>({
          getDailyCountsPerProject: mockFn()
            .given(ProjectId.ETHEREUM)
            .resolvesToOnce([
              {
                timestamp: TODAY.add(-2, 'days'),
                count: 2137,
              },
              {
                timestamp: TODAY.add(-1, 'days'),
                count: 420,
              },
              {
                timestamp: TODAY,
                count: 100,
              },
            ]),
          getProjectsAggregatedDailyCount: mockFn()
            .given(projectIds)
            .resolvesToOnce([
              {
                timestamp: TODAY.add(-2, 'days'),
                count: 18,
              },
              {
                timestamp: TODAY.add(-1, 'days'),
                count: 26,
              },
              {
                timestamp: TODAY,
                count: 24,
              },
            ]),
        }),
        clock: mockObject<Clock>({ getLastHour: () => NOW.toStartOf('hour') }),
      })

      const result = await controller.getAggregatedActivity(projectIds)

      expect(result).toEqual({
        type: 'success',
        data: {
          daily: {
            data: [
              [TODAY.add(-2, 'days'), 18, 2137],
              [TODAY.add(-1, 'days'), 26, 420],
            ],
            types: ['timestamp', 'transactions', 'ethereumTransactions'],
          },
        },
      })
    })

    it('returns alignActivityData errors', async () => {
      const projectIds = [
        ProjectId('arbitrum'),
        ProjectId('starknet'),
        ProjectId('zksync-era'),
      ]

      const controller = createController({
        repository: mockObject<Database['activity']>({
          getDailyCountsPerProject: mockFn().resolvesTo([]),
          getProjectsAggregatedDailyCount: mockFn().resolvesTo([]),
        }),
        clock: mockObject<Clock>({ getLastHour: () => NOW.toStartOf('hour') }),
      })
      const mockAlignActivityData = mockFn().returns({
        type: 'error',
        error: 'RANDOM_ERROR',
      })
      controller.alignActivityData = mockAlignActivityData

      const result = await controller.getAggregatedActivity(projectIds)
      expect(result).toEqual({
        type: 'error',
        error: expect.a(String),
      })
    })
  })

  describe(ActivityController.prototype.mapSlugsToProjectIds.name, () => {
    const activityController = createController({})

    it('returns project ids for given slugs', () => {
      const result = activityController.mapSlugsToProjectIds([
        'arbitrum',
        'optimism',
        'starknet',
        'zksync-era',
      ])

      expect(result).toEqual({
        type: 'success',
        data: [
          ProjectId('arbitrum'),
          ProjectId('optimism'),
          ProjectId('starknet'),
          ProjectId('zksync2'),
        ],
      })
    })

    it('returns error for empty slugs', () => {
      const result = activityController.mapSlugsToProjectIds([])

      expect(result).toEqual({
        type: 'error',
        error: 'EMPTY_PROJECTS',
      })
    })

    it('returns error for unknown project', () => {
      const result = activityController.mapSlugsToProjectIds(['unknown'])

      expect(result).toEqual({
        type: 'error',
        error: 'UNKNOWN_PROJECT',
      })
    })

    it('returns error for no transaction api', () => {
      const result = activityController.mapSlugsToProjectIds(['aztecconnect'])

      expect(result).toEqual({
        type: 'error',
        error: 'NO_TRANSACTION_API',
      })
    })
  })

  describe(ActivityController.prototype.alignActivityData.name, () => {
    const lastDay = UnixTime.now().toStartOf('day')
    const controller = createController({})

    it('should return the correct chart', () => {
      const apiChartData: DailyTransactionCount[] = [
        { timestamp: lastDay.add(-2, 'days'), count: 1 },
        { timestamp: lastDay.add(-1, 'days'), count: 2 },
        { timestamp: lastDay, count: 3 },
      ]

      const ethChartData: DailyTransactionCount[] = [
        { timestamp: lastDay.add(-2, 'days'), count: 4 },
        { timestamp: lastDay.add(-1, 'days'), count: 5 },
        { timestamp: lastDay, count: 6 },
      ]

      const result = controller.alignActivityData(apiChartData, ethChartData)

      expect(result).toEqual({
        type: 'success',
        data: [
          [lastDay.add(-2, 'days'), 1, 4],
          [lastDay.add(-1, 'days'), 2, 5],
          [lastDay, 3, 6],
        ],
      })
    })

    it('should return error when no data in activity chart', () => {
      const result = controller.alignActivityData(
        [],
        [
          { timestamp: lastDay.add(-2, 'days'), count: 4 },
          { timestamp: lastDay.add(-1, 'days'), count: 5 },
          { timestamp: lastDay, count: 6 },
        ],
      )

      expect(result).toEqual({
        type: 'error',
        error: 'DATA_NOT_SYNCED',
      })
    })

    describe('more eth data than layer2 data', () => {
      it('cut front', () => {
        const apiChartData: DailyTransactionCount[] = [
          { timestamp: lastDay.add(-2, 'days'), count: 1 },
          { timestamp: lastDay.add(-1, 'days'), count: 2 },
        ]

        const ethChartData: DailyTransactionCount[] = [
          { timestamp: lastDay.add(-2, 'days'), count: 4 },
          { timestamp: lastDay.add(-1, 'days'), count: 5 },
          { timestamp: lastDay, count: 6 },
        ]

        const result = controller.alignActivityData(apiChartData, ethChartData)

        expect(result).toEqual({
          type: 'success',
          data: [
            [lastDay.add(-2, 'days'), 1, 4],
            [lastDay.add(-1, 'days'), 2, 5],
          ],
        })
      })

      it('cut back', () => {
        const apiChartData: DailyTransactionCount[] = [
          { timestamp: lastDay.add(-1, 'days'), count: 2 },
          { timestamp: lastDay, count: 3 },
        ]

        const ethChartData: DailyTransactionCount[] = [
          { timestamp: lastDay.add(-2, 'days'), count: 4 },
          { timestamp: lastDay.add(-1, 'days'), count: 5 },
          { timestamp: lastDay, count: 6 },
        ]

        const result = controller.alignActivityData(apiChartData, ethChartData)

        expect(result).toEqual({
          type: 'success',
          data: [
            [lastDay.add(-1, 'days'), 2, 5],
            [lastDay, 3, 6],
          ],
        })
      })
    })

    describe('more layer2 data than eth data', () => {
      it('returns error when eth delayed', () => {
        const apiChartData: DailyTransactionCount[] = [
          { timestamp: lastDay.add(-2, 'days'), count: 1 },
          { timestamp: lastDay.add(-1, 'days'), count: 2 },
          { timestamp: lastDay, count: 3 },
        ]

        const ethChartData: DailyTransactionCount[] = [
          { timestamp: lastDay.add(-2, 'days'), count: 4 },
          { timestamp: lastDay.add(-1, 'days'), count: 5 },
        ]

        const result = controller.alignActivityData(apiChartData, ethChartData)

        expect(result).toEqual({
          type: 'error',
          error: 'ETHEREUM_DATA_DELAYED',
        })
      })

      it('cut back', () => {
        const apiChartData: DailyTransactionCount[] = [
          { timestamp: lastDay.add(-2, 'days'), count: 1 },
          { timestamp: lastDay.add(-1, 'days'), count: 2 },
          { timestamp: lastDay, count: 3 },
        ]

        const ethChartData: DailyTransactionCount[] = [
          { timestamp: lastDay.add(-1, 'days'), count: 5 },
          { timestamp: lastDay, count: 6 },
        ]

        const result = controller.alignActivityData(apiChartData, ethChartData)

        expect(result).toEqual({
          type: 'success',
          data: [
            [lastDay.add(-1, 'days'), 2, 5],
            [lastDay, 3, 6],
          ],
        })
      })
    })

    it('excludes data for projects that do not have data for last 7 days', async () => {
      const includedIds: ProjectId[] = [
        PROJECT_A,
        PROJECT_B,
        ProjectId.ETHEREUM,
      ]

      const controller = new ActivityController(
        includedIds,
        mockObject<Database>({
          activity: mockRepository([
            {
              projectId: ProjectId.ETHEREUM,
              timestamp: TODAY.add(-2, 'days'),
              count: 2137,
              start: 0,
              end: 0,
            },
            {
              projectId: ProjectId.ETHEREUM,
              timestamp: TODAY.add(-1, 'days'),
              count: 420,
              start: 0,
              end: 0,
            },
            {
              projectId: ProjectId.ETHEREUM,
              timestamp: TODAY,
              count: 100,
              start: 0,
              end: 0,
            },
            {
              projectId: PROJECT_A,
              timestamp: TODAY.add(-2, 'days'),
              count: 2,
              start: 0,
              end: 0,
            },
            {
              projectId: PROJECT_A,
              timestamp: TODAY.add(-1, 'days'),
              count: 1,
              start: 0,
              end: 0,
            },
            {
              projectId: PROJECT_B,
              timestamp: TODAY.add(-8, 'days'),
              count: 1337,
              start: 0,
              end: 0,
            },
          ]),
        }),
        mockObject<Clock>({ getLastHour: () => NOW }),
      )

      expect(await controller.getActivity()).toEqual({
        type: 'success',
        data: formatActivity({
          combined: {
            data: [[TODAY.add(-2, 'days'), 2, 2137]],
            estimatedImpact: 0,
            estimatedSince: TODAY.add(-1, 'days'),
          },
          projects: {
            [PROJECT_A.toString()]: [[TODAY.add(-2, 'days'), 2, 2137]],
          },
        }),
      })
    })

    it('makes correct estimations for combined', async () => {
      const fullySyncedProjectsCount = 3

      const fullySyncedProjectIds = range(fullySyncedProjectsCount).map((i) =>
        ProjectId(`synced-${i.toString()}`),
      )
      const notSyncedProjectIds = range(fullySyncedProjectsCount).map((i) =>
        ProjectId(`not-synced-${i.toString()}`),
      )

      const includedIds: ProjectId[] = [
        ...fullySyncedProjectIds,
        ...notSyncedProjectIds,
        ProjectId.ETHEREUM,
      ]

      const txPerDay = {
        eth: 100,
        synced: 4,
        notSynced: 1,
      } as const

      const data: ActivityRecord[] = [
        ...range(0, 5)
          .map((i) => [
            {
              projectId: ProjectId.ETHEREUM,
              timestamp: TODAY.add(-i, 'days'),
              count: txPerDay.eth,
              start: 0,
              end: 0,
            },
            ...fullySyncedProjectIds.map((projectId) => ({
              projectId,
              timestamp: TODAY.add(-i, 'days'),
              count: txPerDay.synced,
              start: 0,
              end: 0,
            })),
          ])
          .flat(),
        ...range(3, 5)
          .map((i) =>
            notSyncedProjectIds.map((projectId) => ({
              projectId,
              timestamp: TODAY.add(-i, 'days'),
              count: txPerDay.notSynced,
              start: 0,
              end: 0,
            })),
          )
          .flat(),
      ].sort((a, b) => a.timestamp.toNumber() - b.timestamp.toNumber())

      const controller = new ActivityController(
        includedIds,
        mockObject<Database>({ activity: mockRepository(data) }),
        mockObject<Clock>({ getLastHour: () => NOW }),
      )

      const result = await controller.getActivity()
      expect(result).toEqual({
        type: 'success',
        data: formatActivity({
          combined: {
            data: [
              [TODAY.add(-4, 'days'), 15, txPerDay.eth],
              [TODAY.add(-3, 'days'), 15, txPerDay.eth],
              [TODAY.add(-2, 'days'), 15, txPerDay.eth],
              [TODAY.add(-1, 'days'), 15, txPerDay.eth],
            ],
            estimatedImpact: 0.2,
            estimatedSince: TODAY.add(-3, 'days'),
          },
          projects: {
            'synced-0': [
              [TODAY.add(-4, 'days'), 4, txPerDay.eth],
              [TODAY.add(-3, 'days'), 4, txPerDay.eth],
              [TODAY.add(-2, 'days'), 4, txPerDay.eth],
              [TODAY.add(-1, 'days'), 4, txPerDay.eth],
            ],
            'synced-1': [
              [TODAY.add(-4, 'days'), 4, txPerDay.eth],
              [TODAY.add(-3, 'days'), 4, txPerDay.eth],
              [TODAY.add(-2, 'days'), 4, txPerDay.eth],
              [TODAY.add(-1, 'days'), 4, txPerDay.eth],
            ],
            'synced-2': [
              [TODAY.add(-4, 'days'), 4, txPerDay.eth],
              [TODAY.add(-3, 'days'), 4, txPerDay.eth],
              [TODAY.add(-2, 'days'), 4, txPerDay.eth],
              [TODAY.add(-1, 'days'), 4, txPerDay.eth],
            ],
            'not-synced-0': [[TODAY.add(-4, 'days'), 1, txPerDay.eth]],
            'not-synced-1': [[TODAY.add(-4, 'days'), 1, txPerDay.eth]],
            'not-synced-2': [[TODAY.add(-4, 'days'), 1, txPerDay.eth]],
          },
        }),
      })
    })
  })
})

function formatActivity({
  combined,
  projects,
}: {
  combined: {
    data: ActivityApiChartPoint[]
    estimatedSince: UnixTime
    estimatedImpact: number
  }
  projects: Record<string, ActivityApiChartPoint[]>
}): ActivityApiResponse {
  return {
    combined: {
      daily: {
        types: ['timestamp', 'transactions', 'ethereumTransactions'],
        data: combined.data,
      },
      estimatedImpact: combined.estimatedImpact,
      estimatedSince: combined.estimatedSince,
    },
    projects: Object.entries(projects).reduce(
      (acc, cur) => {
        acc[cur[0]] = {
          daily: {
            types: ['timestamp', 'transactions', 'ethereumTransactions'],
            data: cur[1],
          },
        }

        return acc
      },
      {} as ActivityApiResponse['projects'],
    ),
  }
}

function createController({
  includedIds,
  repository,
  clock,
}: Partial<{
  includedIds: ProjectId[]
  repository: Database['activity']
  clock: Clock
}>) {
  return new ActivityController(
    includedIds ?? [],
    mockObject<Database>({ activity: repository ?? mockRepository([]) }),
    clock ?? mockObject<Clock>(),
  )
}

function mockRepository(counts: ActivityRecord[]) {
  return mockObject<Database['activity']>({
    getDailyCounts: async () => counts,
  })
}
