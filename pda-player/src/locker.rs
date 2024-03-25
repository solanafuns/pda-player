use solana_program::pubkey::Pubkey;

#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, PartialEq, Clone, Copy)]
pub struct Locker {
    pub creator: Pubkey,
    pub lock_until: u64,
}

impl Locker {
    pub fn new(creator: Pubkey, lock_until: u64) -> Self {
        Self {
            creator,
            lock_until,
        }
    }
}
