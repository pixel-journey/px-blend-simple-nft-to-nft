/**
 * Composition: sequential crafts must not reuse the same chain asset ids.
 * Pure craft() alone would accept the same ids twice — this desk models the
 * missing state write (burn/transfer already happened).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  craft,
  type ChainAsset,
  type ChainCollection,
  type ChainTemplate,
  type CraftOk,
  type Ingredient,
  type Recipe,
} from "./blend.ts";

type Desk = { consumed: Set<string> };

function openDesk(): Desk {
  return { consumed: new Set() };
}

function craftOnce(
  desk: Desk,
  recipe: Recipe,
  ingredients: readonly Ingredient[],
  caller: string,
  collection: ChainCollection | null,
  template: ChainTemplate | null,
  ingredientTemplates: readonly ChainTemplate[] | null,
  assets: readonly ChainAsset[] | null,
): CraftOk {
  for (const ing of ingredients) {
    if (desk.consumed.has(ing.assetId.toString())) {
      throw new Error("asset already consumed");
    }
  }
  const result = craft(
    recipe,
    ingredients,
    caller,
    collection,
    template,
    ingredientTemplates,
    assets,
  );
  for (const id of result.consumedAssetIds) {
    desk.consumed.add(id.toString());
  }
  return result;
}

const recipe: Recipe = {
  id: "pebble-to-rock",
  requires: [1001, 1002],
  ingredientCollection: "ingcol",
  outputsTemplateId: 2000,
  outputCollection: "examplecol",
  outputSchema: "examplesch",
  inputDisposition: "burn",
};

const alice = "alice";
const collection = (): ChainCollection => ({
  source: "chain",
  collection_name: "examplecol",
  author: alice,
  authorized_accounts: [],
});
const outputTemplate = (): ChainTemplate => ({
  source: "chain",
  collection_name: "examplecol",
  schema_name: "examplesch",
  template_id: 2000,
  burnable: true,
  max_supply: 0,
  issued_supply: 0,
});
const burnableRows = (): ChainTemplate[] => [
  {
    source: "chain",
    collection_name: "ingcol",
    schema_name: "ingsch",
    template_id: 1001,
    burnable: true,
    max_supply: 0,
    issued_supply: 0,
  },
  {
    source: "chain",
    collection_name: "ingcol",
    schema_name: "ingsch",
    template_id: 1002,
    burnable: true,
    max_supply: 0,
    issued_supply: 0,
  },
];
function pack(
  ids: [bigint, bigint],
): { ingredients: Ingredient[]; assets: ChainAsset[] } {
  const ingredients: Ingredient[] = [
    { assetId: ids[0], templateId: 1001, owner: alice },
    { assetId: ids[1], templateId: 1002, owner: alice },
  ];
  const assets: ChainAsset[] = ingredients.map((i) => ({
    source: "chain",
    id: i.assetId,
    owner: i.owner,
    collection_name: "ingcol",
    template_id: i.templateId,
  }));
  return { ingredients, assets };
}

describe("composition: sequential craft desk", () => {
  it("pure craft accepts the same ids twice (no state)", () => {
    const { ingredients, assets } = pack([1n, 2n]);
    const a = craft(
      recipe,
      ingredients,
      alice,
      collection(),
      outputTemplate(),
      burnableRows(),
      assets,
    );
    const b = craft(
      recipe,
      ingredients,
      alice,
      collection(),
      outputTemplate(),
      burnableRows(),
      assets,
    );
    assert.equal(a.ok && b.ok, true);
    assert.deepEqual(a.consumedAssetIds, b.consumedAssetIds);
  });

  it("desk refuses a second craft of the same asset ids", () => {
    const desk = openDesk();
    const first = pack([10n, 20n]);
    const r = craftOnce(
      desk,
      recipe,
      first.ingredients,
      alice,
      collection(),
      outputTemplate(),
      burnableRows(),
      first.assets,
    );
    assert.equal(r.ok, true);
    assert.throws(
      () =>
        craftOnce(
          desk,
          recipe,
          first.ingredients,
          alice,
          collection(),
          outputTemplate(),
          burnableRows(),
          first.assets,
        ),
      /already consumed/,
    );
  });

  it("desk allows a second craft with fresh asset ids", () => {
    const desk = openDesk();
    const a = pack([11n, 12n]);
    const b = pack([21n, 22n]);
    craftOnce(
      desk,
      recipe,
      a.ingredients,
      alice,
      collection(),
      outputTemplate(),
      burnableRows(),
      a.assets,
    );
    const r = craftOnce(
      desk,
      recipe,
      b.ingredients,
      alice,
      collection(),
      outputTemplate(),
      burnableRows(),
      b.assets,
    );
    assert.equal(r.ok, true);
    assert.equal(desk.consumed.size, 4);
  });

  it("burn plan still ends with mint; all unsent; tokens_to_back empty", () => {
    const desk = openDesk();
    const { ingredients, assets } = pack([30n, 40n]);
    const r = craftOnce(
      desk,
      recipe,
      ingredients,
      alice,
      collection(),
      outputTemplate(),
      burnableRows(),
      assets,
    );
    assert.equal(r.actions.at(-1)?.name, "mintasset");
    assert.equal(r.actions.every((x) => x.sent === false), true);
    assert.equal(r.mint.data.tokens_to_back.length, 0);
  });
});
