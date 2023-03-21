import { ERC20_ABI, PAYMENT_ABI, SUBSCRIPTION_DATA_ABI, SUBSCRIPTION_PAYMENT_ABI } from './constants'
import Deployed from './abstracts/deployed'
import Vendor from './abstracts/vendor'
import { TxResponse } from './interfaces'
import { API_KEY_REQUIRED, INVALID_BICONOMY_KEY } from './errors'
import { akashTokenId, arweaveTokenId } from './constants/price-feed'

export default class Payment extends Deployed {
  coinMarketCapKey?: string

  /**
   * @param vendor - Instance of a Vendor class
   * @param coinMarketCapKey - Optional CoinMarketCap API key
   */
  constructor(vendor: Vendor, coinMarketCapKey?: string) {
    super(vendor, PAYMENT_ABI, ERC20_ABI, SUBSCRIPTION_PAYMENT_ABI, SUBSCRIPTION_DATA_ABI)
    this.coinMarketCapKey = coinMarketCapKey
  }

  /**
   * @remarks
   * This method is used when we do not want to charge the user with the fee for deployment, but only for build time.
   *
   * @param userAddress - Address of the user
   * @param buildTimeInSeconds - Built time (in seconds) after deployment completion
   * @param deploymentCost - Deployment cost charged by the provider in USD
   * @param providerQuote - Price of storage provider's token
   * @param providerCharged - Tokens of storage provider charged for deploying
   * @param providerName - Name of the storage provider
   * @returns Promise that resolves with the transaction response
   */
  async paymentWithFee(
    userAddress: string,
    buildTimeInSeconds: string,
    deploymentCost: string,
    providerQuote: any,
    providerCharged: any,
    providerName: string,
  ): Promise<TxResponse> {
    const wei = this.vendor.convertToWei(deploymentCost, this.tokenPrecision ?? 18)
    const buildTime = this.vendor.convertToBN(buildTimeInSeconds)
    const quote = this.vendor.convertToWei(providerQuote, this.tokenPrecision ?? 18)
    const charge = this.vendor.convertToWei(providerCharged, this.tokenPrecision ?? 18)

    return await this.paymentsContract?.functions.chargeWithProvider(
      userAddress,
      buildTime,
      wei,
      quote,
      charge,
      providerName,
    )
  }

  /**
   * @remarks
   * This method is used when we want to charge the user for the fee for deployment as well as for the build time.
   *
   * @param userAddress - Address that is to be charged
   * @param buildTimeInSeconds - Built time (in seconds) after deployment completion
   * @returns Promise that resolves with the transaction response
   */
  async paymentWithoutFee(userAddress: string, buildTimeInSeconds: string): Promise<TxResponse> {
    const buildTime = this.vendor.convertToBN(buildTimeInSeconds)

    return await this.paymentsContract?.functions.charge(userAddress, buildTime)
  }

  /**
   * @remarks
   * This method can be used to update the address of the underlying token.
   *
   * @param address - Address of the token to use for charging users
   * @returns Promise that resolves with the transaction response
   */
  async updateUnderlyingToken(address: string): Promise<TxResponse> {
    return await this.paymentsContract?.functions.updateUnderlyingToken(address)
  }
  /**
   * @remarks
   * This method can be used to updated address of vault/escrow account
   *
   * @param a - address of escrow contract(vault)
   */
  async updateEscrow(a: string): Promise<TxResponse> {
    return await this.paymentsContract?.functions.updateEscrow(a)
  }
  /**
   * @remarks
   * This method can be used to updated address of oracle price feed.
   *
   * @param a - address of escrow contract(vault)
   */
  async updateFeederAddress(a: string): Promise<TxResponse> {
    return await this.paymentsContract?.functions.updateFeederAddress(a)
  }
  /**
   * @remarks
   * This method can be used to updated address of staked token
   *
   * @param a - address of escrow contract(vault)
   */
  async updateStakedToken(a: string): Promise<TxResponse> {
    return await this.paymentsContract?.functions.updateStakedToken(a)
  }
  /**
   * @remarks
   * This method can be called by owner to change the token address if for some reason token in changed
   *
   * @param a - address of escrow ArGo token, if for some reason new one needs to be passed
   */
  async updateToken(a: string): Promise<TxResponse> {
    return await this.paymentsContract?.functions.updateToken(a)
  }

  /**
   * @remarks
   * This method can only be called by governance account and can be called to updated discount slabs.
   *
   * @param d - array of prices for discount slabs
   * @param p - array of percent of each slab
   */
  async updateDiscountSlabs(d: Array<string>, p: Array<string>): Promise<TxResponse> {
    const discountSlabs = this.vendor.convertStringArrayToBigNumberArray(d)
    const percents = this.vendor.convertStringArrayToBigNumberArray(p)
    return await this.paymentsContract?.functions.updateDiscountSlabs(discountSlabs, percents)
  }

  /**
   * @remarks
   * This method can only be called by governance to change price we charge per microsecond for build.
   *
   * @param p - updated price per microsecond.
   *
   */
  async changeBuildTimeRate(p: string): Promise<TxResponse> {
    const wei = this.vendor.convertToWei(p, this.tokenPrecision || 18)
    return await this.paymentsContract?.functions.changeBuildTimeRate(wei)
  }
  /**
   * @remarks
   * This method can only be called by owner, to give enable discount.
   *
   * @param h - address of staking manager.
   */
  async enableDiscounts(h: string): Promise<TxResponse> {
    return await this.paymentsContract?.functions.enableDiscounts(h)
  }

  /**
   * @remarks
   * This method can only be called by owner, to give disable discount.
   *
   */
  async disableDiscounts(): Promise<TxResponse> {
    return await this.paymentsContract?.functions.disableDiscounts()
  }

  /**
   * @remarks
   * This method can only be called by owner, to update governance contract address.
   *
   * @param h - address of governance contract.
   */
  async setGovernanceAddress(h: string): Promise<TxResponse> {
    return await this.paymentsContract?.functions.setGovernanceAddress(h)
  }

  /**
   * @remarks
   * This method can only be called by owner, to set new  owners.
   *
   * @param h - array of addresses of new oweners.
   */
  async setManagers(h: Array<string>): Promise<TxResponse> {
    return await this.paymentsContract?.functions.setManagers(h)
  }

  /**
   * @remarks
   * Update approval for ArGo token
   * Dont use this function without frontend
   *
   * @param a - new approval amount.
   */
  async setNewApprovals(a: string): Promise<TxResponse> {
    const wei = this.vendor.convertToWei(a, this.tokenPrecision || 18)
    return await this.erc20Contract?.functions.approve(this.paymentsContract?.address, wei)
  }
  /**
   * @remarks
   * This function updates the approval for ArGo token using Biconomy's gasless feature.
   * It should only be called from the frontend.
   *
   * @param approvalAmount - The new approval amount as a string.
   * @param chainId - The ID of the blockchain network to use.
   * @returns A promise that resolves to a transaction response object.
   */
  async gasslessApproval(approvalAmount: string, chainId: number): Promise<TxResponse> {
    if (!this.vendor.biconomy) throw new Error(INVALID_BICONOMY_KEY)

    const wei = this.vendor.convertToWei(approvalAmount, this.tokenPrecision || 18)
    const abiEncodedApprove = this.vendor.abiEncodeErc20Functions('approve', [this.paymentsContract?.address, wei])
    const userAddress = await this.vendor.signer.getAddress()
    const nonce = await this.getNonceForGaslessERC20(userAddress)
    const signedMessage = await this.vendor.signedMessageForTx(
      userAddress,
      nonce,
      abiEncodedApprove,
      this.erc20Contract?.address || '',
      chainId,
    )
    const rsv = this.vendor.getSignatureParameters(signedMessage)
    return await this.sendRawBiconomyERC20Transaction(userAddress, abiEncodedApprove, rsv)
  }
  /**
   *
   * @remarks
   * returns abi enocoded erc20 function
   * @param u - user address
   * @param f - abi encoded function
   * @param rsv - rsv values
   */
  async sendRawBiconomyERC20Transaction(u: string, f: string, rsv: any): Promise<any> {
    if (this.vendor.biconomy.status === this.vendor.biconomy.READY) {
      const tx = await this.biconomyERC20Contract?.functions.executeMetaTransaction(u, f, rsv.r, rsv.s, rsv.v)
      return tx
    } else {
      return new Promise((resolve, reject) => {
        this.vendor.biconomy
          .onEvent(this.vendor.biconomy.READY, async () => {
            const tx = await this.biconomyERC20Contract?.functions.executeMetaTransaction(u, f, rsv.r, rsv.s, rsv.v)
            resolve(tx)
          })
          .onEvent(this.vendor.biconomy.ERROR, (error: string) => {
            console.log(error)
            reject(error)
          })
      })
    }
  }

  /**
   * Get the allowance amount for the specified user address.
   *
   * @remarks
   * This function converts the allowance amount from wei to ether using the specified token precision or a default value of 18 if not provided.
   *
   * @param userAddress - The user address for which to retrieve the allowance amount.
   * @returns The allowance amount in ether.
   */
  async getApprovalAmount(userAddress: string): Promise<number> {
    const allowanceInWei = await this.erc20Contract?.functions.allowance(userAddress, this.paymentsContract?.address)
    const allowanceInEth = this.vendor.convertWeiToEth(allowanceInWei, this.tokenPrecision ?? 18)
    return allowanceInEth
  }

  /**
   * Get nonce for gasless transaction on ERC20.
   * @param userAddress - The user's address.
   * @returns The nonce.
   */
  async getNonceForGaslessERC20(userAddress: string): Promise<number> {
    const nonce = await this.erc20Contract?.functions.getNonce(userAddress)
    return nonce?.[0]?.toNumber() ?? 0
  }

  /**
   * @remarks
   * Get given Allowance amount.
   *
   * @param a - user address
   */
  async getUserBalance(a: string): Promise<any> {
    const wei = await this.erc20Contract?.functions.balanceOf(a)
    return this.vendor.convertWeiToEth(wei, this.tokenPrecision || 18)
  }

  /**
   * @remarks
   * Get owners list.
   *
   */
  async getManagers(): Promise<Array<string>> {
    return await this.paymentsContract?.functions.getManagers()
  }

  /**
   * @remarks
   * Get govornance address.
   *
   */
  async getGovernanceAddress(): Promise<string> {
    return await this.paymentsContract?.functions.governanceAddress()
  }

  /**
   * @remarks
   * Get underlying token address (Argo).
   *
   */
  async getToken(): Promise<string> {
    return await this.paymentsContract?.functions.underlying()
  }

  /**
   * @remarks
   * Get escrow address.
   *
   */
  async getEscrow(): Promise<string> {
    return await this.paymentsContract?.functions.escrow()
  }

  /**
   * @remarks
   * Get discount status.
   *
   */
  async checkIfDiscountsEnabled(): Promise<boolean> {
    return await this.paymentsContract?.functions.discountsEnabled()
  }

  /**
   * @remarks
   * Get staking manager  address.
   *
   */
  async getStakingManagerAddress(): Promise<string> {
    return await this.paymentsContract?.functions.stakingManager()
  }
  /**
   * @remarks
   * Get staking manager  address.
   *
   */
  async getStakedTokenAddress(): Promise<string> {
    return await this.paymentsContract?.functions.stakedToken()
  }
  /**
   * @remarks
   * Get discount slabs.
   *
   */
  async getDiscountSlabs(): Promise<any> {
    const slabs = await this.paymentsContract?.functions.discountSlabs()
    return this.vendor.parseDiscountSlabs(slabs)
  }
  /**
   * @remarks
   * Get areweave converted to usd
   *
   * @param a amount of areweave
   */
  async getArweaveConvertedUsd(a: string): Promise<number> {
    if (!this.coinMarketCapKey) throw new Error(API_KEY_REQUIRED)
    const qoute = await this.services.tokenToUSD(a, arweaveTokenId, this.coinMarketCapKey)
    return qoute
  }
  /**
   * @remarks
   * Get areweave converted to usd
   *
   * @param a amount of areweave
   */
  async getArweaveQuote(): Promise<number> {
    if (!this.coinMarketCapKey) throw new Error(API_KEY_REQUIRED)
    const qoute = await this.services.tokenQuote(arweaveTokenId, this.coinMarketCapKey)
    return qoute
  }
  /**
   * @remarks
   * Get areweave converted to usd
   *
   * @param a amount of areweave
   */
  async getAkashConvertedUsd(a: string): Promise<number> {
    if (!this.coinMarketCapKey) throw new Error(API_KEY_REQUIRED)
    const qoute = await this.services.tokenToUSD(a, akashTokenId, this.coinMarketCapKey)
    return qoute
  }
  /**
   * @remarks
   * Get areweave converted to usd
   *
   * @param a amount of areweave
   */
  async getAkashQuote(): Promise<number> {
    if (!this.coinMarketCapKey) throw new Error(API_KEY_REQUIRED)
    const qoute = await this.services.tokenQuote(akashTokenId, this.coinMarketCapKey)
    return qoute
  }
}
