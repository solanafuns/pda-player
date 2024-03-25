import * as web3 from "@solana/web3.js";
import { loadPair, connection, waitConfirmation, confirmBalance } from "./tool";

const main = async () => {
  const module = new web3.PublicKey(
    "2z8nbNSTvHYFJTeMgz2kBb1gHksdiJJ34X3Vf9g7hBik"
  );

  console.log("====== This is solana pda playground !!! ====== ");

  const payer = loadPair();
  console.log("payer address : ", payer.publicKey.toBase58());
  let users = [payer.publicKey];

  confirmBalance(connection, users);

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
