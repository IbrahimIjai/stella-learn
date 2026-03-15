/**
 * Stellar Helper - Blockchain Logic with Stellar Wallets Kit
 * Modified to bypass Vite/Nitro SSR issues by loading StellarSDK dependencies lazily.
 */

// Types can be statically imported safely
import type * as StellarSdkType from "@stellar/stellar-sdk";
import type {
  StellarWalletsKit as StellarWalletsKitType,
} from "@creit-tech/stellar-wallets-kit/sdk";


export const CROWDFUND_CONTRACT_ID = "CDSZUEZN5XEEORSDRFBQVQQJOYRXH7AOEIMSMZTF5KBH3AKCJAHIKOID";

export interface Campaign {
  id: number;
  admin: string;
  token: string;
  balance: bigint;
}

let _kitInitialized = false;

async function getSdk(): Promise<typeof StellarSdkType> {
  return await import("@stellar/stellar-sdk");
}

async function getKit(): Promise<{
  StellarWalletsKit: typeof StellarWalletsKitType,
  allowAllModules: any
}> {
  const sdkModule = await import("@creit-tech/stellar-wallets-kit/sdk");
  const utilsModule = await import("@creit-tech/stellar-wallets-kit/modules/utils");
  
  return {
    StellarWalletsKit: sdkModule.StellarWalletsKit,
    allowAllModules: utilsModule.defaultModules 
  };
}

export class StellarHelper {
  private networkMode: "testnet" | "mainnet";
  private networkPassphrase: Promise<string> | string = "";

  constructor(network: "testnet" | "mainnet" = "testnet") {
    this.networkMode = network;
  }

  private async getRpcServer() {
    const sdk = await getSdk();
    return new sdk.rpc.Server(
      this.networkMode === "testnet"
        ? "https://soroban-testnet.stellar.org"
        : "https://soroban-mainnet.stellar.org"
    );
  }

  private async getPassphrase() {
    const sdk = await getSdk();
    return this.networkMode === "testnet"
      ? sdk.Networks.TESTNET
      : sdk.Networks.PUBLIC;
  }

  private async ensureInitializedKit() {
    if (_kitInitialized) return;
    
    const kitModules = await getKit();
    const passphrase = await this.getPassphrase();

    kitModules.StellarWalletsKit.init({
      network: passphrase as any,
      modules: kitModules.allowAllModules(),
    });
    
    _kitInitialized = true;
  }

  isFreighterInstalled(): boolean {
    return true; // The kit handles this
  }

  async getAddress(): Promise<string> {
    await this.ensureInitializedKit();
    const kitModules = await getKit();
    
    const { address } = await kitModules.StellarWalletsKit.getAddress();
    if (!address) {
      throw new Error("Wallet not connected");
    }
    return address;
  }

  async connectWallet(): Promise<string> {
    await this.ensureInitializedKit();
    const kitModules = await getKit();
    
    const { address } = await kitModules.StellarWalletsKit.authModal();
    if (!address) throw new Error("Wallet not connected");
    return address;
  }

  async disconnect() {
    await this.ensureInitializedKit();
    const kitModules = await getKit();
    
    kitModules.StellarWalletsKit.disconnect();
  }

  async getCampaign(id: number): Promise<Campaign | null> {
    try {
      const sdk = await getSdk();
      const rpc = await this.getRpcServer();
      const passphrase = await this.getPassphrase();
      const contract = new sdk.Contract(CROWDFUND_CONTRACT_ID);
      
      const args = [sdk.nativeToScVal(id, { type: "u64" })];

      const response = await rpc.simulateTransaction(
        new sdk.TransactionBuilder(
          new sdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"), // dummy account for sim
          { fee: "100", networkPassphrase: passphrase }
        )
          .addOperation(contract.call("get_campaign", ...args))
          .setTimeout(30)
          .build()
      );

      if (!sdk.rpc.Api.isSimulationSuccess(response) || !response.result) return null;
      const result = response.result;

      // Extract details from scVal
      const returnValue = sdk.scValToNative(result.retval);
      
      // Expected native type from struct: { admin: string, token: string, balance: bigint }
      return {
        id,
        admin: returnValue.admin,
        token: returnValue.token,
        balance: BigInt(returnValue.balance)
      };
    } catch (e: any) {
      if (e.message?.includes("Campaign does not exist")) {
        return null;
      }
      return null;
    }
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    const campaigns: Campaign[] = [];
    let currentId = 1;
    let keepChecking = true;

    while (keepChecking) {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(this.getCampaign(currentId + i));
      }
      const results = await Promise.all(promises);
      
      for (const res of results) {
        if (res) {
           campaigns.push(res);
        } else {
           keepChecking = false;
        }
      }
      currentId += 5;
    }

    return campaigns;
  }

  async createCampaign(admin: string, token: string): Promise<string> {
    const sdk = await getSdk();
    const rpc = await this.getRpcServer();
    const passphrase = await this.getPassphrase();
    
    await this.ensureInitializedKit();
    const kitModules = await getKit();
    
    const contract = new sdk.Contract(CROWDFUND_CONTRACT_ID);
    
    // admin, token
    const args = [
      sdk.nativeToScVal(admin, { type: "address" }),
      sdk.nativeToScVal(token, { type: "address" })
    ];

    const source = await rpc.getAccount(admin);

    const txBuilder = new sdk.TransactionBuilder(source, {
      fee: "100",
      networkPassphrase: passphrase,
    })
      .addOperation(contract.call("create_campaign", ...args))
      .setTimeout(30);

    const tx = txBuilder.build();

    // Simulate to get footprint & proper fees
    const preparedTx = await rpc.prepareTransaction(tx);
    
    // Switch to Wallet Kit for signing instead of signing with auth modal
    const { signedTxXdr } = await kitModules.StellarWalletsKit.signTransaction(preparedTx.toXDR(), {
      networkPassphrase: passphrase,
      // Pass address since v2 requires it
      address: admin,
    });

    const parsedTx = sdk.TransactionBuilder.fromXDR(signedTxXdr, passphrase);
    
    const response = await rpc.sendTransaction(parsedTx as StellarSdkType.Transaction);
    
    if (response.status === "ERROR") {
      throw new Error("Transaction submission failed");
    }

    return await this.pollTransaction(response.hash);
  }

  async deposit(user: string, campaignId: number, amountStr: string): Promise<string> {
    const sdk = await getSdk();
    const rpc = await this.getRpcServer();
    const passphrase = await this.getPassphrase();
    
    await this.ensureInitializedKit();
    const kitModules = await getKit();
    
    const contract = new sdk.Contract(CROWDFUND_CONTRACT_ID);
    
    // We convert the string amount (e.g. "100") to i128 representing units
    // e.g. 100 XLM is 100 * 10^7 stroops
    const amount = BigInt(Math.floor(parseFloat(amountStr) * 1e7));

    const args = [
      sdk.nativeToScVal(user, { type: "address" }),
      sdk.nativeToScVal(campaignId, { type: "u64" }),
      sdk.nativeToScVal(amount, { type: "i128" }),
    ];

    const source = await rpc.getAccount(user);

    const tx = new sdk.TransactionBuilder(source, {
      fee: "100",
      networkPassphrase: passphrase,
    })
      .addOperation(contract.call("deposit", ...args))
      .setTimeout(30)
      .build();

    const preparedTx = await rpc.prepareTransaction(tx);

    const { signedTxXdr } = await kitModules.StellarWalletsKit.signTransaction(preparedTx.toXDR(), {
      networkPassphrase: passphrase,
      address: user,
    });

    const parsedTx = sdk.TransactionBuilder.fromXDR(signedTxXdr, passphrase);
    const response = await rpc.sendTransaction(parsedTx as StellarSdkType.Transaction);

    if (response.status === "ERROR") {
      throw new Error("Transaction submission failed");
    }

    return await this.pollTransaction(response.hash);
  }

  async withdraw(admin: string, campaignId: number, recipient: string): Promise<string> {
    const sdk = await getSdk();
    const rpc = await this.getRpcServer();
    const passphrase = await this.getPassphrase();
    
    await this.ensureInitializedKit();
    const kitModules = await getKit();
    
    const contract = new sdk.Contract(CROWDFUND_CONTRACT_ID);

    const args = [
      sdk.nativeToScVal(campaignId, { type: "u64" }),
      sdk.nativeToScVal(recipient, { type: "address" }),
    ];

    const source = await rpc.getAccount(admin);

    const tx = new sdk.TransactionBuilder(source, {
      fee: "100",
      networkPassphrase: passphrase,
    })
      .addOperation(contract.call("withdraw", ...args))
      .setTimeout(30)
      .build();

    const preparedTx = await rpc.prepareTransaction(tx);

    const { signedTxXdr } = await kitModules.StellarWalletsKit.signTransaction(preparedTx.toXDR(), {
      networkPassphrase: passphrase,
      address: admin,
    });

    const parsedTx = sdk.TransactionBuilder.fromXDR(signedTxXdr, passphrase);
    const response = await rpc.sendTransaction(parsedTx as StellarSdkType.Transaction);

    if (response.status === "ERROR") {
      throw new Error("Transaction submission failed");
    }

    return await this.pollTransaction(response.hash);
  }

  private async pollTransaction(hash: string): Promise<string> {
    const rpc = await this.getRpcServer();
    let status = await rpc.getTransaction(hash);
    let attempts = 0;
    while (status.status === "NOT_FOUND" && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      status = await rpc.getTransaction(hash);
      attempts++;
    }

    if (status.status === "SUCCESS") {
      return hash;
    } else {
      throw new Error("Transaction failed or not found");
    }
  }
}

export const stellar = new StellarHelper("testnet");
