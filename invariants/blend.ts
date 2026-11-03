/**
 * Simple NFT→NFT blend (educational).
 * Template-exact ingredients; owner must match; inputs burned or sent to treasury.
 * Does not mint on-chain — returns an unsigned mint intent and unsent input actions.
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
  /** Output template to mint */
  outputsTemplateId: number;
  /** burn = destroy inputs; treasury = move to treasury account */
  inputDisposition: "burn" | "treasury";
  /** Required when inputDisposition is treasury. Example name only. */
  treasury?: string;
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

export type CraftOk = {
  ok: true;
  recipeId: string;
  consumedAssetIds: bigint[];
  disposition: "burn" | "treasury";
  mintTemplateId: number;
  minter: string;
  /** Present when disposition is burn. None of these is sent. */
  burns: UnsignedBurn[] | null;
  /** Present when disposition is treasury. Not sent. */
  treasuryTransfer: UnsignedTransfer | null;
};

const NAME = /^[a-z1-5.]{1,12}$/;

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

/**
 * Validate craft: caller owns every ingredient; templates match recipe multiset exactly.
 * Returns unsent burn or treasury-transfer bodies for the inputs. Does not mint.
 */
export function craft(
  recipe: Recipe,
  ingredients: readonly Ingredient[],
  caller: string
): CraftOk {
  assertName(caller);
  if (!recipe.id || recipe.id.length > 32) throw new Error("bad recipe id");
  if (recipe.inputDisposition !== "burn" && recipe.inputDisposition !== "treasury") {
    throw new Error("bad disposition");
  }
  if (!Number.isInteger(recipe.outputsTemplateId) || recipe.outputsTemplateId < 1) {
    throw new Error("bad output template");
  }
  if (ingredients.length !== recipe.requires.length) {
    throw new Error("ingredient count mismatch");
  }

  const seen = new Set<string>();
  for (const ing of ingredients) {
    if (typeof ing.assetId !== "bigint" || ing.assetId < 1n) {
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

  const consumedAssetIds = ingredients.map((i) => i.assetId);
  // Stable order by asset id so the action list is deterministic.
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

  return {
    ok: true,
    recipeId: recipe.id,
    consumedAssetIds,
    disposition: recipe.inputDisposition,
    mintTemplateId: recipe.outputsTemplateId,
    minter: caller,
    burns,
    treasuryTransfer,
  };
}
