import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { craft, type ChainCollection, type ChainTemplate } from "./blend.ts";

const recipe = {
  id: "pebble-to-rock",
  requires: [1001, 1001, 1002],
  ingredientCollection: "ingcol",
  outputsTemplateId: 2000,
  outputCollection: "examplecol",
  outputSchema: "examplesch",
  inputDisposition: "burn" as const,
};

const alice = "alice";

const collection = (
  authorized: string[] = [alice],
  author = "authorname",
  collection_name = "examplecol",
): ChainCollection => ({
  source: "chain",
  collection_name,
  author,
  authorized_accounts: authorized,
});

const outputTemplate = (
  overrides: Partial<ChainTemplate> = {},
): ChainTemplate => ({
  source: "chain",
  collection_name: "examplecol",
  schema_name: "examplesch",
  template_id: 2000,
  burnable: true,
  max_supply: 0,
  issued_supply: 0,
  ...overrides,
});

const ingredientRow = (template_id: number, burnable = true, collection_name = "ingcol"): ChainTemplate => ({
  source: "chain",
  collection_name,
  schema_name: "ingsch",
  template_id,
  burnable,
  max_supply: 0,
  issued_supply: 0,
});

const burnableRows = () => [ingredientRow(1001), ingredientRow(1002)];

function ings(
  specs: { id: bigint; templateId: number; owner?: string }[]
) {
  return specs.map((s) => ({
    assetId: s.id,
    templateId: s.templateId,
    owner: s.owner ?? alice,
  }));
}

const goodIngs = () =>
  ings([
    { id: 1n, templateId: 1001 },
    { id: 2n, templateId: 1001 },
    { id: 3n, templateId: 1002 },
  ]);

const good = () =>
  craft(recipe, goodIngs(), alice, collection(), outputTemplate(), burnableRows());

describe("craft", () => {
  it("accepts exact multiset and owner", () => {
    const r = good();
    assert.equal(r.ok, true);
    assert.equal(r.mintTemplateId, 2000);
    assert.equal(r.consumedAssetIds.length, 3);
    assert.equal(r.disposition, "burn");
  });

  it("returns an unsent mintasset with no asset id", () => {
    const r = good();
    assert.equal(r.mint.sent, false);
    assert.equal(r.mint.name, "mintasset");
    assert.equal(r.mint.data.template_id, 2000);
    assert.equal("asset_id" in r.mint.data, false);
  });

  it("returns unsent burn bodies for each consumed asset", () => {
    const r = craft(
      recipe,
      ings([
        { id: 3n, templateId: 1002 },
        { id: 1n, templateId: 1001 },
        { id: 2n, templateId: 1001 },
      ]),
      alice,
      collection(),
      outputTemplate(),
      burnableRows()
    );
    assert.equal(r.burns?.length, 3);
    assert.equal(r.treasuryTransfer, null);
    assert.deepEqual(r.burns?.map((b) => b.data.asset_id), ["1", "2", "3"]);
    assert.equal(r.burns?.every((b) => b.sent === false), true);
    assert.equal(r.mint.sent, false);
  });

  it("returns an unsent treasury transfer without ingredient burn rows", () => {
    const r = craft(
      { ...recipe, inputDisposition: "treasury", treasury: "treas.pxj" },
      goodIngs(),
      alice,
      collection(),
      outputTemplate(),
      null
    );
    assert.equal(r.disposition, "treasury");
    assert.equal(r.burns, null);
    assert.equal(r.treasuryTransfer?.sent, false);
    assert.equal(r.treasuryTransfer?.data.to, "treas.pxj");
    assert.equal(r.mint.sent, false);
  });

  it("accepts the collection author as minter", () => {
    const r = craft(recipe, goodIngs(), alice, collection([], alice), outputTemplate(), burnableRows());
    assert.equal(r.minter, alice);
  });

  it("accepts a capped template with remaining supply", () => {
    const r = craft(
      recipe,
      goodIngs(),
      alice,
      collection(),
      outputTemplate({ max_supply: 10, issued_supply: 9 }),
      burnableRows()
    );
    assert.equal(r.mint.sent, false);
  });

  it("refuses a missing collection row before any action body", () => {
    assert.throws(
      () => craft(recipe, goodIngs(), alice, null, outputTemplate(), burnableRows()),
      /not chain sourced/
    );
  });

  it("refuses a missing output template row before any action body", () => {
    assert.throws(
      () => craft(recipe, goodIngs(), alice, collection(), null, burnableRows()),
      /not chain sourced/
    );
  });

  it("refuses burn disposition without ingredient template rows", () => {
    assert.throws(
      () => craft(recipe, goodIngs(), alice, collection(), outputTemplate(), null),
      /not chain sourced/
    );
  });

  it("refuses a non-burnable ingredient template", () => {
    assert.throws(
      () =>
        craft(
          recipe,
          goodIngs(),
          alice,
          collection(),
          outputTemplate(),
          [ingredientRow(1001, false), ingredientRow(1002)]
        ),
      /not burnable/
    );
  });

  it("refuses an ingredient template from the wrong collection", () => {
    assert.throws(
      () =>
        craft(
          recipe,
          goodIngs(),
          alice,
          collection(),
          outputTemplate(),
          [ingredientRow(1001, true, "othercol"), ingredientRow(1002)]
        ),
      /wrong collection/
    );
  });

  it("refuses a partial ingredient template set", () => {
    assert.throws(
      () =>
        craft(recipe, goodIngs(), alice, collection(), outputTemplate(), [ingredientRow(1001)]),
      /not chain sourced/
    );
  });

  it("refuses a caller that is not author and not authorized", () => {
    assert.throws(
      () => craft(recipe, goodIngs(), alice, collection([], "someoneelse"), outputTemplate(), burnableRows()),
      /not a minter/
    );
  });

  it("refuses an output template id that disagrees with the recipe", () => {
    assert.throws(
      () =>
        craft(
          recipe,
          goodIngs(),
          alice,
          collection(),
          outputTemplate({ template_id: 9999 }),
          burnableRows()
        ),
      /template mismatch/
    );
  });

  it("refuses an output template with the wrong schema", () => {
    assert.throws(
      () =>
        craft(
          recipe,
          goodIngs(),
          alice,
          collection(),
          outputTemplate({ schema_name: "wrongsch" }),
          burnableRows()
        ),
      /wrong schema/
    );
  });

  it("refuses a full output template", () => {
    assert.throws(
      () =>
        craft(
          recipe,
          goodIngs(),
          alice,
          collection(),
          outputTemplate({ max_supply: 5, issued_supply: 5 }),
          burnableRows()
        ),
      /template full/
    );
  });

  it("refuses treasury disposition without a treasury account", () => {
    assert.throws(
      () =>
        craft(
          { ...recipe, inputDisposition: "treasury" },
          goodIngs(),
          alice,
          collection(),
          outputTemplate(),
          null
        ),
      /missing treasury/
    );
  });

  it("refuses a treasury that is the caller", () => {
    assert.throws(
      () =>
        craft(
          { ...recipe, inputDisposition: "treasury", treasury: alice },
          goodIngs(),
          alice,
          collection(),
          outputTemplate(),
          null
        ),
      /treasury is the user/
    );
  });

  it("refuses non-owner ingredient", () => {
    assert.throws(
      () =>
        craft(
          recipe,
          ings([
            { id: 1n, templateId: 1001 },
            { id: 2n, templateId: 1001, owner: "bob" },
            { id: 3n, templateId: 1002 },
          ]),
          alice,
          collection(),
          outputTemplate(),
          burnableRows()
        ),
      /not owner/
    );
  });

  it("refuses template mismatch", () => {
    assert.throws(
      () =>
        craft(
          recipe,
          ings([
            { id: 1n, templateId: 1001 },
            { id: 2n, templateId: 1001 },
            { id: 3n, templateId: 9999 },
          ]),
          alice,
          collection(),
          outputTemplate(),
          burnableRows()
        ),
      /template mismatch/
    );
  });

  it("refuses duplicate asset ids", () => {
    assert.throws(
      () =>
        craft(
          recipe,
          ings([
            { id: 1n, templateId: 1001 },
            { id: 1n, templateId: 1001 },
            { id: 3n, templateId: 1002 },
          ]),
          alice,
          collection(),
          outputTemplate(),
          burnableRows()
        ),
      /duplicate/
    );
  });
});
