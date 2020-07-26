import { DBSchema } from 'idb'

interface ISettings {
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
      embed: boolean
    }
  }
}

export type KeysDB = ISettings & DBSchema
export type TSettings = ISettings['settings']['value']
export type TSetting = keyof ISettings
