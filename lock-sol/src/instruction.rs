use crate::locker::{Locker, LockerInstruction};
use borsh::{to_vec, BorshDeserialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
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
    msg!("Hello PDA Locker world!");

    let account_info_iter = &mut accounts.iter();
    let payer: &AccountInfo<'_> = next_account_info(account_info_iter)?;
    let locker_account = next_account_info(account_info_iter)?;
    let system_program_account: &AccountInfo<'_> = next_account_info(account_info_iter)?;
    let clock = Clock::get()?;

    msg!("locker_account from client : {:?}", locker_account.key);

    const LOCK_SECONDS: u64 = 300;
    const SEEDS: &[u8] = b"sol.locker";

    let (locker_pda, bump_seed) = Pubkey::find_program_address(&[SEEDS], program_id);
    msg!("find locker_pda by rust : {:?}", locker_pda);
    {
        assert!(locker_pda == *locker_account.key);
    }

    match LockerInstruction::try_from_slice(instruction_data)? {
        LockerInstruction::NewLock => {
            let rent: Rent = Rent::get()?;
            let locker: Locker = Locker::new(
                payer.key.clone(),
                clock.unix_timestamp as u64 + LOCK_SECONDS,
            );
            let body: Vec<u8> = to_vec(&locker)?;
            let data_size = body.len();
            let rent_lamports: u64 = rent.minimum_balance(data_size);
            msg!(
                "I will create account with rent_lamports : {:?}",
                rent_lamports
            );
            invoke_signed(
                &system_instruction::create_account(
                    payer.key,
                    locker_account.key,
                    rent_lamports,
                    data_size as u64,
                    program_id,
                ),
                &[
                    payer.clone(),
                    locker_account.clone(),
                    system_program_account.clone(),
                ],
                &[&[SEEDS, &[bump_seed]]],
            )?;
            let mut locker_data = locker_account.try_borrow_mut_data()?;
            locker_data.clone_from_slice(&body);
        }
        LockerInstruction::UnLock => {
            msg!("I will unlock all sol!!");
            {
                let locker: Locker = Locker::try_from_slice(&locker_account.data.borrow())?;
                msg!("sender  : {:?}", payer.key);
                msg!("locker.creator : {:?}", locker.creator);
                msg!("current time : {:?}", clock.unix_timestamp);
                msg!("locker.lock_until : {:?}", locker.lock_until);
                assert!(locker.creator == *payer.key);
                assert!(clock.unix_timestamp as u64 > locker.lock_until);
            }

            let dest_starting_lamports = payer.lamports();
            **payer.lamports.borrow_mut() = dest_starting_lamports
                .checked_add(locker_account.lamports())
                .unwrap();
            **locker_account.lamports.borrow_mut() = 0;
            let mut source_data: std::cell::RefMut<'_, &mut [u8]> =
                locker_account.data.borrow_mut();
            source_data.fill(0)
        }
    }

    Ok(())
}
