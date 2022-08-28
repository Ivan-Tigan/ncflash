// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {url} from "url";
let allowences_names1 = ["ledger", "balances"]
let allowences_names2 = ["allowances", "approvals", "operators"];
let allowences_names3 = ["operator", "spender"];
let api_testnet       = "https://api.ghostnet.tzkt.io/v1/"
let address_testnet   = "KT1UsUJkhrD2TRb4NmqmaoUQw3XDBdB2dKZY";

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

export default async function handler(req, res) {

  let query = req.query;
  
  // let url = req.url;
  // if(url.charAt(url.length - 1) === "/") url = url.slice(0, -1);
  // url = url.split("/");
  
  // let query = {};
  // query = url[url.length - 1].split("!")[1];
  // if(typeof query === "undefined") query = {};
  // else query = Object.fromEntries(new Map(query.split("&").map(el => el.split("="))));
  
  
  // console.log("Query", query);
  // let query = {};

  let bigmap = await (await fetch(api_testnet + `contracts/${address_testnet}/storage`, opts_get)).json();
  let data   = (await (await fetch(api_testnet + `bigmaps/${bigmap}/keys`, opts_get)).json());
  
  data = data.filter(d => !((d.key.token_id === "6861" && d.key.contract === "KT1GG8Zd5rUp1XV8nMPRBY2tSyVn6NR5F4Q1" && d.key.address === "tz1h7Tek85LYJPBpG8e5xqCZPAvSMu97tenm") 
                           || (d.key.token_id === "6860" && d.key.contract === "KT1Wdq6sj3ZkNqQ7CeE6kTNbJXfobMX7Eqpz"  && d.key.address === "tz1h7Tek85LYJPBpG8e5xqCZPAvSMu97tenm")));

  if(typeof query.contract !== "undefined" && query.contract !== null) data = data.filter(d => d.key.contract === query.contract);

  if(typeof query.owner !== "undefined" && query.owner !== null) data = data.filter(d => d.key.address === query.owner);

  if(typeof query.token_id !== "undefined" && query.token_id !== null) data = data.filter(d => d.key.token_id === query.token_id);

  let allowed_data = await Promise.all(data.map(async d => await get_allowence(d.key.contract, d.key.address, address_testnet, d.key.token_id)));
    
  data = data.filter((_, i) => allowed_data[i]);

  data = (await Promise.all(data.map(async d => {
    let fee     = d.value.numerator / d.value.denominator;
    d.fee       = fee;   
    let acc     = (await (await fetch(api_testnet + 
                  `tokens/balances?account=${d.key.address}&token.contract=${d.key.contract}&&token.tokenID=${d.key.token_id}`, 
                  opts_get)).json())[0];
    if(typeof acc === "undefined" || acc === null){
      return "empty";
    }
    d.metadata = acc.token.metadata;
    d.balance   = parseInt(acc.balance);
    return d;
  }))).filter(d => (d !== "empty"));

  data.sort((d1, d2) => {
    let res = 0;
    
    if(query.sort === "contract"){

      if(d1.key.contract > d2.key.contract) res = 1;
      else if(d1.key.contract === d2.key.contract) res = 0;  
      else res = -1;

      if(res !== 0) return res;

      if(d1.key.token_id > d2.key.token_id) res = 1;
      else if(d1.key.token_id === d2.key.token_id) res = 0;  
      else res = -1;
      
      return res;
    
    }

    if(query["sort.asc"] === "fee"){

      if(d1.fee < d2.fee) res = -1;
      else if(d1.fee === d2.fee) res = 0;
      else res = 1;

      return res;
    }

    if(query["sort.desc"] === "fee"){

      if(d1.fee > d2.fee) res = -1;
      else if(d1.fee === d2.fee) res = 0;
      else res = 1;

      return res;
    }

    else if(query["sort.desc"] === "quantity"){
      
      if(d1.balance > d2.balance) res = -1;
      else if(d1.fee === d2.fee) res = 0;
      else res = 1;

      return res;
    }

    else if(query["sort.asc"] === "quantity"){
      
      if(d1.balance < d2.balance) res = -1;
      else if(d1.fee === d2.fee) res = 0;
      else res = 1;

      return res;
    }
    
    if(query.sort === "fee"){

      if(d1.fee < d2.fee) res = -1;
      else if(d1.fee === d2.fee) res = 0;
      else res = 1;

      if(res !== 0) return res;

      if(d1.balance > d2.balance) res = -1;
      else if(d1.fee === d2.fee) res = 0;
      else res = 1;

      return res;
    }

    else if(query.sort === "quantity"){
      
      if(d1.balance > d2.balance) res = -1;
      else if(d1.fee === d2.fee) res = 0;
      else res = 1;

      if(res !== 0) return res;
      
      if(d1.fee < d2.fee) res = -1;
      else if(d1.fee === d2.fee) res = 0;
      else res = 1;

      return res;
    }

    return res;

  });

  data = data.map(d => {
    return {asset: {asset_id: {asset_type: d.key.asset_type, contract: d.key.contract, token_id: d.key.token_id}, 
            owner: d.key.address, quantity: d.balance}, fee: d.fee};
  })

  if(typeof query.select === "undefined" || query.select === null || query.select === "fee,asset" || query.select === "asset,fee"){
    res.status(200).json(data);
    return;  
  }

  if(query.select === "asset"){
    data = data.map(d => d.asset);
    res.status(200).json(data);
    return;  
  }

  if(query.select === "fee"){
    data = data.map(d => d.fee);
    res.status(200).json(data);
    return;  
  }

  res.status(200).json(data);
  
  //res.status(200).json({ name: 'John Doe' })
}
