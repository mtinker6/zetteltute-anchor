import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {Keypair, LAMPORTS_PER_SOL} from "@solana/web3.js";
import {ZetteltuteAnchor} from "../target/types/zetteltute_anchor";

anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.ZetteltuteAnchor as Program<ZetteltuteAnchor>;
const connection = anchor.getProvider().connection;

const zettelWallet = anchor.workspace.ZetteltuteAnchor.provider.wallet;

const randomPayer = async (lamports = LAMPORTS_PER_SOL) => {
    const wallet = Keypair.generate();
    const signature = await connection.requestAirdrop(wallet.publicKey, 10*lamports);

    const latestBlockHash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
    });

    return wallet;
}

export {
    program,
    connection,
    randomPayer,
    zettelWallet
}