import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { craft } from "./blend.ts";

const recipe = {
  id: "pebble-to-rock",
  requires: [1001, 1001, 1002],
  outputsTemplateId: 2000,
  outputCollection: "examplecol",
  outputSchema: "examplesch",
  inputDisposition: "burn" as const,
};

const alice = "alice";

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

describe("craft", () => {
  it("accepts exact multiset and owner", () => {
    const r = craft(recipe, goodIngs(), alice);
    assert.equal(r.ok, true);
    assert.equal(r.mintTemplateId, 2000);
    assert.equal(r.consumedAssetIds.length, 3);
    assert.equal(r.disposition, "burn");
  });

  it("returns an unsent mintasset with no asset id", () => {
    const r = craft(recipe, goodIngs(), alice);
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
      alice
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
      alice
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

  it("refuses a bad output collection name before mint", () => {
    assert.throws(
      () => craft({ ...recipe, outputCollection: ".bad" }, goodIngs(), alice),
      /bad account name/
    );
  });

  it("refuses treasury disposition without a treasury account", () => {
    assert.throws(
      () =>
        craft(
          { ...recipe, inputDisposition: "treasury" },
          goodIngs(),
          alice
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
          alice
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
          alice
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
          alice
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
          alice
        ),
      /duplicate/
    );
  });
});
