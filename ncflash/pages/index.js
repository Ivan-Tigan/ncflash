import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Table from 'react-bootstrap/Table';
import { useState, useEffect, useCallback } from 'react';

export default function Home() {

  const [pkh, setPkh]        = useState("");
  const [tokens , setTokens] = useState([]);

  let allowences_names1 = ["ledger", "balances"]
  let allowences_names2 = ["allowances", "approvals", "operators"];
  let allowences_names3 = ["operator", "spender"];
  let api_testnet       = "https://api.ghostnet.tzkt.io/v1/"
  let address_testnet   = "KT1UsUJkhrD2TRb4NmqmaoUQw3XDBdB2dKZY";
  let cors_fixer        = "https://higher-order-games.net:9996/";

  let opts_get = {
    method: "GET",
    headers: {
        'Content-Type': 'application/json'
    }
  }

  let isObject = obj => (typeof obj === "object" && obj !== null);

  async function get_allowence(contract, owner, operator, token_id){
    let storage = await (await fetch(api_testnet + `contracts/${contract}/storage`, opts_get)).json();
    
    let get_keys_rec = (obj, stp) => {
      
      let res1 = [];
      let res2 = [];

      if(!isObject(obj) || stp > 12) return [res1, res2];

      Object.keys(obj).map(key => {
        if(allowences_names1.includes(key)){
          res1.push(obj[key]);
          return;
        }
        if(allowences_names2.includes(key)){
          res2.push(obj[key]);
          return;
        }
        let [r1, r2] = get_keys_rec(obj[key], stp + 1);
        res1 = [...res1, ...r1];
        res2 = [...res2, ...r2];
      })

      return [res1, res2];

    }
    
    // if(contract === "KT1PoHKRwgpWqxvnrvsc3PSEJgzQyYTmMTRW"){
    //   console.log("Unic!!!", get_keys_rec(storage), storage);
    // }
    // console.log("BIGMAPS KEYS", Object.keys(storage), storage, api_testnet + `contracts/${contract}/storage`, typeof storage);
    let [r1, r2]    = get_keys_rec(storage);
    let bigmap      = ((r2.length > 0) ? r2[0] : r1[0]);
    let allowences1 = await (await fetch(api_testnet + `bigmaps/${bigmap}/keys?key=${owner}`, opts_get)).json();
    let allowences2 = await (await fetch(api_testnet + `bigmaps/${bigmap}/keys?key.owner=${owner}`, opts_get)).json();
    let allowences3 = await (await fetch(api_testnet + `bigmaps/${bigmap}/keys?key.address_0=${owner}`, opts_get)).json();
    let allowances = [];

    if(allowences1.length > 0){
      allowances=allowences1;
    }

    if(allowences2.length > 0){
      allowances=allowences2;
    }

    if(allowences3.length > 0){
      allowances=allowences3;
    }

    let allowance_exist = allowance => {
      // if(contract === "KT1PzyU2nXYW8RkoFqmqWPFCA7bgC7yGNRoC" && operator === "KT193W4yQZXLwLfW6wzvgVdUYncnC5imvWUq"){
      //   console.log("Here");
      //   return false;
      // }
      if(allowance.active === false) return false;

      if(typeof allowance.key.nat !== "undefined" && typeof allowance.key.address_1 !== "undefined" 
         && allowance.key.nat !== null && allowance.key.address_1 !== null && parseInt(allowance.key.nat) === parseInt(token_id) 
         && allowance.key.address_1 === operator) return true;

      if(typeof allowance.key.token_id !== "undefined" && allowance.key.token_id !== null 
         && parseInt(allowance.key.token_id) !== parseInt(token_id)) return false;
      
      let key_operator = allowences_names3.filter(key => typeof allowance.key[key] !== "undefined" 
                                                  && allowance.key[key] !== null && allowance.key[key] === operator)

      if(key_operator.length > 0) return true;
      
      key_operator = [];

      key_operator = Object.keys(allowance.key).filter(key => typeof allowance.key[key] !== "undefined" 
                                                       && allowance.key[key] !== null && allowance.key[key] === operator)
      
      if(key_operator.length > 0) return true;
      
      if(allowance.value === operator) return true;
      
      if(!isObject(allowance.value)) return false;
      
      if(typeof allowance.value[operator] !== "undefined" && allowance.value[operator] !== null 
         && allowance.value[operator] !== 0 && allowance.value[operator] !== "0") return true;
      
      let val_operator = Object.keys(allowance.value).filter(key => allowance.value[key] !== "undefined" 
                                                             && allowance.value[key] !== null && allowance.value[key] === operator);
      
      if(val_operator.length > 0) return true;
      
      val_operator = [];

      val_operator = allowences_names3.filter(key => allowance.value[key] !== "undefined" 
                                               && allowance.value[key] !== null && allowance.value[key] === operator);

      if(val_operator.length > 0) return true;

      val_operator = [];

      let val = allowences_names2.filter(key => typeof allowance.value[key] !== "undefined" && allowance.value[key] !== null)[0];

      if(allowance.value[val] === operator) return true;
      
      if(!isObject(allowance.value[val])) return false;
      
      if(typeof allowance.value[val][operator] !== "undefined" && allowance.value[val][operator] !== null 
         && allowance.value[val][operator] !== 0 && allowance.value[val][operator] !== "0") return true;

      val_operator = Object.keys(allowance.value[val]).filter(key => allowance.value[val][key] !== "undefined" 
                                                         && allowance.value[val][key] !== null && allowance.value[val][key] === operator);
     
      if(val_operator.length > 0) return true;

      return false;
    }

    let filtered_allowences = allowances.filter(allowance_exist);

    return filtered_allowences.length > 0;

    //return [filtered_allowences.length > 0, contract, allowances, filtered_allowences];

  }

  function submit(){
    try{

      let contract_calls = [];
      let args = tokens.filter(token => (parseFloat(token.fee) !== parseFloat(token.init_fee))).map(token => {
        return {asset_id: {asset_type: {[token.asset_type]: {}}, contract: token.contract, token_id: token.id}, 
                fee: {denominator: 10000, numerator: Math.round(parseFloat(token.fee) * 100)}};
      });
      if(args.length > 0) {
        contract_calls.push({address: address_testnet, func: "set_fee", args})
      }

      let contract_calls_fa1 = [];
      contract_calls_fa1 = tokens.filter(token => token.enabled !== token.init_enabled && token.asset_type === "fa1").map(token => {
        let val;
        if(token.enabled) val = Number.MAX_SAFE_INTEGER;
        else              val = 0; 

        return {address: token.contract, func: "approve", args: {spender: address_testnet, value: val}}
      });

      contract_calls = [...contract_calls, ...contract_calls_fa1];
      let contract_calls_fa2 = [];
      contract_calls_fa2 = tokens.filter(token => token.enabled !== token.init_enabled && token.asset_type === "fa2").map(token => {
        let args;
        if(token.enabled) args = [{add_operator:   {owner: pkh, operator: address_testnet, token_id: token.id}}];
        else              args = [{remove_operator:{owner: pkh, operator: address_testnet, token_id: token.id}}];
        return {address: token.contract, func: "update_operators", args}
      });

      contract_calls = [...contract_calls, ...contract_calls_fa2];
      // console.log(contract_calls);
      if(contract_calls.length === 0) return;
      import('../lib/wallet').then( async (module) => {
        let msg = await module.batch_contracts(contract_calls, 0);
      });
    }
    catch(err){return;}
  }

  function set(cnt, typ, val){
    try{
      let i = tokens.findIndex(el => el.cnt === cnt);
      tokens[i][typ] = val;
      setTokens(tokens);
      // console.log("TOKENS", tokens);
    }
    catch(err){return;}
  }

  function Login(pop_up=true){

    import('../lib/wallet').then( async (module) => {
        try{
          
          let cnn;
          
          if(pop_up) cnn = (await module.connectWallet());
          else       cnn = (await module.connectWalletNoPopUp()); 
          
          if(cnn.success) {
            setPkh(cnn.wallet);
            if(pop_up) window.location.reload(false);
          };
        
        }
        catch(err){return;}
    })
  }

  function Logout(){
    import('../lib/wallet').then( async (module) => {
        try{
            
            let res = (await module.disconnectWallet()).success;
            if(res) setPkh("");
            
        }
        catch(err){return;}
    })
  }

  useEffect(() => {
   
    Login(false);

  }, []);

  // useEffect(() =>{
  //   let aux = async _ => {
  //     let bigmaps = await Promise.all(
  //     [await get_allowence("KT1EjXep6KSodNAPSJDbAAagVTUm5fK82Qtq", "tz1QWSJGvMdSjv3zAYTNX3wdVsh93KfCNgvr", "KT1WvzYHCNBvDSdwafTHv7nJ1dWmZ8GCYuuC"),
  //      await get_allowence("KT1EjXep6KSodNAPSJDbAAagVTUm5fK82Qtq", "tz1QWSJGvMdSjv3zAYTNX3wdVsh93KfCNgvr", "KT1WvzYHCNBvDSdwafTHv7nJ1dWmZ8GCYuuCC"), 
  //      await get_allowence("KT1SjXiUX63QvdNMcM2m492f7kuf8JxXRLp4", "tz1PWtaLXKiHXhXGvpuS8w4sVveNRKedTRSe", "KT1C9gJRfkpPbNdBn3XyYbrUHT6XgfPzZqXP"), 
  //      await get_allowence("KT1SjXiUX63QvdNMcM2m492f7kuf8JxXRLp4", "tz1VhCvo2M7ne6GihA46hqhEoPceFo1Kbhg5", "KT1NLxs6rSYaJikjuCRVbVfg3p9ehfVuQgHC"),
  //      await get_allowence("KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV", "tz1RqPXzNXcCAFiKy1o7aWmeSQb5fXCjywcN", "KT1AbYeDbjjcAnV1QK7EZUUdqku77CdkTuv6"),
  //      await get_allowence("KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV", "tz1RqPXzNXcCAFiKy1o7aWmeSQb5fXCjywcN", "KT1HDXjPtjv7Y7XtJxrNc5rNjnegTi2ZzNfv"),
  //      await get_allowence("KT1JkoE42rrMBP9b2oDhbx6EUr26GcySZMUH", "tz1PWtaLXKiHXhXGvpuS8w4sVveNRKedTRSe", "KT1NEa7CmaLaWgHNi6LkRi5Z1f4oHfdzRdGA"),
  //      await get_allowence("KT1JkoE42rrMBP9b2oDhbx6EUr26GcySZMUH", "tz1PWtaLXKiHXhXGvpuS8w4sVveNRKedTRSe", "KT1NEa7CmaLaWgHNi6LkRi5Z1f4oHfdzRdGAA"),
  //      await get_allowence("KT1PzyU2nXYW8RkoFqmqWPFCA7bgC7yGNRoC", "tz1fxojJcp9viALhishZ34pkmnHgEwiies3p", "KT193W4yQZXLwLfW6wzvgVdUYncnC5imvWUq", ""),
  //      await get_allowence("KT1PzyU2nXYW8RkoFqmqWPFCA7bgC7yGNRoC", "tz1fxojJcp9viALhishZ34pkmnHgEwiies3p", "KT1PnmpVWmA5CBUsA5ZAx1HoDW67mPYurAL5", ""), 
  //      await get_allowence("KT1Wdq6sj3ZkNqQ7CeE6kTNbJXfobMX7Eqpz", "tz1MnmtP4uAcgMpeZN6JtyziXeFqqwQG6yn6", "KT1Bgr9d6t9jk232KChDsZp9aifwcFpZzGr4", ""),
  //      await get_allowence("KT1Wdq6sj3ZkNqQ7CeE6kTNbJXfobMX7Eqpz", "tz1MnmtP4uAcgMpeZN6JtyziXeFqqwQG6yn6", "KT19XGtSgexxCk65cJvafKjLZZU76dHKGhfW", ""), 
  //      await get_allowence("KT1GG8Zd5rUp1XV8nMPRBY2tSyVn6NR5F4Q1", "tz1imMvYWR2AoS7bN8BjkQK1zPp78c9Py52u", "KT1KS6bzoC6m1taqQjx1Jy1CXGJb9biQbGg8", ""),
  //      await get_allowence("KT1GG8Zd5rUp1XV8nMPRBY2tSyVn6NR5F4Q1", "tz1imMvYWR2AoS7bN8BjkQK1zPp78c9Py52u", "KT1GjgXdwaMjjwXcS2JURcMA53WRq9qW1nZF", "")]);
  //     console.log(bigmaps);
  //     return bigmaps;
  //   }
  //   aux();
  // }, []);

  useEffect(() => {
    
    if(pkh === "") return;

    let get_tokens = async () => {
      
      let res = [];
      let balances = await (await fetch(api_testnet + `tokens/balances?account=${pkh}`, opts_get)).json();
      balances = await Promise.all(balances.map(async (balance, cnt) => {
        let numerator    = balance.balance;
        let denominator  = Math.pow(10, balance.token.metadata.decimals);
        let name         = balance.token.metadata.name;
        let asset_type   = (balance.token.standard === "fa1.2" ? "fa1" : balance.token.standard);
        let address      = balance.token.contract.address;
        let id           = balance.token.tokenId;
        let enabled      = await get_allowence(address, pkh, address_testnet, id);
        // console.log("Important!", address, pkh, address_testnet, id);
        let init_enabled = enabled;
        let bigmap       = await (await fetch(api_testnet + `contracts/${address_testnet}/storage`, opts_get)).json();
        let b            = (await (await fetch(api_testnet + 
                            `bigmaps/${bigmap}/keys?key.address=${pkh}&key.contract=${address}&key.token_id=${id}`, 
                            opts_get)).json());
        let a={};
        if(typeof b !== "undefined" && typeof b[0] !== "undefined") a = b[0].value;
        else                         {a.numerator = 0; a.denominator = 1;};
        let fee          = parseFloat(parseFloat(a.numerator) / (parseFloat(a.denominator) / 100)).toFixed(2);
        let init_fee     = fee;
        //console.log("B FA1 KEY", Object.keys(b.key.asset_type)[0], typeof Object.keys(b.key.asset_type)[0]);


        // let allowence    = false;
        // if(asset_type !== "fa2"){
        //   allowence = await import('../lib/wallet').then( async (module) => {
        //     try{
                
        //         let res = await module.views(address, "getAllowance", {owner: pkh, spender: address_testnet});
        //         // let res = await module.views(address, "getBalance", pkh);
        //         console.log("Ok", res);
        //         return res;
                
        //     }
        //     catch(err){console.log("Error", err); return;}
        //   })
        // }


        // let allowences  = 
        // let storage     = await (await fetch(api_testnet + `contracts/${address}/storage`, opts_get)).json();
        //let allowences  = 
        // let ledger;
        // if(typeof storage.ledger !== "undefined") ledger = storage.ledger;
        // else                                      ledger = storage.balances;
        //`https://api.ghostnet.tzkt.io/v1/bigmaps/${pkh}/keys?key=${pkh}`
        // console.log("Storage", storage);
        // if(standard === "fa2"){
          
        // }

        //console.log({name, balance: (numerator / denominator).toFixed(3), contract: address, asset_type, id, cnt, enabled, fee});

        return {name, balance: (numerator / denominator).toFixed(3), contract: address, 
                asset_type, id, cnt, enabled, fee, init_enabled, init_fee};
      }));
      
      setTokens(balances); 
      //let enabled_and_fees = check fees from storage
    }
    
    get_tokens();

  }, [pkh])

  return (
    <div className={styles.container}>
      <Head>
        <title>NC Flash</title>
        <meta name="description" content="NC Flash" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title} style={{marginBottom: "40px"}}>
          Welcome to <span style={{color: "#0070f3"}}>NC Flash</span>
        </h1>
        {
          (pkh !== "")
          ?
            <>
              <p>Public Key Hash: {pkh}</p>
              <p>Get testnet assets: &nbsp;<a target="_blank" style={{color: "#0070f3"}} href={"https://ghostnet.quipuswap.com/swap/tez-KT19363aZDTjeRyoDkSLZhCk62pS4xfvxo6c_0"}>https://ghostnet.quipuswap.com/swap/</a></p>
              <p>Set your lending preferences:</p>
              <Table striped bordered hover variant="dark">
                <thead>
                  <tr>
                    <th>Token Name</th>
                    <th>Balance</th>
                    <th>Enable</th>
                    <th>Fee %</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map(token =>
                    <tr>
                      <td>{token.name}</td>
                      <td>{token.balance}</td>
                      <td><input type="checkbox" defaultChecked={token.enabled} onChange={e => set(token.cnt, "enabled", e.target.checked)} /></td>
                      <td><input type="number" defaultValue={token.fee} step="0.01" min={0.01} max={100} style={{width: "60px"}} onChange={e => set(token.cnt, "fee", e.target.value)} /></td>
                    </tr>
                  )}
                </tbody>
              </Table>

              <button style={{marginBottom: "20px", marginTop: "25px", padding: "7px"}} onClick={() => submit()}>Submit</button>
              <button style={{padding: "7px"}} onClick={() => Logout()}>Logout</button>
            </>
          : <button style={{padding: "7px"}} onClick={() => Login()}>Login</button>
        }

      </main>
        {/* <p className={styles.description}>
          Get started by editing{' '}
          <code className={styles.code}>pages/index.js</code>
        </p>

        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Documentation &rarr;</h2>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a href="https://nextjs.org/learn" className={styles.card}>
            <h2>Learn &rarr;</h2>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>

          <a
            href="https://github.com/vercel/next.js/tree/canary/examples"
            className={styles.card}
          >
            <h2>Examples &rarr;</h2>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
          >
            <h2>Deploy &rarr;</h2>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer> */}
    </div>
  )
}
