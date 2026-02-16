#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contract]
pub struct CrowdfundContract;

#[contracttype]
pub struct Campaign {
    pub admin: Address,
    pub token: Address,
    pub balance: i128,
}

#[contracttype]
pub enum DataKey {
    Campaign(u64),
    Count,
}

#[contractimpl]
impl CrowdfundContract {
    // Create a new campaign. Returns the campaign ID.
    pub fn create_campaign(env: Env, admin: Address, token: Address) -> u64 {
        // Generate new ID
        let count: u64 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        let id = count + 1;

        // Store campaign
        let campaign = Campaign {
            admin,
            token,
            balance: 0,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(id), &campaign);
        env.storage().instance().set(&DataKey::Count, &id);

        id
    }

    // Deposit amount to a specific campaign
    pub fn deposit(env: Env, user: Address, campaign_id: u64, amount: i128) {
        user.require_auth();

        // Get campaign
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign does not exist");

        // Transfer tokens to this contract
        let client = soroban_sdk::token::Client::new(&env, &campaign.token);
        client.transfer(&user, &env.current_contract_address(), &amount);

        // Update internal balance
        campaign.balance += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    // Withdraw funds for a specific campaign
    pub fn withdraw(env: Env, campaign_id: u64, recipient: Address) {
        // Get campaign
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign does not exist");

        // Verify admin
        campaign.admin.require_auth();

        // Transfer tokens to recipient
        let client = soroban_sdk::token::Client::new(&env, &campaign.token);
        client.transfer(
            &env.current_contract_address(),
            &recipient,
            &campaign.balance,
        );

        // Reset balance
        campaign.balance = 0;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    // View campaign details
    pub fn get_campaign(env: Env, campaign_id: u64) -> Campaign {
        env.storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("Campaign does not exist")
    }
}

mod test;
