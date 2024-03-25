import * as web3 from "@solana/web3.js";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

export const connection = new web3.Connection(
  "http://127.0.0.1:8899",
  "finalized"
);

export const loadPair = () => {
  const keyData = process.env.PRIVATE_KEY;
  if (!keyData) {
    const pair = web3.Keypair.generate();
    fs.writeFileSync(".env", `PRIVATE_KEY=[${pair.secretKey}]`);
    return pair;
  } else {
    return web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keyData)));
  }
};

export const waitConfirmation = async (
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

export const confirmBalance = async (
  connection: web3.Connection,
  pubkeys: Array<web3.PublicKey>
) => {
  for (let i = 0; i < pubkeys.length; i++) {
    const balance = await connection.getBalance(pubkeys[i]);
    if (balance == 0) {
      console.log("Airdrop to ", pubkeys[i].toBase58());
      const signature = await connection.requestAirdrop(
        pubkeys[i],
        web3.LAMPORTS_PER_SOL * 5
      );
      await waitConfirmation(connection, signature);
      console.log("Airdrop completed!");
    }
  }
};
