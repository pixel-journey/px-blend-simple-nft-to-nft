/**
 * Simple NFT→NFT blend (educational).
 * Template-exact ingredients; owner must match; inputs burned or sent to treasury.
 * Does not mint on-chain — returns an unsent mintasset body and unsent input actions.
 * Minter rights, output supply, burnable ingredient templates, and ingredient
 * ownership come from chain rows, not from the client field alone.
 */

export type Ingredient = {
  assetId: bigint;
  templateId: number;
  owner: string;
};

export type Recipe = {
  id: string;
  /** Required template ids (multiset order-independent match by counts) */
  requires: readonly number[];
  ingredientCollection: string;
  /** Output template to mint */
  outputsTemplateId: number;
  outputCollection: string;
  outputSchema: string;
  /** burn = destroy inputs; treasury = move to treasury account */
  inputDisposition: "burn" | "treasury";
  /** Required when inputDisposition is treasury. Example name only. */
  treasury?: string;
};

/** A row the contract would have read from atomicassets::assets. Not a node call. */
export type ChainAsset = {
  source: "chain";
  id: bigint;
  owner: string;
  collection_name: string;
  template_id: number;
};

/** A row the contract would have read from atomicassets::collections. Not a node call. */
export type ChainCollection = {
  source: "chain";
  collection_name: string;
  author: string;
  authorized_accounts: string[];
};

/** A row the contract would have read from the collection's templates table. max_supply 0 means no cap. */
export type ChainTemplate = {
  source: "chain";
  collection_name: string;
  schema_name: string;
  template_id: number;
  burnable: boolean;
  max_supply: number;
  issued_supply: number;
};

export type UnsignedBurn = {
  account: "atomicassets";
  name: "burnasset";
  authorization: { actor: string; permission: "active" }[];
  data: { asset_owner: string; asset_id: string };
  sent: false;
};

export type UnsignedTransfer = {
  account: "atomicassets";
  name: "transfer";
  authorization: { actor: string; permission: "active" }[];
  data: {
    from: string;
    to: string;
    asset_ids: string[];
    memo: string;
  };
  sent: false;
};

export type UnsignedMint = {
  account: "atomicassets";
  name: "mintasset";
  authorization: { actor: string; permission: "active" }[];
  data: {
    authorized_minter: string;
    collection_name: string;
    schema_name: string;
    template_id: number;
    new_asset_owner: string;
    immutable_data: [];
    mutable_data: [];
    tokens_to_back: [];
  };
  sent: false;
};

export type CraftOk = {
  ok: true;
  recipeId: string;
  consumedAssetIds: bigint[];
  disposition: "burn" | "treasury";
  mintTemplateId: number;
  minter: string;
  /** Unsent mint body. Issued supply is not incremented. */
  mint: UnsignedMint;
  /** Present when disposition is burn. None of these is sent. */
  burns: UnsignedBurn[] | null;
  /** Present when disposition is treasury. Not sent. */
  treasuryTransfer: UnsignedTransfer | null;
};

const NAME = /^[a-z1-5.]{1,12}$/;
const UINT64_MAX = 18446744073709551615n;

export function assertName(name: string): string {
  if (!NAME.test(name) || name.startsWith(".") || name.endsWith(".")) {
    throw new Error("bad account name");
  }
  return name;
}

function countTemplates(ids: readonly number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const id of ids) {
    if (!Number.isInteger(id) || id < 1) throw new Error("bad template id");
    m.set(id, (m.get(id) ?? 0) + 1);
  }
  return m;
}

function mapsEqual(a: Map<number, number>, b: Map<number, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
}

/** Caller must be author or listed. Omitting the row is not a row. */
function assertMinter(
  collection: ChainCollection | null,
  recipe: Recipe,
  caller: string,
): void {
  if (!collection || collection.source !== "chain") throw new Error("not chain sourced");
  assertName(collection.collection_name);
  assertName(collection.author);
  if (collection.collection_name !== recipe.outputCollection) throw new Error("wrong collection");
  for (const account of collection.authorized_accounts) assertName(account);
  if (collection.author !== caller && !collection.authorized_accounts.includes(caller)) {
    throw new Error("not a minter");
  }
}

/**
 * Output template must exist, match recipe collection/schema/id, and have supply room.
 * max_supply 0 means unlimited. Issued supply is not written here.
 */
function assertOutputTemplate(
  template: ChainTemplate | null,
  recipe: Recipe,
): void {
  if (!template || template.source !== "chain") throw new Error("not chain sourced");
  assertName(template.collection_name);
  assertName(template.schema_name);
  if (template.collection_name !== recipe.outputCollection) throw new Error("wrong collection");
  if (template.schema_name !== recipe.outputSchema) throw new Error("wrong schema");
  if (!Number.isInteger(template.template_id) || template.template_id !== recipe.outputsTemplateId) {
    throw new Error("template mismatch");
  }
  if (!Number.isInteger(template.max_supply) || template.max_supply < 0) throw new Error("bad template");
  if (!Number.isInteger(template.issued_supply) || template.issued_supply < 0) throw new Error("bad template");
  if (template.max_supply !== 0 && template.issued_supply >= template.max_supply) {
    throw new Error("template full");
  }
}

/**
 * Burn disposition only. One chain row per unique required template, all burnable, same collection.
 * Treasury disposition does not call this.
 */
function assertBurnable(recipe: Recipe, rows: readonly ChainTemplate[] | null): void {
  if (rows === null) throw new Error("not chain sourced");
  const need = new Set(recipe.requires);
  if (rows.length !== need.size) throw new Error("not chain sourced");
  const seen = new Set<number>();
  for (const row of rows) {
    if (!row || row.source !== "chain") throw new Error("not chain sourced");
    if (!Number.isInteger(row.template_id) || seen.has(row.template_id) || !need.has(row.template_id)) {
      throw new Error("not chain sourced");
    }
    seen.add(row.template_id);
    assertName(row.collection_name);
    if (row.collection_name !== recipe.ingredientCollection) throw new Error("wrong collection");
    if (row.burnable !== true) throw new Error("not burnable");
  }
}

/**
 * One chain asset row per ingredient. The client owner field is not proof.
 * Row owner, collection, and template must agree with the caller and the claim.
 */
function assertAssets(
  recipe: Recipe,
  ingredients: readonly Ingredient[],
  caller: string,
  rows: readonly ChainAsset[] | null,
): void {
  if (rows === null) throw new Error("not chain sourced");
  if (rows.length !== ingredients.length) throw new Error("not chain sourced");
  const byId = new Map<string, ChainAsset>();
  for (const row of rows) {
    if (!row || row.source !== "chain") throw new Error("not chain sourced");
    if (typeof row.id !== "bigint" || row.id < 1n || row.id > UINT64_MAX) throw new Error("bad asset id");
    const key = row.id.toString();
    if (byId.has(key)) throw new Error("duplicate asset");
    byId.set(key, row);
  }
  for (const ing of ingredients) {
    const row = byId.get(ing.assetId.toString());
    if (!row) throw new Error("missing asset");
    assertName(row.owner);
    assertName(row.collection_name);
    if (row.owner !== caller) throw new Error("not the owner");
    if (row.collection_name !== recipe.ingredientCollection) throw new Error("wrong collection");
    if (!Number.isInteger(row.template_id) || row.template_id < 1) throw new Error("bad template id");
    if (row.template_id !== ing.templateId) throw new Error("template mismatch");
  }
}

/**
 * Validate craft. Minter, output supply, chain asset rows, and (for burn) burnable rows are required.
 * Returns unsent mint/burn/treasury bodies. Does not mint or burn on-chain.
 */
export function craft(
  recipe: Recipe,
  ingredients: readonly Ingredient[],
  caller: string,
  collection: ChainCollection | null,
  template: ChainTemplate | null,
  ingredientTemplates: readonly ChainTemplate[] | null,
  assets: readonly ChainAsset[] | null,
): CraftOk {
  assertName(caller);
  if (!recipe.id || recipe.id.length > 32) throw new Error("bad recipe id");
  if (recipe.inputDisposition !== "burn" && recipe.inputDisposition !== "treasury") {
    throw new Error("bad disposition");
  }
  if (!Number.isInteger(recipe.outputsTemplateId) || recipe.outputsTemplateId < 1) {
    throw new Error("bad output template");
  }
  assertName(recipe.ingredientCollection);
  assertName(recipe.outputCollection);
  assertName(recipe.outputSchema);
  if (recipe.requires.length === 0) throw new Error("empty recipe");
  if (ingredients.length !== recipe.requires.length) {
    throw new Error("ingredient count mismatch");
  }

  const seen = new Set<string>();
  for (const ing of ingredients) {
    if (typeof ing.assetId !== "bigint" || ing.assetId < 1n || ing.assetId > UINT64_MAX) {
      throw new Error("bad asset id");
    }
    const key = ing.assetId.toString();
    if (seen.has(key)) throw new Error("duplicate asset");
    seen.add(key);
    assertName(ing.owner);
    if (ing.owner !== caller) throw new Error("not owner of ingredient");
  }

  const need = countTemplates(recipe.requires);
  const have = countTemplates(ingredients.map((i) => i.templateId));
  if (!mapsEqual(need, have)) throw new Error("template mismatch");

  assertAssets(recipe, ingredients, caller, assets);
  assertMinter(collection, recipe, caller);
  assertOutputTemplate(template, recipe);
  if (recipe.inputDisposition === "burn") assertBurnable(recipe, ingredientTemplates);

  const consumedAssetIds = ingredients.map((i) => i.assetId);
  const ordered = [...consumedAssetIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  let burns: UnsignedBurn[] | null = null;
  let treasuryTransfer: UnsignedTransfer | null = null;

  if (recipe.inputDisposition === "burn") {
    burns = ordered.map((id) => ({
      account: "atomicassets",
      name: "burnasset",
      authorization: [{ actor: caller, permission: "active" }],
      data: { asset_owner: caller, asset_id: id.toString() },
      sent: false,
    }));
  } else {
    if (!recipe.treasury) throw new Error("missing treasury");
    assertName(recipe.treasury);
    if (recipe.treasury === caller) throw new Error("treasury is the user");
    treasuryTransfer = {
      account: "atomicassets",
      name: "transfer",
      authorization: [{ actor: caller, permission: "active" }],
      data: {
        from: caller,
        to: recipe.treasury,
        asset_ids: ordered.map((id) => id.toString()),
        memo: `blend:${recipe.id}`,
      },
      sent: false,
    };
  }

  const mint: UnsignedMint = {
    account: "atomicassets",
    name: "mintasset",
    authorization: [{ actor: caller, permission: "active" }],
    data: {
      authorized_minter: caller,
      collection_name: recipe.outputCollection,
      schema_name: recipe.outputSchema,
      template_id: recipe.outputsTemplateId,
      new_asset_owner: caller,
      immutable_data: [],
      mutable_data: [],
      tokens_to_back: [],
    },
    sent: false,
  };

  return {
    ok: true,
    recipeId: recipe.id,
    consumedAssetIds,
    disposition: recipe.inputDisposition,
    mintTemplateId: recipe.outputsTemplateId,
    minter: caller,
    mint,
    burns,
    treasuryTransfer,
  };
}
