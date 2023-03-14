# Zetteltute Anchor Project #

![Zetteltute by Solana copy](https://user-images.githubusercontent.com/8571358/224981945-ddb9a1e4-f188-4846-9409-f0d3679df85a.png)

Zetteltüte is a consumer expense tracking services that allows frictional expense tracking with a focus on spending and the possiblity to extend to shared funds. With the Zetteltute Anchor project a one of its kind Consumer Data Clean Room is build on top of [Solana](https://solana.com/) network using the [Anchor](https://www.anchor-lang.com/) framework.

**This project was submitted as part of the [2023 Grizzlython Hackathon](https://solana.com/grizzlython) and serves just for demo purposes and learning**

Background Information:
* [What is a Data Clean Room?](https://infotrust.com/articles/data-clean-room-ads-data-hub/)
* [TSE](https://de.wikipedia.org/wiki/Technische_Sicherheitseinrichtung)

### Prerequisits ###

* Solana
* Rust
* Anchor Framework
* Node.js

### Build, Test & deploy ###

```% anchor build ```

```% anchor test```

*(Negative testing with exception didn't work for me, look at the ```Using other account to add receipt ...``` test as an example.)*

```% anchor deploy```

### Accounts and Program ###

*This projects requires the creation of a [MINT Token](https://spl.solana.com/token) on the network. Check `tests/zettel_mint.ts` for how to do that.*

#### Accounts ####

* `CreateZettelAccount` - State for the creation of a `ZettelTute` account.
* `CreateDataUserAccount`- State for the creation of a `DataUser` account.
* `MintToDataUserAccount` - State for granting zettel tokens to a `DataUser`.
* `AddReceipt`- State for adding a receipt to a `ZettelTute` account.
* `TransferTokenForData` - Exchaning data for token.
* `ZettelTute` - DAO for a Consumer account holding the TSE signature.
* `DataUser`- DAO for a Retailer intersted in accessing data.

#### Program ####

* `setup_zettel_tute`
* `setup_data_user`
* `add_receipt`
* `mint_to_data_user`
* `transfer_token_for_data`

### App Inegration with REST Enpoints ###

REST endpoints and triggers for Firebase are in `scripts/solanaFunctions.js`

***Some/most string information was reducted and obfuscated with `*** obfuscated ***` to not expose possible sensitive information of the underlying system.***

*The script is messy and was hacked togehter with code duplication and so on. But, IT WORKS!! ;)*

### Resources and Thank You Goes To ###

* https://blog.mwrites.xyz/solana-staking-program
* https://www.youtube.com/watch?v=3GHlk6vosQw
* https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html
