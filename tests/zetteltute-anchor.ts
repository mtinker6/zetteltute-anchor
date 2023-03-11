import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount} from "@solana/spl-token";
import {ZetteltuteAnchor} from "../target/types/zetteltute_anchor";
import {
    zettelMintKeypair,
    zettelMintAddress,
    createZettelMint,
    findZettelMintAuthorityPDA
} from "./zettel_mint";
import {Keypair, PublicKey} from "@solana/web3.js";
import {connection, randomPayer, zettelWallet} from "./config";
import {expect} from "chai";

describe("zetteltute-anchor", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.ZetteltuteAnchor as Program<ZetteltuteAnchor>;

    let zettelAccountKeypair: Keypair;
    let zettelAccountTokenBag;

    let dataUserKeypair: Keypair;
    let dataUserTokenBag;

    let zettelPayer;

    const getBalance = async (tokenBag: PublicKey) => {
        return parseInt((await connection
            .getTokenAccountBalance(tokenBag)).value.amount);
    }

    // 🏢 🛒 🛍️ 📬 📭 🗃 🗄 ️
    before("", async () => {

        zettelPayer = await randomPayer()

        await createZettelMint(); // CREATE OUR ZETTEL TOKEN MINT

        zettelAccountKeypair = anchor.web3.Keypair.generate();
        zettelAccountTokenBag = await getOrCreateAssociatedTokenAccount(
            connection,
            zettelPayer,
            zettelMintAddress,
            zettelAccountKeypair.publicKey,
            false
        ); // TOKEN ACCOUNT FOR DATA HOLDER

        dataUserKeypair = anchor.web3.Keypair.generate();
        dataUserTokenBag = await getOrCreateAssociatedTokenAccount(
            connection,
            zettelPayer,
            zettelMintAddress,
            dataUserKeypair.publicKey,
            false
        ); // TOKEN ACCOUNT FOR DATA USER
    });

    it("Creat 🧾 account ...", async () =>{
        await program.methods
            .setupZettelTute("-Nadsfassddeee", "https://")
            .accounts({
                zettelAccount: zettelAccountKeypair.publicKey,
                payer: zettelPayer.publicKey,
            })
            .signers([zettelPayer, zettelAccountKeypair])
            .rpc()

        let tute = await program.account.zettelTute.fetch(zettelAccountKeypair.publicKey);
        expect(tute.zettelTuteId).to.equal("-Nadsfassddeee");
        expect(tute.zettelTuteDataUrl).to.equal("https://");
    });

    it("Create 🗄️ data user account", async () => {

        await program.methods
            .setupDataUser("-12345")
            .accounts({
                dataUserAccount: dataUserKeypair.publicKey,
                payer: zettelPayer.publicKey,
            })
            .signers([zettelPayer, dataUserKeypair])
            .rpc()

        let user = await program.account.dataUser.fetch(dataUserKeypair.publicKey);
        expect(user.zettelUserId).to.equal("-12345");
    });

    it("Minting the data user bag ... 📬", async () => {

        const dataUserBalance = await getBalance(dataUserTokenBag.address);

        const [zettelMintPDA, zettelMintBump] = await findZettelMintAuthorityPDA();

        await program.methods
            .mintToDataUser(
                zettelMintBump,
                new anchor.BN(5_000)
            )
            .accounts({
                zettelMint: zettelMintAddress,
                zettelMintAuthority: zettelMintPDA,
                dataUserZettelBag: dataUserTokenBag.address,

                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc()

        expect(await getBalance(dataUserTokenBag.address)).to.equal(dataUserBalance + 5_000);
    });

    it("Get data 🗃 from account for tokens ... 🛍️", async () => {

        const dataUserBalance = await getBalance(dataUserTokenBag.address);
        const zettelAccountBalance = await getBalance(zettelAccountTokenBag.address);

        await program.methods
            .transferTokenForData(new anchor.BN(5_0))
            .accounts({
                accountZettelBag: zettelAccountTokenBag.address,
                dataUserZettelBag:dataUserTokenBag.address,
                dataUserZettelBagAuthority: dataUserKeypair.publicKey,
            })
            .signers([dataUserKeypair])
            .rpc();

        expect(await getBalance(dataUserTokenBag.address)).to.equal(dataUserBalance - 5_0);
        expect(await getBalance(zettelAccountTokenBag.address)).to.equal(5_0);
    });
});
