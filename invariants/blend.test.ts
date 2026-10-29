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
