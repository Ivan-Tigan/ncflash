#include "flashnoop.mligo"
#include "oxhead_fa2/collectibles/ligo/src/fa2_single_token.mligo"

let mk_fa2_contract (owner:address) = 
    let (taddr,_,_) = Test.originate fa2_main {
         ledger = Big_map.literal [owner, 1000n];
         operators = (Big_map.empty : operator_storage);
         token_metadata = (Big_map.empty : (nat, token_metadata) big_map);
         total_supply = 1000n;
    } 0tez in 
    let c = Test.to_contract taddr in 
    let a = Tezos.address c in 
    taddr,c,a

let test1 = 
    let (taddr_ncflash, _, _) = Test.originate ncflash_main empty_ncflash_storage 0tez in 
    let contract_ncflash = Test.to_contract taddr_ncflash in 
    let address_ncflash = Tezos.address contract_ncflash in
    let (taddr_flashnoop, _, _) = Test.originate (flashnoop_main(address_ncflash)) 0n 0tez in
    let contract_flashnoop = Test.to_contract taddr_flashnoop in 
    let address_flashnoop = Tezos.address contract_flashnoop in
    let lender, borrow_activator = Test.nth_bootstrap_account 0, Test.nth_bootstrap_account 1 in 
    let taddr_fa2, contract_fa2, address_fa2 = mk_fa2_contract lender in
    let become_lender = Test.set_source lender in 
    let approve_lender = 
        Test.transfer_to_contract_exn 
            contract_fa2 
            (Update_operators([
                Add_operator({ owner = lender; operator = address_ncflash; token_id = 0n; });
                ])) 0tez in

    let become_borrow_activator = Test.set_source borrow_activator in 
    let approve_borrower = 
        Test.transfer_to_contract_exn 
            contract_flashnoop 
            (Give_permissions
            [{
                asset_type = Fa2;
                contract=address_fa2;
                token_id=0n;
            }]
            ) 0tez in
    let old_storage = Test.get_storage taddr_fa2 in 
    let old_ledger = old_storage.ledger in
    let do_flash_loan = 
        Test.transfer_to_contract_exn
            contract_flashnoop
            (Begin([{
                asset_id = {
                    asset_type = Fa2;
                    contract=address_fa2;
                    token_id=0n;

                };
                owner=lender;
                quantity=10n;
            }]))
            0tez in
    let new_storage = Test.get_storage taddr_fa2 in 
    let new_ledger = new_storage.ledger in
    let old_lender_quantity, new_lender_quantity = Big_map.find lender old_ledger, Big_map.find lender new_ledger in
    let _ = assert(new_lender_quantity >= old_lender_quantity ) in 
    ()