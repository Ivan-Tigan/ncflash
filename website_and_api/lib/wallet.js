import { OpKind, TezosToolkit } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { SigningType } from "@airgap/beacon-sdk";
//import config from "../config";
// TODO: Change back to ghostnet or to other testnet address!!!!!!
const preferredNetwork = "ghostnet";
// const preferredNetwork = "mainnet";
const options = {
  name: "Reckless",
  iconUrl: "https://tezostaquito.io/img/favicon.png",
  preferredNetwork: preferredNetwork,
};
const rpcURL = "https://ghostnet.smartpy.io";
// const rpcURL = "https://mainnet.smartpy.io";
const wallet = new BeaconWallet(options);
//OpKind
const getActiveAccount = async () => {
  return {wallet: await wallet.client.getActiveAccount()};
};

export async function connectWallet(){
  let account = await wallet.client.getActiveAccount();

  if (!account) {
    await wallet.requestPermissions({
      network: { type: preferredNetwork },
    });
    account = await wallet.client.getActiveAccount();
  }
  return { success: true, wallet: account.address, pk : account.publicKey};
};

export async function connectWalletNoPopUp(){
  let account = await wallet.client.getActiveAccount();

  if (!account) {
    return { success: false, wallet: "", pk: ""};
  }
  return { success: true, wallet: account.address, pk : account.publicKey};
};

const disconnectWallet = async () => {
  await wallet.disconnect();
  wallet = new BeaconWallet(options);
  return { success: true, wallet: null };
};

const checkIfWalletConnected = async (wallet) => {
  try {
    const activeAccount = await wallet.client.getActiveAccount();
    if (!activeAccount) {
      await wallet.client.requestPermissions({
        type: { network: preferredNetwork },
      });
    }
    return {
      success: true,
      wallet: activeAccount
    };
  } catch (error) {
    return {
      success: false,
      wallet: "",
      error,
    };
  }
};

export const sign = async (msg) => {
  const payload = {
    signingType: SigningType.MICHELINE,
    payload:msg, 
    // sourceAddress:pkh
  }
  const response = await checkIfWalletConnected(wallet);

  if (response.success) {
    const tezos = new TezosToolkit(rpcURL);
    tezos.setWalletProvider(wallet);
    return (await wallet.client.requestSignPayload(payload)).signature
  }
}

export const batch_contracts = async (contract_calls, amount) => {
  // const wallet = new BeaconWallet(options);
  const response = await checkIfWalletConnected(wallet);

  if (response.success) {
    const tezos = new TezosToolkit(rpcURL);
    tezos.setWalletProvider(wallet);
    
    // const contract = await tezos.wallet.at(address);
    // //console.log("s ", args)
    // const operation = contract.methodsObject[func](args);
    
    const batch = await tezos.wallet.batch(
      await Promise.all(contract_calls.map(async contract_call => {
        let contract = await tezos.wallet.at(contract_call.address);
        return {
          kind: OpKind.TRANSACTION, 
          ...contract.methodsObject[contract_call.func](contract_call.args).toTransferParams()  
        }
      }))
    );

    const sending = await batch.send({ amount: amount });
    const result = await sending.confirmation();
    // console.log(result);
  }
};

export const contract = async (address, func, args, amount) => {
  // const wallet = new BeaconWallet(options);
  const response = await checkIfWalletConnected(wallet);

  if (response.success) {
    const tezos = new TezosToolkit(rpcURL);
    tezos.setWalletProvider(wallet);
    const contract = await tezos.wallet.at(address);
    //console.log("s ", args)
    const operation = contract.methodsObject[func](args);
    const sending = await operation.send({ amount: amount });
    const result = await sending.confirmation();
    //console.log(result);
  }
};

export const views = async(address, func, args) => {
  const tezos = new TezosToolkit(rpcURL);
  const contract = await tezos.contract.at(address); 
  return await contract.views[func](args).read();
}

export {
  disconnectWallet,
  getActiveAccount,
  checkIfWalletConnected,
};
