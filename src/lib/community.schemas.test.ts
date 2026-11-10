import { test, expect } from "bun:test";
import { supportSchema } from "./community.schemas";
const example={name:"Teste",phone:"11999999999",email:"teste@example.com",question:"Como gastar menos?",household_size:3,monthly_spend:600,spending_topic:"Mercado",consent:true};
test("savings support preserves the basic fields and spending values",()=>{
  const result=supportSchema.parse(example);
  expect(result.household_size).toBe(3);
  expect(result.monthly_spend).toBe(600);
  expect(Object.keys(result).sort()).toEqual(["name","phone","email","question","household_size","monthly_spend","spending_topic","consent"].sort());
});
test("sharing requires explicit consent",()=>{expect(supportSchema.safeParse({...example,consent:false}).success).toBe(false)});