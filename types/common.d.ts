import { DBSchema } from 'idb'

export interface KeysDB extends DBSchema {
  cryptkeys: {
    key: string
    value: {
      iv: Uint8Array
      cryptKey: CryptoKey
      rawKey: ArrayBuffer
      extKey: string
    }
  }
  settings: {
    key: 0
    value: {
      encryption: boolean
    }
  }
}
