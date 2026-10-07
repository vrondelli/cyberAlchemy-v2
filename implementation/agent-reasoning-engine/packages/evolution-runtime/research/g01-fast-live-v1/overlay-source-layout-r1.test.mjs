import test from "node:test";
import assert from "node:assert/strict";
import {validateOverlaySourceBinding} from "./overlay-source-layout-r1.mjs";

const valid = {
  ordinal: 24,
  destination: "/tmp/are-g01-product-replication-r15-source/task-24/control/source/00/base",
  cache: "/tmp/are-g01-r15-source-caches-r1/mui--material-ui.git",
  base_commit: "375358b6f7d00342ad2a282c34950ebfb4b2cdc8"
};

test("derives a distinct pinned lower and upper slot", () => {
  const row = validateOverlaySourceBinding(valid);
  assert.equal(row.lower, "/dev/shm/are-g01-r15-r2-single-checkout-residency-r1/task-24");
  assert.equal(row.upper, "/dev/shm/are-g01-r15-r2-overlay-uppers-r1/campaign/task-24/control/source/00/base/upper");
  assert.equal(row.work, "/dev/shm/are-g01-r15-r2-overlay-uppers-r1/campaign/task-24/control/source/00/base/work");
});

test("rejects wrong campaign, ordinal, and traversal", () => {
  for (const binding of [
    {...valid, ordinal: 25},
    {...valid, destination: valid.destination.replace("replication-r15", "replication-r14")},
    {...valid, destination: valid.destination.replace("/task-24/", "/../task-24/")},
    {...valid, cache: "/tmp/unpinned.git"}
  ]) assert.throws(() => validateOverlaySourceBinding(binding), /g01-overlay-layout/);
});

test("r16 mode binds only its own campaign, lower, upper and cache roots", () => {
  const r16 = {
    mode: "g01-r16-r2-single-lower-overlay-r1",
    ordinal: 7,
    destination: "/tmp/are-g01-product-replication-r16-source/task-07/candidate/source/00/work",
    cache: "/dev/shm/are-g01-r16-r2-delta-caches-r1/ansible--ansible.git",
    base_commit: "a".repeat(40)
  };
  const row = validateOverlaySourceBinding(r16);
  assert.equal(row.lower, "/dev/shm/are-g01-r16-r2-single-checkout-residency-r1/task-07");
  assert.equal(row.upper, "/dev/shm/are-g01-r16-r2-overlay-uppers-r1/campaign/task-07/candidate/source/00/work/upper");
  assert.equal(row.mode, r16.mode);
  assert.equal(validateOverlaySourceBinding({...r16,
    destination: "/tmp/are-g01-product-replication-r17-source/task-07/candidate/source/00/work"}).lower,
  row.lower);
  assert.throws(() => validateOverlaySourceBinding({...r16, cache: valid.cache}), /g01-overlay-layout/);
  assert.throws(() => validateOverlaySourceBinding({...r16, destination: valid.destination}), /g01-overlay-layout/);
  assert.throws(() => validateOverlaySourceBinding({...r16, mode: "g01-r17-r1-single-lower-overlay-r1"}), /g01-overlay-layout/);
});
