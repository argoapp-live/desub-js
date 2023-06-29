/**
 * @remarks
 * It could be argued that errors be placed in ../constants.
 * This may be true, however, it is undetermined if we would decide to
 * instantiate actual instances of errors, or write custom error constructors,
 * therefore, we will keep them in their own dir.
 */

export * from './vendor'

export const OWNER_REQUIRED = 'owner required'
export const PROVIDER_REQUIRED = 'provider required'
export const API_KEY_REQUIRED = 'Api key required'
export const INVALID_API_KEY = 'Api key is invalid'
export const INVALID_BICONOMY_KEY = 'Biconomy key is invalid'
export const TRANSACTION_FAILED = 'Transaction failed'
