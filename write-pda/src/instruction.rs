use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

solana_program::entrypoint!(process_instruction);

// program entrypoint's implementation
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello PDA world, I'll write PDA data!");

    let account_info_iter = &mut accounts.iter();
    let _payer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;

    let data_size: usize = 1024;
    let mut pda_data = pda_account.try_borrow_mut_data()?;
    for i in 0..data_size {
        pda_data[i] = 122;
    }

    // invoke_signed(
    //     &system_instruction::transfer(&pda, payer.key, 100),
    //     &[
    //         pda_account.clone(),
    //         payer.clone(),
    //         system_program_account.clone(),
    //     ],
    //     &[&[instruction_data, &[bump_seed]]],
    // )?;

    // gracefully exit the program
    Ok(())
}
