import * as web3 from "@solana/web3.js";
import { loadPair, connection, waitConfirmation, confirmBalance } from "./tool";
import { BorshSchema, borshSerialize, borshDeserialize, Unit } from "borsher";

const instructionSchema = BorshSchema.Enum({
  NewLock: BorshSchema.Unit,
  UnLock: BorshSchema.Unit,
});

const loadNewLockInstruction = () => {
  return {
    NewLock: {},
  };
};

const loadUnLockInstruction = () => {
  return {
    UnLock: {},
  };
};

const main = async () => {
  const module = new web3.PublicKey(
    "8T8j2XfkdyJiAhG8wFnGCHbkcS4m26bJj2LFEkJSXiKN"
  );

  console.log("====== This is solana pda sol locker !!! ====== ");

  const payer = loadPair();
  console.log("payer address : ", payer.publicKey.toBase58());
  let users = [payer.publicKey];

  confirmBalance(connection, users);

  const seeds = [Buffer.from("sol.locker")];
  const [pda, bump] = web3.PublicKey.findProgramAddressSync(seeds, module);

  console.log("PDA locker address : ", pda.toBase58());

  const lockerInfo = await connection.getAccountInfo(pda);
  if (!lockerInfo || lockerInfo.data.length == 0) {
    console.log("You don't have locker account, let me create one for you !!!");

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
        data: borshSerialize(instructionSchema, loadNewLockInstruction()),
      })
    );

    const signature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [payer]
    );

    await waitConfirmation(connection, signature);
    console.log("Transaction done successfully !!");

    console.log("let me transfer some sol to locker!!!");

    const solTransaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: pda,
        lamports: web3.LAMPORTS_PER_SOL * 2,
      })
    );

    const solSignature = await web3.sendAndConfirmTransaction(
      connection,
      solTransaction,
      [payer]
    );

    await waitConfirmation(connection, solSignature);
  }

  console.log("I want to unlock some sol from locker !!!");

  const unlockTransaction = new web3.Transaction().add(
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
      data: borshSerialize(instructionSchema, loadUnLockInstruction()),
    })
  );

  const unlockSignature = await web3.sendAndConfirmTransaction(
    connection,
    unlockTransaction,
    [payer]
  );

  await waitConfirmation(connection, unlockSignature);
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
