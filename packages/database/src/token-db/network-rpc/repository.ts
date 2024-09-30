import { BaseRepository } from '../../BaseRepository'
import { UpsertableNetworkRpcRecord, upsertableToRow } from './entity'

export class NetworkRpcRepository extends BaseRepository {
  async insertMany(records: UpsertableNetworkRpcRecord[]): Promise<number> {
    if (records.length === 0) return 0

    const rows = records.map(upsertableToRow)
    await this.batch(rows, 1_000, async (batch) => {
      await this.db.insertInto('NetworkRpc').values(batch).execute()
    })
    return records.length
  }
}
