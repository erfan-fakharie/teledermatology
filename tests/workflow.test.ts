import assert from "node:assert/strict";
import { test } from "node:test";
import { canWrite } from "../src/lib/workflow";
import { requireDemo } from "../src/lib/db";

test("server clock enforces the exact follow-up boundary",()=>{
  const eligibleAt=new Date("2026-12-07T10:00:00Z");
  const episode={state:"SCHEDULED",eligibleAt};
  assert.equal(canWrite(episode,"PATIENT",new Date(eligibleAt.getTime()-1)),false);
  assert.equal(canWrite(episode,"PATIENT",eligibleAt),true);
  assert.equal(canWrite(episode,"DOCTOR",new Date(eligibleAt.getTime()-1)),true);
  assert.equal(canWrite({...episode,state:"CLOSED"},"PATIENT",eligibleAt),false);
});
test("real mode cannot enable the demo workflow",()=>{
  const previous=process.env.APP_MODE;
  try {
    process.env.APP_MODE="production";
    assert.throws(requireDemo);
  } finally {
    if (previous===undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE=previous;
  }
});
