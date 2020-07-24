import { openDB as o, deleteDB as d, wrap as w, unwrap as u } from 'idb'
import { KeysDB } from '../../types/common'

declare global {
  namespace idb {
    const openDB: typeof o
    const deleteDB: typeof d
    const wrap: typeof w
    const unwrap: typeof u
    const KeysDB: KeysDB
  }
}