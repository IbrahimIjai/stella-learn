// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Stellar Soroban Contracts ^0.6.0
#![no_std]

use soroban_sdk::{
    Address, contract, contractimpl, Env, MuxedAddress, String, Symbol, Vec
};
use stellar_access::ownable::{self as ownable, Ownable};
use stellar_contract_utils::pausable::{self as pausable, Pausable};
use stellar_macros::{only_owner, when_not_paused};
use stellar_tokens::fungible::{Base, burnable::FungibleBurnable, FungibleToken};

#[contract]
pub struct MetaToken;

#[contractimpl]
impl MetaToken {
    pub fn __constructor(e: &Env, owner: Address) {
        Base::set_metadata(e, 7, String::from_str(e, "MetaToken"), String::from_str(e, "META"));
        ownable::set_owner(e, &owner);
    }

    #[only_owner]
    #[when_not_paused]
    pub fn mint(e: &Env, account: Address, amount: i128) {
        Base::mint(e, &account, amount);
    }
}

#[contractimpl]
impl FungibleToken for MetaToken {
    type ContractType = Base;

    #[when_not_paused]
    fn transfer(e: &Env, from: Address, to: MuxedAddress, amount: i128) {
        Self::ContractType::transfer(e, &from, &to, amount);
    }

    #[when_not_paused]
    fn transfer_from(e: &Env, spender: Address, from: Address, to: Address, amount: i128) {
        Self::ContractType::transfer_from(e, &spender, &from, &to, amount);
    }
}

//
// Extensions
//

#[contractimpl]
impl FungibleBurnable for MetaToken {
    #[when_not_paused]
    fn burn(e: &Env, from: Address, amount: i128) {
        Base::burn(e, &from, amount);
    }

    #[when_not_paused]
    fn burn_from(e: &Env, spender: Address, from: Address, amount: i128) {
        Base::burn_from(e, &spender, &from, amount);
    }
}

//
// Utils
//

#[contractimpl]
impl Ownable for MetaToken {}

#[contractimpl]
impl Pausable for MetaToken {
    fn paused(e: &Env) -> bool {
        pausable::paused(e)
    }

    #[only_owner]
    fn pause(e: &Env, _caller: Address) {
        pausable::pause(e);
    }

    #[only_owner]
    fn unpause(e: &Env, _caller: Address) {
        pausable::unpause(e);
    }
}
