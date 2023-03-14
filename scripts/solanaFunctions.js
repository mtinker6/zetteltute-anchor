const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();


const fs = require('fs').promises;
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} = require('@solana/web3.js');
const {AnchorProvider, Wallet, Program, BN} = require('@coral-xyz/anchor');
const {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount
} = require('@solana/spl-token');

const idl = require('./idl.json');
const KEYPAIR_PATH = './id.json';

const findZettelMintAuthorityPDA = async (zettelMintAddress, programId) => {
  return await getProgramDerivedAddress(zettelMintAddress, programId);
};

const getProgramDerivedAddress = async (seed, programId) => {
  return PublicKey.findProgramAddressSync(
    [seed.toBuffer()],
    programId
  );
};

const getBalance = async (connection, tokenBag) => {
  return parseInt((await connection
    .getTokenAccountBalance(tokenBag)).value.amount);
};

exports.createSolanaZetteltute = functions.firestore
  .document('*** obfuscated ***')
  .onCreate(async (snap, content) => {
    const newAccount = snap.data();

    const kp = await loadKp();
    const provider = await getProvider();
    const programId = new PublicKey(
      '*** obfuscated ***'
    );
    const connection = provider.connection;
    const program = new Program(idl, programId, provider);

    const zettelData = JSON.parse(await fs.readFile('*** obfuscated ***'));
    const zettelMintKeypair = Keypair.fromSecretKey(new Uint8Array(zettelData));
    const zettelMintAddress = zettelMintKeypair.publicKey;

    const accKeypair = Keypair.generate();

    await program.methods
      .setupZettelTute(
        snap.id,
        `*** obfuscated ***/getZetteTute?pubKey=${accKeypair.publicKey}`
      ).accounts({
        zettelAccount: accKeypair.publicKey,
        payer: kp.publicKey,
      })
      .signers([kp, accKeypair])
      .rpc();

    await getOrCreateAssociatedTokenAccount(
      connection,
      kp,
      zettelMintAddress,
      accKeypair.publicKey,
      false
    );

    await snap.ref.update({
      solanaAccount: {
        publicKey: accKeypair.publicKey.toString(),
        secretKey: JSON.stringify(Array.from(accKeypair.secretKey)),
      }
    });
  });

exports.createSolanaRetailer = functions.firestore
  .document('*** obfuscated ***') // obfiscated
  .onUpdate(async (change, context) => {
    const newUser = change.after.data();
    const oldUser = change.before.data();

    if (newUser.role === '*** obfuscated ***' && oldUser.role !== '*** obfuscated ***') {

      const kp = await loadKp();
      const provider = await getProvider();
      const programId = new PublicKey(
        '*** obfuscated ***'
      );
      const connection = provider.connection;
      const program = new Program(idl, programId, provider);

      const zettelData = JSON.parse(await fs.readFile('*** obfuscated ***'));
      const zettelMintKeypair = Keypair.fromSecretKey(new Uint8Array(zettelData));
      const zettelMintAddress = zettelMintKeypair.publicKey;

      const retailerKeypair = Keypair.generate();

      await program.methods
        .setupDataUser(change.after.id)
        .accounts({
          dataUserAccount: retailerKeypair.publicKey,
          payer: kp.publicKey,
        })
        .signers([kp, retailerKeypair])
        .rpc();

      await getOrCreateAssociatedTokenAccount(
        connection,
        kp,
        zettelMintAddress,
        retailerKeypair.publicKey,
        false
      );

      await change.after.ref.update({
        solanaAccount: {
          publicKey: retailerKeypair.publicKey.toString(),
          secretKey: JSON.stringify(Array.from(retailerKeypair.secretKey)),
        }
      });
    }
  });

exports.getZetteTute = functions.https
  .onRequest(async (request, response) => {

    response.set('Access-Control-Allow-Origin', '*');

    const kp = await loadKp();

    const pubKey = request.query.pubKey;
    if (pubKey === undefined)
      return response.status(400).send('no pub key');

    const provider = await getProvider();
    const programId = new PublicKey(
      '*** obfuscated ***'
    );
    const connection = provider.connection;
    const program = new Program(idl, programId, provider);

    const zettelData = JSON.parse(await fs.readFile('./zettel_mint.json'));
    const zettelMintKeypair = Keypair.fromSecretKey(new Uint8Array(zettelData));
    const zettelMintAddress = zettelMintKeypair.publicKey;

    let acc = await program.account.zettelTute.fetch(
      new PublicKey(pubKey)
    );

    const tokenBag = await getOrCreateAssociatedTokenAccount(
      connection,
      kp,
      zettelMintAddress,
      new PublicKey(pubKey),
      false
    );

    let balance = await getBalance(connection, tokenBag.address);

    response.json({
      pubKey: pubKey,
      balance: balance,
      id: acc.zettelTuteId,
      dataUrl: acc.zettelTuteDataUrl,
      receipts: acc.receipts,
    });
  });

exports.getRetailer = functions.https
  .onRequest(async (request, response) => {

    response.set('Access-Control-Allow-Origin', '*');
    const kp = await loadKp();

    const pubKey = request.query.pubKey;
    if (pubKey === undefined) {
      console.log("No pub key");
      return response.status(400).send('no pub key');
    }

    const provider = await getProvider();
    const programId = new PublicKey(
      '*** obfuscated ***'
    );
    const connection = provider.connection;
    const program = new Program(idl, programId, provider);

    const zettelData = JSON.parse(await fs.readFile('./zettel_mint.json'));
    const zettelMintKeypair = Keypair.fromSecretKey(new Uint8Array(zettelData));
    const zettelMintAddress = zettelMintKeypair.publicKey;

    let acc = await program.account.dataUser.fetch(
      new PublicKey(pubKey)
    );

    const tokenBag = await getOrCreateAssociatedTokenAccount(
      connection,
      kp,
      zettelMintAddress,
      new PublicKey(pubKey),
      false
    );

    let balance = await getBalance(connection, tokenBag.address);

    response.json({
      pubKey: pubKey,
      balance: balance,
      id: acc.zettelUserId,
      dataUrls: acc.dataUrls,
    });
  });

exports.searchData = functions.https
  .onRequest(async (request, response) => {

    response.set('Access-Control-Allow-Origin', '*');

    const transaction = request.query.transaction;

    //const pubKey = request.query.pubKey;
    //if(pubKey === undefined)
    //  return response.status(400).send("no pub key")

    const provider = await getProvider();
    const programId = new PublicKey(
      '*** obfuscated ***'
    );
    const connection = provider.connection;
    const program = new Program(idl, programId, provider);

    const zettelAccounts = await program.account.zettelTute.all();

    let pubKey = "No Key Found";
    zettelAccounts.map(acc => {
      acc.account.receipts.map( rec => {
        if(rec.transaction === parseInt(transaction)){
          pubKey = acc.publicKey.toString();
        }
      });
    });

    response.json({pubKey: pubKey});
  });

exports.getAllZettelTuten = functions.https
  .onRequest(async (request, response) => {

    response.set('Access-Control-Allow-Origin', '*');

    //const pubKey = request.query.pubKey;
    //if(pubKey === undefined)
     // return response.status(400).send("no pub key")

    const provider = await getProvider();
    const programId = new PublicKey(
      '*** obfuscated ***'
    );
    const connection = provider.connection;
    const program = new Program(idl, programId, provider);

    const zettelAccounts = await program.account.zettelTute.all();

    const allAccounts = [];
    zettelAccounts.map(acc => {
      //console.log(acc.publicKey);
      //console.log(acc.account);
      allAccounts.push({
        publicKey: acc.publicKey,
        account: acc.account
      });

    });

    response.json({zettelTuten: allAccounts});
  });

exports.getData = functions.https
  .onRequest(async (request, response) => {

    response.set('Access-Control-Allow-Origin', '*');

    const kp = await loadKp();

    const accountPubKey = request.query.accountPubKey;
    if(accountPubKey === undefined)
      return response.status(400).send("no pub key");

    const userId = request.query.userId;
    if(userId === undefined)
      return response.status(400).send("no user id");

    const provider = await getProvider();
    const programId = new PublicKey(
      '*** obfuscated ***'
    );
    const connection = provider.connection;
    const program = new Program(idl, programId, provider);

    const userRef = db.collection('*** obfuscated ***').doc(userId);
    const user = (await userRef.get()).data();

    const zettelData = JSON.parse(await fs.readFile('./zettel_mint.json'));
    const zettelMintKeypair = Keypair.fromSecretKey(new Uint8Array(zettelData));
    const zettelMintAddress = zettelMintKeypair.publicKey;

    let acc = await program.account.zettelTute.fetch(
      new PublicKey(accountPubKey)
    );

    const zettelAccRef = db.collection('*** obfuscated ***').doc(acc.zettelTuteId);
    const zettelAcc = (await zettelAccRef.get()).data();

    const userKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(user.solanaAccount.secretKey))
    );

    const accountKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(zettelAcc.solanaAccount.secretKey))
    );

    const accountTokenBag = await getOrCreateAssociatedTokenAccount(
      connection,
      kp,
      zettelMintAddress,
      accountKeypair.publicKey,
      false
    );

    const userTokenBag = await getOrCreateAssociatedTokenAccount(
      connection,
      kp,
      zettelMintAddress,
      userKeypair.publicKey,
      false
    );

    await program.methods
      .transferTokenForData(new BN("500"))
      .accounts({
        accountZettelBag: accountTokenBag.address,
        dataUserZettelBag:userTokenBag.address,
        dataUserZettelBagAuthority: userKeypair.publicKey,

        zettelAccount: accountKeypair.publicKey,
        accountOwner: accountKeypair.publicKey,

        dataUserAccount: userKeypair.publicKey,
      })
      .signers([userKeypair, accountKeypair])
      .rpc();

    response.json({status: "OK"});
  });

exports.transferToken = functions.https
  .onRequest(async (request, response) => {

    response.set('Access-Control-Allow-Origin', '*');
    const kp = await loadKp();

    const userId = request.query.userId;
    if(userId === undefined)
      return response.status(400).send("no user id");

    const amount = request.query.amount;
    if(amount === undefined)
      return response.status(400).send("no amount");

    const provider = await getProvider();
    const programId = new PublicKey(
      '*** obfuscated ***'
    );
    const connection = provider.connection;
    const program = new Program(idl, programId, provider);

    const userRef = db.collection('*** obfuscated ***').doc(userId);
    const user = (await userRef.get()).data();

    const zettelData = JSON.parse(await fs.readFile('./zettel_mint.json'));
    const zettelMintKeypair = Keypair.fromSecretKey(new Uint8Array(zettelData));
    const zettelMintAddress = zettelMintKeypair.publicKey;

    const userKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(user.solanaAccount.secretKey))
    );

    const [zettelMintPDA, zettelMintBump] = await findZettelMintAuthorityPDA(
      zettelMintAddress, programId
    );

    const userTokenBag = await getOrCreateAssociatedTokenAccount(
      connection,
      kp,
      zettelMintAddress,
      userKeypair.publicKey,
      false
    );

    await program.methods
      .mintToDataUser(
        zettelMintBump,
        new BN(amount)
      )
      .accounts({
        zettelMint: zettelMintAddress,
        zettelMintAuthority: zettelMintPDA,
        dataUserZettelBag: userTokenBag.address,

        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()

    response.json({status: "OK"});
  });

const loadKp = async () => {
  try {
    const kpBytes = await fs.readFile(KEYPAIR_PATH);
    const kp = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(kpBytes.toString()))
    );
    //console.log(kp.publicKey.toString());
    return kp;
  } catch {
    console.log('NO KEY!');
  }
};

let hasBalance = true;
const getProvider = async () => {
  const kp = await loadKp();
  const ENDPOINT = 'http://localhost:8899';
  // const ENDPOINT = "https://api.devnet.solana.com";
  const conn = new Connection(ENDPOINT, {
    commitment: 'confirmed',
  });
  const wallet = new Wallet(kp);

  const provider = new AnchorProvider(
    conn,
    wallet,
    AnchorProvider.defaultOptions()
  );

  if (!hasBalance && !(await provider.connection.getBalance(kp.publicKey))) {
    const txHash = await provider.connection.requestAirdrop(
      kp.publicKey,
      1000 * LAMPORTS_PER_SOL
    );
    await confirmTx(txHash);
    hasBalance = true;
  }

  return provider;
};
