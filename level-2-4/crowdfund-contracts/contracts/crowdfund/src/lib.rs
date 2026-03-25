#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, String,
};

#[derive(Clone)]
#[contracttype]
pub struct Campaign {
    pub id: u64,
    pub admin: Address,
    pub token: Address,
    pub name: String,
    pub description: String,
    pub target_amount: i128,
    pub balance: i128,
    pub total_raised: i128,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    NextCampaignId,
    Campaign(u64),
}

#[contracterror]
#[derive(Copy, Clone, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum CrowdfundError {
    CampaignNotFound = 1,
    InvalidAmount = 2,
    NothingToWithdraw = 3,
}

#[contract]
pub struct CrowdfundContract;

#[contractimpl]
impl CrowdfundContract {
    pub fn create_campaign(
        env: Env,
        admin: Address,
        token: Address,
        name: String,
        description: String,
        target_amount: i128,
    ) -> u64 {
        admin.require_auth();

        if target_amount <= 0 {
            panic_with_error!(&env, CrowdfundError::InvalidAmount);
        }

        let id = Self::next_campaign_id(&env);
        let campaign = Campaign {
            id,
            admin: admin.clone(),
            token: token.clone(),
            name,
            description,
            target_amount,
            balance: 0,
            total_raised: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(id), &campaign);

        env.events()
            .publish((symbol_short!("created"), id), (admin, token, target_amount));

        id
    }

    pub fn deposit(env: Env, user: Address, campaign_id: u64, amount: i128) {
        user.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, CrowdfundError::InvalidAmount);
        }

        let mut campaign = Self::read_campaign(&env, campaign_id);
        let token_client = token::Client::new(&env, &campaign.token);

        // Inter-contract token transfer from user into this contract.
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        campaign.balance += amount;
        campaign.total_raised += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        env.events()
            .publish((symbol_short!("deposit"), campaign_id), (user, amount));
    }

    pub fn withdraw(env: Env, campaign_id: u64, recipient: Address) {
        let mut campaign = Self::read_campaign(&env, campaign_id);
        campaign.admin.require_auth();

        if campaign.balance <= 0 {
            panic_with_error!(&env, CrowdfundError::NothingToWithdraw);
        }

        let amount = campaign.balance;
        let token_client = token::Client::new(&env, &campaign.token);

        // Inter-contract token transfer from this contract to recipient.
        token_client.transfer(&env.current_contract_address(), &recipient, &amount);

        campaign.balance = 0;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        env.events()
            .publish((symbol_short!("withdraw"), campaign_id), (recipient, amount));
    }

    pub fn get_campaign(env: Env, campaign_id: u64) -> Campaign {
        Self::read_campaign(&env, campaign_id)
    }

    pub fn get_campaign_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get::<DataKey, u64>(&DataKey::NextCampaignId)
            .unwrap_or(1)
            - 1
    }

    fn next_campaign_id(env: &Env) -> u64 {
        let key = DataKey::NextCampaignId;
        let id = env.storage().instance().get::<DataKey, u64>(&key).unwrap_or(1);
        env.storage().instance().set(&key, &(id + 1));
        id
    }

    fn read_campaign(env: &Env, campaign_id: u64) -> Campaign {
        env.storage()
            .persistent()
            .get::<DataKey, Campaign>(&DataKey::Campaign(campaign_id))
            .unwrap_or_else(|| panic_with_error!(env, CrowdfundError::CampaignNotFound))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token, Address, Env, String};

    fn setup() -> (Env, CrowdfundContractClient<'static>, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CrowdfundContract, ());
        let client = CrowdfundContractClient::new(&env, &contract_id);

        let token_admin = Address::generate(&env);
        let token = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_id = token.address();
        let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        token_admin_client.mint(&user, &1_000);

        (env, client, admin, user, token_id, contract_id)
    }

    #[test]
    fn test_deposit_and_withdraw() {
        let (env, client, admin, user, token_id, contract_id) = setup();
        let token_client = token::Client::new(&env, &token_id);

        let campaign_id = client.create_campaign(
            &admin,
            &token_id,
            &String::from_str(&env, "MetaDAO"),
            &String::from_str(&env, "Campaign"),
            &500,
        );

        client.deposit(&user, &campaign_id, &300);
        let after_deposit = client.get_campaign(&campaign_id);

        assert_eq!(after_deposit.balance, 300);
        assert_eq!(after_deposit.total_raised, 300);
        assert_eq!(token_client.balance(&user), 700);
        assert_eq!(token_client.balance(&contract_id), 300);

        client.withdraw(&campaign_id, &admin);
        let after_withdraw = client.get_campaign(&campaign_id);

        assert_eq!(after_withdraw.balance, 0);
        assert_eq!(token_client.balance(&admin), 300);
        assert_eq!(token_client.balance(&contract_id), 0);
    }

    #[test]
    #[should_panic]
    fn test_deposit_invalid_campaign() {
        let (env, client, _admin, user, _token_id, _contract_id) = setup();
        client.deposit(&user, &99, &100);
        let _ = env;
    }

    #[test]
    #[should_panic]
    fn test_withdraw_invalid_campaign() {
        let (env, client, _admin, _user, _token_id, _contract_id) = setup();
        client.withdraw(&88, &Address::generate(&env));
    }

    #[test]
    fn test_multiple_campaigns_isolation() {
        let (env, client, admin, user, token_id, contract_id) = setup();
        let token_client = token::Client::new(&env, &token_id);

        let c1 = client.create_campaign(
            &admin,
            &token_id,
            &String::from_str(&env, "C1"),
            &String::from_str(&env, "A"),
            &200,
        );
        let c2 = client.create_campaign(
            &admin,
            &token_id,
            &String::from_str(&env, "C2"),
            &String::from_str(&env, "B"),
            &800,
        );

        client.deposit(&user, &c1, &120);
        client.deposit(&user, &c2, &80);

        let camp1 = client.get_campaign(&c1);
        let camp2 = client.get_campaign(&c2);

        assert_eq!(camp1.balance, 120);
        assert_eq!(camp2.balance, 80);
        assert_eq!(token_client.balance(&contract_id), 200);
        assert_eq!(client.get_campaign_count(), 2);
    }
}
