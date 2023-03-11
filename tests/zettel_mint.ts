import fs from "fs";
import {Keypair, PublicKey} from "@solana/web3.js";
import {createMint} from "@solana/spl-token";
import {
    program,
    connection,
    randomPayer
} from "./config";

// @ts-ignore
const zettelData = JSON.parse(fs.readFileSync(".keys/zettel_mint.json"));
const zettelMintKeypair = Keypair.fromSecretKey(new Uint8Array(zettelData))
const zettelMintAddress = zettelMintKeypair.publicKey;

const findZettelMintAuthorityPDA = async (): Promise<[PublicKey, number]> => {
    return await getProgramDerivedAddress(zettelMintAddress);
}

const getProgramDerivedAddress = async (seed: PublicKey): Promise<[PublicKey, number]> => {
    return PublicKey.findProgramAddressSync(
        [seed.toBuffer()],
        program.programId
    );
}

const createZettelMint = async () => {

    const [zettelMintPDA, _] = await findZettelMintAuthorityPDA();

    const zettelMintAddress = await createMint(
        connection,
        await randomPayer(),
        zettelMintPDA,
        null,
        8,
        zettelMintKeypair
    );

    console.log(`Zettel Mint Address: ${zettelMintAddress}`);
}

export {
    zettelMintKeypair,
    zettelMintAddress,
    createZettelMint,
    findZettelMintAuthorityPDA
}