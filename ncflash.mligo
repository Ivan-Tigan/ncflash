#include "fa2_interface.mligo"

type fa1_approve_param = {spender:address; value:nat}
type fa1_transfer =
  [@layout:comb]
  { [@annot:from] address_from : address;
    [@annot:to] address_to : address;
    value : nat }

type asset_type = |Fa1 |Fa2
type asset_id = {contract:address; asset_type:asset_type; token_id:token_id}
type asset = {
    asset_id:asset_id;
    owner:address;
    quantity: nat;
}
type fee = {numerator:nat; denominator:nat}
type ncflash_storage = {
    lending_fees: (address * asset_id, fee) map;
}

let asset_to_transfer_ops ((asset,s): asset * ncflash_storage) = 
    let fee_multiplier (n:nat) = match (Map.find_opt (asset.owner, asset.asset_id) s.lending_fees) with Some fee -> (n * (fee.numerator + fee.denominator))/fee.denominator | None -> n in
    match asset.asset_id.asset_type with 
    | Fa2 -> 
        let c = (Tezos.get_entrypoint "%transfer" asset.asset_id.contract : transfer list contract) in
        let arg1 = [{
            from_ = asset.owner;
            txs = [{
                to_ = Tezos.get_sender();
                token_id = asset.asset_id.token_id;
                amount = asset.quantity;
            }]
        }] in 
        let arg2 = [{
            from_ = Tezos.get_sender();
            txs = [{
                to_ = asset.owner;
                token_id = asset.asset_id.token_id;
                amount = fee_multiplier(asset.quantity);
            }]
        }] in 
        Tezos.transaction arg1 0tez c, Tezos.transaction arg2 0tez c 
    | Fa1 -> 
        let c = (Tezos.get_entrypoint "%transfer" asset.asset_id.contract : fa1_transfer contract) in
        let arg1 = {
            address_from=asset.owner;
            address_to=Tezos.get_sender();
            value=asset.quantity;
        } in
        let arg2 = {
            address_from=Tezos.get_sender();
            address_to=asset.owner;
            value=fee_multiplier(asset.quantity);
        } in
        Tezos.transaction arg1 0tez c, Tezos.transaction arg2 0tez c 
type flash_loan_args = {
    assets: asset list;
    k_args:bytes;
    k_op:bytes contract;
}
type set_fee_args = {
    asset_id:asset_id;
    fee:fee;
}
type ncflash_entrypoint = 
| Flash_loan of flash_loan_args
| Set_fee of set_fee_args list 

let ncflash_main ((e,s): ncflash_entrypoint * ncflash_storage) = 
    match e with 
    |Flash_loan flash_loan_args ->
        let k = Tezos.transaction flash_loan_args.k_args 0tez flash_loan_args.k_op in 
        let assets = flash_loan_args.assets in
        let give, ret = 
            List.fold_left (fun (((give, ret), a):(operation list * operation list) * asset ) -> 
                let g,r = asset_to_transfer_ops(a,s) in g::give,r::ret 
            ) (([],[]) : operation list * operation list) assets in 
        let ops = List.fold_left (fun ((acc, o) : operation list * operation) -> o::acc) (k::ret) give in
        ops,s

    | Set_fee sfs -> 
        ([]:operation list), List.fold_left (fun ((s, sf) : ncflash_storage * set_fee_args) -> { s with lending_fees = Map.add (Tezos.sender, sf.asset_id) sf.fee s.lending_fees }) s sfs
            
let empty_ncflash_storage = {
    lending_fees = (Map.empty : (address * asset_id, fee) map);
}


type flash_loan_handler = {
    give_permissions: asset_id list -> operation list;
    begin_flash_loan: (bytes * bytes contract option * asset list) -> operation list;
}
let mk_flash_loan_handler (ncflash_address:address) = 
    let give_permissions = fun (asset_ids : asset_id list) -> 
        let permits = List.map (fun (asset_id:asset_id) -> 
            match asset_id.asset_type with 
            | Fa2 -> 
                let ep = (Tezos.get_entrypoint "%update_operators" asset_id.contract : update_operator list contract) in 
                Tezos.transaction [Add_operator({ owner = Tezos.get_self_address(); operator = ncflash_address; token_id = asset_id.token_id; })] 0tez ep
            | Fa1 -> 
                let ep = (Tezos.get_entrypoint "%approve" asset_id.contract : fa1_approve_param contract) in 
                Tezos.transaction { spender = ncflash_address; value = 115792089237316195423570985008687907853269984665640564039457584007913129639935n } 0tez ep
            ) asset_ids in
        permits in
    let begin_flash_loan = fun ((k_args, k_entrypoint, assets) : bytes * bytes contract option * asset list) ->
        let ep = (Tezos.get_entrypoint "%flash_loan" (ncflash_address : address) : flash_loan_args contract) in 
        let op = Tezos.transaction ({assets = assets; k_args = k_args; k_op = match k_entrypoint with Some k -> k | None -> (Tezos.get_entrypoint "%handle_ncflashloan" (Tezos.get_self_address()) : bytes contract) }) 0tez ep in 
        [op]
        in
    {
        give_permissions = give_permissions;
        begin_flash_loan = begin_flash_loan;    
    }    

//some fa1 KT1GT6fRR6v2chyeyNjEnZvDm2JrkSmMYLXX
//some ncflash KT1EdBBzMvR7kWs9ParAuuhyRy9SMZS88AkG
//some flashnop KT1VUyCyji374GbpYYQJLNUFKodF9DjGEUjP