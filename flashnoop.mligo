#include "ncflash.mligo"

type flashnoop_storage = nat

type flashnoop_entrypoint = 
| Give_permissions of asset_id list
| Begin of asset list
| Handle_ncflashloan of bytes


let flashnoop_main (ncflash_address: address) ((e,s) : flashnoop_entrypoint * flashnoop_storage) = 
    let flash_loan_handler = mk_flash_loan_handler ncflash_address in 
    match e with 
    | Give_permissions asset_ids -> flash_loan_handler.give_permissions asset_ids, s
    | Begin(assets) -> flash_loan_handler.begin_flash_loan ( Bytes.pack 3n, (None : bytes contract option), assets), s
    | Handle_ncflashloan a -> 
        let () = if Tezos.sender = ncflash_address then () else (failwith "NO_PERMISSION_NCFLASH_HANDLE" : unit) in 
        let n = Option.unopt (Bytes.unpack a : nat option) in 
        ([]:operation list), s + n


    