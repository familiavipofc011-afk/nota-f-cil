import { test } from "node:test";
import assert from "node:assert/strict";
import { supportSchema } from "./community.schemas";
const example={name:"Teste",phone:"11999999999",email:"teste@example.com",question:"Como gastar menos?",household_size:3,monthly_spend:600,spending_topic:"Mercado",consent:true};
test("savings support preserves the basic fields and spending values",()=>{
  const result=supportSchema.parse(example);
  assert.equal(result.household_size,3);
  assert.equal(result.monthly_spend,600);
  assert.deepEqual(Object.keys(result).sort(),["name","phone","email","question","household_size","monthly_spend","spending_topic","consent"].sort());
});
test("sharing requires explicit consent",()=>{assert.equal(supportSchema.safeParse({...example,consent:false}).success,false)});