#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env,
};

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (token::Client<'a>, token::StellarAssetClient<'a>, Address) {
    let contract_id = env.register_stellar_asset_contract(admin.clone());
    (
        token::Client::new(env, &contract_id),
        token::StellarAssetClient::new(env, &contract_id),
        contract_id,
    )
}

fn setup_campaign<'a>() -> (
    Env,
    CrowdfundContractClient<'a>,
    u64,
    Address,
    Address,
    token::Client<'a>,
    token::StellarAssetClient<'a>,
) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_client, token_admin_client, token_id) = create_token_contract(&env, &token_admin);

    token_admin_client.mint(&user, &1000);

    let contract_id = env.register(CrowdfundContract, ());
    let client = CrowdfundContractClient::new(&env, &contract_id);

    let campaign_id = client.create_campaign(&admin, &token_id);

    (
        env,
        client,
        campaign_id,
        admin,
        user,
        token_client,
        token_admin_client,
    )
}

#[test]
fn test_deposit_and_withdraw() {
    let (env, client, campaign_id, admin, user, token_client, _) = setup_campaign();

    // Deposit
    client.deposit(&user, &campaign_id, &100);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.balance, 100);

    // Withdraw
    client.withdraw(&campaign_id, &admin);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.balance, 0);
    assert_eq!(token_client.balance(&admin), 100);
}

#[test]
#[should_panic(expected = "Campaign does not exist")]
fn test_deposit_invalid_campaign() {
    let (_, client, _, _, user, _, _) = setup_campaign();

    // Try to deposit to non-existent campaign 999
    client.deposit(&user, &999, &100);
}

#[test]
#[should_panic(expected = "Campaign does not exist")]
fn test_withdraw_invalid_campaign() {
    let (_, client, _, admin, _, _, _) = setup_campaign();

    // Try to withdraw from non-existent campaign 999
    client.withdraw(&999, &admin);
}

#[test]
fn test_multiple_campaigns_isolation() {
    let env = Env::default();
    env.mock_all_auths();

    let admin1 = Address::generate(&env);
    let admin2 = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token_client, token_admin_client, token_id) = create_token_contract(&env, &token_admin);

    token_admin_client.mint(&user1, &1000);
    token_admin_client.mint(&user2, &1000);

    let contract_id = env.register(CrowdfundContract, ());
    let client = CrowdfundContractClient::new(&env, &contract_id);

    // Create two campaigns
    let id1 = client.create_campaign(&admin1, &token_id);
    let id2 = client.create_campaign(&admin2, &token_id);

    // Deposit to #1
    client.deposit(&user1, &id1, &50);
    assert_eq!(client.get_campaign(&id1).balance, 50);
    assert_eq!(client.get_campaign(&id2).balance, 0);

    // Deposit to #2
    client.deposit(&user2, &id2, &75);
    assert_eq!(client.get_campaign(&id1).balance, 50);
    assert_eq!(client.get_campaign(&id2).balance, 75);

    // Withdraw #1
    client.withdraw(&id1, &admin1);
    assert_eq!(client.get_campaign(&id1).balance, 0);
    assert_eq!(client.get_campaign(&id2).balance, 75);
    assert_eq!(token_client.balance(&admin1), 50);
}
