import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { craft } from "./blend.ts";

const recipe = {
  id: "pebble-to-rock",
  requires: [1001, 1001, 1002],
  outputsTemplateId: 2000,
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

describe("craft", () => {
  it("accepts exact multiset and owner", () => {
    const r = craft(
      recipe,
      ings([
        { id: 1n, templateId: 1001 },
        { id: 2n, templateId: 1001 },
        { id: 3n, templateId: 1002 },
      ]),
      alice
    );
    assert.equal(r.ok, true);
    assert.equal(r.mintTemplateId, 2000);
    assert.equal(r.consumedAssetIds.length, 3);
    assert.equal(r.disposition, "burn");
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
  });

  it("returns an unsent treasury transfer when disposition is treasury", () => {
    const r = craft(
      {
        ...recipe,
        inputDisposition: "treasury",
        treasury: "treas.pxj",
      },
      ings([
        { id: 1n, templateId: 1001 },
        { id: 2n, templateId: 1001 },
        { id: 3n, templateId: 1002 },
      ]),
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
  });

  it("refuses treasury disposition without a treasury account", () => {
    assert.throws(
      () =>
        craft(
          { ...recipe, inputDisposition: "treasury" },
          ings([
            { id: 1n, templateId: 1001 },
            { id: 2n, templateId: 1001 },
            { id: 3n, templateId: 1002 },
          ]),
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
          ings([
            { id: 1n, templateId: 1001 },
            { id: 2n, templateId: 1001 },
            { id: 3n, templateId: 1002 },
          ]),
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
