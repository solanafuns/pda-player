import * as web3 from "@solana/web3.js";

const waitConfirmation = async (
  connection: web3.Connection,
  signature: string
) => {
  console.log("");
  console.log("Waiting for confirmation ", signature);
  let latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    },
    "finalized"
  );
  console.log(signature, "Confirmed");
  console.log("");
};
const main = async () => {
  const connection = new web3.Connection("http://127.0.0.1:8899", "finalized");

  const module = new web3.PublicKey(
    "2z8nbNSTvHYFJTeMgz2kBb1gHksdiJJ34X3Vf9g7hBik"
  );

  const writeModule = new web3.PublicKey(
    "12bX1wZ3cMCBchhUCKgmZnvf3qwcdrenkoGm4x5yCW5B"
  );

  console.log("This is solana pda playground !!!");

  const payer = web3.Keypair.generate();

  console.log("payer address : ", payer.publicKey.toBase58());

  let users = [payer.publicKey];

  for (let i = 0; i < users.length; i++) {
    console.log("airdrop to : ", users[i].toBase58());
    const airdropSignature = await connection.requestAirdrop(
      users[i],
      web3.LAMPORTS_PER_SOL * 5
    );
    await waitConfirmation(connection, airdropSignature);
  }

  console.log("Airdrop done successfully !!");

  const path = "/index.html";
  // const akey = new web3.PublicKey("11111111111111111111111111111111");

  const seeds = [Buffer.from(path)];
  const [pda, bump] = web3.PublicKey.findProgramAddressSync(seeds, module);

  console.log("PDA address : ", pda.toBase58());

  const transaction = new web3.Transaction().add(
    new web3.TransactionInstruction({
      keys: [
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: pda, isSigner: false, isWritable: true },
        {
          pubkey: web3.SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: module,
      data: Buffer.from(path),
    })
  );

  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [payer]
  );

  await waitConfirmation(connection, signature);
  console.log("Transaction done successfully !!");

  console.log("test write data from another Program!");

  // this will stop , cause the account's owner is module not writeModule.
  const writeTransaction = new web3.Transaction().add(
    new web3.TransactionInstruction({
      keys: [
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: pda, isSigner: false, isWritable: true },
        {
          pubkey: web3.SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ],
      programId: writeModule,
      data: Buffer.from(path),
    })
  );

  const writeSignature = await web3.sendAndConfirmTransaction(
    connection,
    writeTransaction,
    [payer]
  );

  await waitConfirmation(connection, writeSignature);
};

main()
  .then(() => {
    console.log("Program done successfully !!");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
