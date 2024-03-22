use solana_program::{
    account_info::{next_account_info, AccountInfo},
    address_lookup_table::instruction,
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    msg,
    program::{invoke, invoke_signed},
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};

solana_program::declare_id!("2z8nbNSTvHYFJTeMgz2kBb1gHksdiJJ34X3Vf9g7hBik");

solana_program::entrypoint!(process_instruction);

// program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello PDA world!");

    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;
    let system_program_account = next_account_info(account_info_iter)?;

    msg!("Payer account: {:?}", payer.key);

    let (find_pda, bump_seed) = Pubkey::find_program_address(&vec![instruction_data], program_id);
    msg!("find pda should be : {:?}", find_pda);
    // assert!(find_pda == *pda_account.key);
    msg!(
        "PDA account: {:?}, bump_seed : {:?}",
        pda_account.key,
        bump_seed
    );

    if pda_account.data_is_empty() {
        let data_size: usize = 1024;
        let rent: Rent = Rent::get()?;
        // let rent_lamports: u64 = rent.minimum_balance(data_size);
        let rent_lamports: u64 = 1000_000_000;

        invoke_signed(
            &system_instruction::create_account(
                payer.key,
                pda_account.key,
                rent_lamports,
                data_size as u64,
                program_id,
            ),
            &[
                payer.clone(),
                pda_account.clone(),
                system_program_account.clone(),
            ],
            &[&[instruction_data, &[bump_seed]]],
        )?;

        let mut pda_data = pda_account.try_borrow_mut_data()?;

        for i in 0..data_size {
            pda_data[i] = 1;
        }
    }

    // gracefully exit the program
    Ok(())
}
