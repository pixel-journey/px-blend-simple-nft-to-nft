import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { craft, type ChainCollection, type ChainTemplate } from "./blend.ts";

const recipe = {
  id: "pebble-to-rock",
  requires: [1001, 1001, 1002],
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
  craft(recipe, goodIngs(), alice, collection(), outputTemplate());

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
    assert.equal(r.mint.account, "atomicassets");
    assert.equal(r.mint.name, "mintasset");
    assert.equal(r.mint.data.authorized_minter, alice);
    assert.equal(r.mint.data.collection_name, "examplecol");
    assert.equal(r.mint.data.schema_name, "examplesch");
    assert.equal(r.mint.data.template_id, 2000);
    assert.equal(r.mint.data.new_asset_owner, alice);
    assert.equal("asset_id" in r.mint.data, false);
    assert.deepEqual(r.mint.data.immutable_data, []);
    assert.deepEqual(r.mint.data.tokens_to_back, []);
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
      outputTemplate()
    );
    assert.equal(r.burns?.length, 3);
    assert.equal(r.treasuryTransfer, null);
    assert.deepEqual(
      r.burns?.map((b) => b.data.asset_id),
      ["1", "2", "3"]
    );
    assert.equal(r.burns?.every((b) => b.sent === false), true);
    assert.equal(r.burns?.every((b) => b.name === "burnasset"), true);
    assert.equal(r.burns?.every((b) => b.data.asset_owner === alice), true);
    assert.equal(r.burns?.every((b) => b.account === "atomicassets"), true);
    assert.equal(r.mint.sent, false);
  });

  it("returns an unsent treasury transfer when disposition is treasury", () => {
    const r = craft(
      {
        ...recipe,
        inputDisposition: "treasury",
        treasury: "treas.pxj",
      },
      goodIngs(),
      alice,
      collection(),
      outputTemplate()
    );
    assert.equal(r.disposition, "treasury");
    assert.equal(r.burns, null);
    assert.equal(r.treasuryTransfer?.sent, false);
    assert.equal(r.treasuryTransfer?.account, "atomicassets");
    assert.equal(r.treasuryTransfer?.data.from, alice);
    assert.equal(r.treasuryTransfer?.data.to, "treas.pxj");
    assert.deepEqual(r.treasuryTransfer?.data.asset_ids, ["1", "2", "3"]);
    assert.equal(r.treasuryTransfer?.data.memo, "blend:pebble-to-rock");
    assert.equal(r.mint.sent, false);
    assert.equal(r.mint.data.template_id, 2000);
  });

  it("accepts the collection author as minter", () => {
    const r = craft(recipe, goodIngs(), alice, collection([], alice), outputTemplate());
    assert.equal(r.mint.sent, false);
    assert.equal(r.minter, alice);
  });

  it("accepts a capped template with remaining supply", () => {
    const r = craft(
      recipe,
      goodIngs(),
      alice,
      collection(),
      outputTemplate({ max_supply: 10, issued_supply: 9 })
    );
    assert.equal(r.mint.sent, false);
  });

  it("refuses a missing collection row before any action body", () => {
    assert.throws(
      () => craft(recipe, goodIngs(), alice, null, outputTemplate()),
      /not chain sourced/
    );
  });

  it("refuses a missing output template row before any action body", () => {
    assert.throws(
      () => craft(recipe, goodIngs(), alice, collection(), null),
      /not chain sourced/
    );
  });

  it("refuses a caller that is not author and not authorized", () => {
    assert.throws(
      () => craft(recipe, goodIngs(), alice, collection([], "someoneelse"), outputTemplate()),
      /not a minter/
    );
  });

  it("refuses a collection name that disagrees with the recipe", () => {
    assert.throws(
      () =>
        craft(
          recipe,
          goodIngs(),
          alice,
          collection([alice], "authorname", "othercol"),
          outputTemplate()
        ),
      /wrong collection/
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
          outputTemplate({ template_id: 9999 })
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
          outputTemplate({ schema_name: "wrongsch" })
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
          outputTemplate({ max_supply: 5, issued_supply: 5 })
        ),
      /template full/
    );
  });

  it("refuses a bad output collection name before mint", () => {
    assert.throws(
      () =>
        craft(
          { ...recipe, outputCollection: ".bad" },
          goodIngs(),
          alice,
          collection(),
          outputTemplate()
        ),
      /bad account name/
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
          outputTemplate()
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
          outputTemplate()
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
          outputTemplate()
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
          outputTemplate()
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
          outputTemplate()
        ),
      /duplicate/
    );
  });
});
