use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("6t3Ca79eN9fDh7gmc3cVgMum7qAk3JRZgokNnL3TioKD");

#[error_code]
pub enum ZettelError {
    AccountAlreadyExists,
    NotAccountOwner,
    NoTseStart,
    NoTseStop,
    NoTseTransaction,
    NoTseSignatureCounter,
    NoTseSerial,
}

#[program]
pub mod zetteltute_anchor {

    pub const ZETTEL_MINT_ADDRESS: &str = "ANyst3pyR8x6Sg5ef94msmdgrnjL7JLfyqSyJv9o4fAC";

    use super::*;

    pub fn setup_zettel_tute(ctx: Context<CreateZettelAccount>,
                             zettel_tute_id: String,
                             zettel_data_url: String) -> Result<()> {
        ctx.accounts.zettel_account.setup(zettel_tute_id, zettel_data_url)
    }

    pub fn setup_data_user(ctx: Context<CreateDataUserAccount>,
                           zettel_user_id: String) -> Result<()> {
        ctx.accounts.data_user_account.setup(zettel_user_id)
    }

    pub fn add_receipt(ctx: Context<AddReceipt>,
                       receipt: Receipt) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.zettel_account.key(),
            ctx.accounts.account_owner.key(),
            ZettelError::NotAccountOwner
        );
        let zettel_account = &mut ctx.accounts.zettel_account;

        if receipt.start.is_empty() { return err!(ZettelError::NoTseStart); }
        if receipt.stop.is_empty() { return err!(ZettelError::NoTseStop); }
        if receipt.transaction <= 0 { return err!(ZettelError::NoTseTransaction); }
        if receipt.signature_counter <= 0 { return err!(ZettelError::NoTseSignatureCounter); }

        zettel_account.add_receipt(receipt)
    }

    pub fn mint_to_data_user(ctx: Context<MintToDataUserAccount>,
                    zettel_mint_authority_bump: u8,
                    amount: u64) -> Result<()> {

        let zettel_mint_address = ctx.accounts.zettel_mint.key();
        let seeds = &[zettel_mint_address.as_ref(), &[zettel_mint_authority_bump]];
        let signer = [&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),

            token::MintTo {
                mint: ctx.accounts.zettel_mint.to_account_info(),
                authority: ctx.accounts.zettel_mint_authority.to_account_info(),
                to: ctx.accounts.data_user_zettel_bag.to_account_info(),
            },
            &signer,
        );

        token::mint_to(cpi_ctx, amount);

        Ok(())
    }

    pub fn transfer_token_for_data(ctx: Context<TransferTokenForData>,
                                   amount: u64) -> Result<()> {

        // want to make sure data holder agrees to the transfer of data
        require_keys_eq!(
            ctx.accounts.zettel_account.key(),
            ctx.accounts.account_owner.key(),
            ZettelError::NotAccountOwner
        );

        let dataUrl = ctx.accounts.zettel_account.get_data_url();
        ctx.accounts.data_user_account.add_data_url(dataUrl);

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.data_user_zettel_bag.to_account_info(),
                authority: ctx.accounts.data_user_zettel_bag_authority.to_account_info(),
                to: ctx.accounts.account_zettel_bag.to_account_info()
            }
        );

        token::transfer(cpi_ctx, amount);

        Ok(())
    }
}

/*########
ACCOUNTS
#######*/

#[derive(Accounts)]
pub struct CreateZettelAccount<'info>{
    #[account(
        init,
        payer = payer,
        space = 8 + ZettelTute::MAXIMUM_SIZE
    )]
    pub zettel_account: Account<'info, ZettelTute>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateDataUserAccount<'info>{
    #[account(
        init,
        payer = payer,
        space = 8 + ZettelTute::MAXIMUM_SIZE
    )]
    pub data_user_account: Account<'info, DataUser>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(zettel_mint_authority_bump: u8)]
pub struct MintToDataUserAccount<'info> {
    #[account(
        mut,
        address = ZETTEL_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub zettel_mint: Account<'info, Mint>,

    /// CHECK: only PDA
    #[account(
        seeds = [zettel_mint.key().as_ref()],
        bump = zettel_mint_authority_bump
    )]
    pub zettel_mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub data_user_zettel_bag: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AddReceipt<'info> {
    #[account(mut)]
    pub zettel_account: Account<'info, ZettelTute>,
    #[account(mut)]
    pub account_owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferTokenForData<'info> {
    #[account(mut)]
    pub account_zettel_bag: Account<'info, TokenAccount>,

    #[account(mut)]
    pub data_user_zettel_bag: Account<'info, TokenAccount>,
    pub data_user_zettel_bag_authority: Signer<'info>,

    #[account(mut)]
    pub data_user_account: Account<'info, DataUser>,
    #[account(mut)]
    pub account_owner: Signer<'info>,

    #[account(mut)]
    pub zettel_account: Account<'info, ZettelTute>,

    pub token_program: Program<'info, Token>,
}

/*########
DATA STRUCTS
#######*/

#[account]
pub struct ZettelTute {
    pub zettel_tute_id: String,
    // right now just store data urls here, obviously signed URLs would be needed with
    // Solana and the Zettel program being part of it.
    // https://www.digiaware.com/2020/08/what-is-signed-url/
    pub zettel_tute_data_url: String,
    pub receipts: Vec<Receipt>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Receipt {
    pub start: String,
    pub stop: String,
    pub transaction: u32,
    pub signature_counter: u32,
    pub signature: String,
    pub serial: String,
}

#[account]
pub struct DataUser {
    pub zettel_user_id: String,
    pub campaigns: Vec<Campaign>,
    // right now just store data urls here, obviously signed URLs would be needed with
    // Solana and the Zettel program being part of it.
    // https://www.digiaware.com/2020/08/what-is-signed-url/
    pub data_urls: Vec<String>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Campaign {
    pub description: String,
    pub eligible_receipts: Vec<Receipt>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DataUrl {
    url: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AccountId {
    id: String,
}

/*########
IMPLEMENTATIONS
#######*/

impl ZettelTute {
    pub const MAXIMUM_SIZE: usize = (32 * 50) + 1 + (9 * (1 + 1)) + (32 + 1);

    pub fn setup(&mut self,
                 zettel_tute_id: String,
                 zettel_data_url: String) -> Result<()> {
        self.zettel_tute_id = zettel_tute_id;
        self.zettel_tute_data_url = zettel_data_url;
        Ok(())
    }

    pub fn add_receipt(&mut self,
                       receipt: Receipt) -> Result<()> {
        self.receipts.push(receipt);
        Ok(())
    }

    pub fn get_data_url(&self) -> String { self.zettel_tute_data_url.to_string() }
}

impl DataUser {
    pub const MAXIMUM_SIZE: usize = (32 * 50) + 1 + (9 * (1 + 1)) + (32 + 1);

    pub fn setup(&mut self,
                 zettel_user_id: String) -> Result<()> {
        self.zettel_user_id = zettel_user_id;
        Ok(())
    }

    pub fn add_data_url(&mut self, account_data_url: String) -> Result<()>{
        self.data_urls.push(account_data_url);
        Ok(())
    }
}