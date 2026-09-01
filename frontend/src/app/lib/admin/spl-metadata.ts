import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);
const SYSVAR_RENT = new PublicKey(
  "SysvarRent111111111111111111111111111111111",
);

export interface TokenMetadataInput {
  name: string;
  symbol: string;
  uri: string;
}

export function findMetadataPda(mint: PublicKey): PublicKey {
  const [metadata] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      MPL_TOKEN_METADATA_PROGRAM_ID.toBytes(),
      mint.toBytes(),
    ],
    MPL_TOKEN_METADATA_PROGRAM_ID,
  );
  return metadata;
}

function putU32LE(buf: number[], value: number): void {
  buf.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  );
}

function putString(buf: number[], text: string): void {
  const bytes = Buffer.from(text, "utf8");
  putU32LE(buf, bytes.length);
  for (const byte of bytes) buf.push(byte);
}

function buildCreateMetadataAccountV3Data(input: TokenMetadataInput): Buffer {
  const buf: number[] = [];
  // Instruction discriminator for CreateMetadataAccountV3 (legacy, on-chain
  // stable): attach metadata to an existing mint. Unlike createV1 (disc 42)
  // this path does not require the mint to be a signer.
  buf.push(33);
  // data: DataV2 { name, symbol, uri, seller_fee_basis_points, creators,
  //   collection, uses }  — all optional fields None.
  putString(buf, input.name);
  putString(buf, input.symbol);
  putString(buf, input.uri);
  buf.push(0, 0); // seller_fee_basis_points (u16) = 0
  buf.push(0); // creators: None
  buf.push(0); // collection: None
  buf.push(0); // uses: None
  buf.push(1); // is_mutable
  buf.push(0); // collection_details: None
  return Buffer.from(buf);
}

/**
 * Attaches on-chain metadata (name/symbol/uri) to an already-created SPL mint
 * using the Metaplex token-metadata program. The mint authority signs; the mint
 * itself does not need to (it already exists and is initialized).
 * Returns the transaction signature.
 */
export async function createTokenMetadata(
  connection: Connection,
  authority: Keypair,
  mint: PublicKey,
  input: TokenMetadataInput,
): Promise<string> {
  const metadata = findMetadataPda(mint);
  const transaction = new Transaction().add(
    new TransactionInstruction({
      keys: [
        { pubkey: metadata, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: authority.publicKey, isSigner: true, isWritable: false },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: authority.publicKey, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT, isSigner: false, isWritable: false },
      ],
      programId: MPL_TOKEN_METADATA_PROGRAM_ID,
      data: buildCreateMetadataAccountV3Data(input),
    }),
  );

  const signature = await connection.sendTransaction(transaction, [authority]);
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}