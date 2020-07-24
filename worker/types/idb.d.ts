import  { openDB as o, deleteDB as d, wrap as w, unwrap as u, DBSchema } from 'idb'

interface KeysDB extends DBSchema {
  cryptkeys: {
    key: string
    value: {
      iv: Uint8Array
      cryptKey: CryptoKey
      rawKey: ArrayBuffer
      extKey: string
    }
  }
}

declare global {
  namespace idb {
    const openDB: typeof o
    const deleteDB: typeof d
    const wrap: typeof w
    const unwrap: typeof u
    const KeysDB: KeysDB
  }
}