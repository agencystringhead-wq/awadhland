/**
 * npm test
 *
 * lib/yield.ts, the plot yield calculator's maths. Duty rules are a fixture with the same shape and
 * figures as data/stampDutyRules.json today, so a change to the data (which is still marked
 * PLACEHOLDER) does not silently change what these tests assert about the arithmetic.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { StampDutyRule } from "./schemas";
import { areaToSqm, computeYield, groupIndian, irr, parseIndian, SQFT_PER_SQM, YIELD_DEFAULTS, type YieldInput } from "./yield";

const rule = (buyerCategory: StampDutyRule["buyerCategory"], stampDutyPct: number): StampDutyRule =>
  ({
    id: `up-${buyerCategory}`,
    state: "UP",
    buyerCategory,
    stampDutyPct,
    registrationFeePct: 1,
    registrationFeeCap: null,
    rebate: null,
    effectiveFrom: "2026-01-01",
    sourceUrl: "https://igrsup.gov.in/",
    sources: [{ label: "fixture", url: "https://igrsup.gov.in/", accessedAt: "2026-09-25" }],
    updatedAt: "2026-09-25",
  }) as StampDutyRule;

const RULES = [rule("male", 7), rule("female", 6), rule("joint", 6.5)];

const base = (over: Partial<YieldInput> = {}): YieldInput => ({
  price: 10_00_000,
  circleValue: null,
  buyer: "male",
  dutyRules: RULES,
  brokerLegalPct: 2,
  years: 5,
  appreciationPct: 8,
  incomePerYear: 0,
  incomeGrowthPct: 0,
  holdingCostPerYear: 0,
  sellingCostPct: 2,
  fdRatePct: YIELD_DEFAULTS.fdRatePct,
  ...over,
});

const close = (a: number | null, b: number, eps = 1e-6) => {
  assert.notEqual(a, null);
  assert.ok(Math.abs((a as number) - b) < eps, `${a} is not within ${eps} of ${b}`);
};

test("price below the circle value: duty and registration on the circle value", () => {
  const r = computeYield(base({ price: 10_00_000, circleValue: 15_00_000 }));
  assert.equal(r.dutyOnCircleValue, true);
  assert.equal(r.dutyBase, 15_00_000);
  assert.equal(r.stampDuty, 1_05_000); // 7% of 15 lakh
  assert.equal(r.registrationFee, 15_000); // 1% of 15 lakh
  assert.equal(r.brokerLegal, 20_000); // 2% of the price, not of the circle value
  assert.equal(r.totalCost, 11_40_000);
  // Appreciation runs on the price actually paid.
  assert.equal(r.exitValueGross, Math.round(10_00_000 * 1.08 ** 5));
});

test("zero income: IRR equals CAGR and the solver still converges", () => {
  const r = computeYield(base());
  assert.equal(r.totalCost, 11_00_000); // 10L + 70,000 duty + 10,000 registration + 20,000 broker
  assert.equal(r.exitValueGross, 14_69_328);
  assert.equal(r.sellingCost, 29_387);
  assert.equal(r.exitValueNet, 14_39_941);
  assert.equal(r.totalIncome, 0);
  assert.deepEqual(r.cashFlows.slice(1, -1), [0, 0, 0, 0]);
  const expected = (14_39_941 / 11_00_000) ** (1 / 5) - 1;
  close(r.cagr, expected);
  close(r.irr, expected, 1e-7);
  assert.equal(r.grossYield, 0);
  assert.equal(r.netProfit, 14_39_941 - 11_00_000);
});

test("one-year hold with income and holding cost", () => {
  const r = computeYield(base({ years: 1, appreciationPct: 10, incomePerYear: 50_000, holdingCostPerYear: 10_000 }));
  assert.equal(r.years.length, 1);
  assert.equal(r.exitValueNet, 11_00_000 - 22_000);
  assert.equal(r.cashFlows[1], 50_000 - 10_000 + 10_78_000);
  const expected = 11_18_000 / 11_00_000 - 1;
  close(r.irr, expected);
  close(r.cagr, expected);
  close(r.grossYield, 50_000 / 11_00_000);
  assert.equal(r.years[0].cumulative, 11_18_000 - 11_00_000);
  assert.equal(r.fdValue, Math.round(11_00_000 * 1.07));
});

test("female buyer pays the lower duty rate from the rules", () => {
  const male = computeYield(base());
  const female = computeYield(base({ buyer: "female" }));
  assert.equal(female.dutyRule.buyerCategory, "female");
  assert.equal(female.stampDuty, 60_000);
  assert.equal(female.totalCost, male.totalCost - 10_000);
  assert.ok((female.irr as number) > (male.irr as number));
});

test("bigha input converts with the factor passed in, and prices off the circle value", () => {
  const bighaSqm = 2529.285; // data/units.json today: the Awadh pakka bigha, 0.625 acre
  const sqm = areaToSqm(2, "bigha", bighaSqm);
  close(sqm, 5058.57, 1e-9);
  close(areaToSqm(1, "acre", bighaSqm) * 0.625, bighaSqm, 1e-3);
  // ₹1,000 per sq m circle rate on 2 bigha, bought for 40 lakh: duty on the circle value.
  const r = computeYield(base({ price: 40_00_000, circleValue: Math.round(sqm * 1000) }));
  assert.equal(r.dutyBase, 50_58_570);
  assert.equal(r.dutyOnCircleValue, true);
  assert.equal(r.stampDuty, Math.round(50_58_570 * 0.07));
  close(sqm * SQFT_PER_SQM, 54_449.9, 0.1);
});

test("IRR edge cases", () => {
  close(irr([-100, 0, 0, 0, 150]), 1.5 ** 0.25 - 1, 1e-7);
  assert.equal(irr([-100, -10, -10]), null); // nothing ever comes back
  assert.equal(irr([100, 10]), null); // nothing is ever paid
  close(irr([-100, 10, 10, 110]), 0.1, 1e-7); // a 10% coupon bond
  // A loss still has a rate.
  const lost = irr([-100, 0, 80]) as number;
  assert.ok(lost < 0 && Math.abs(lost - (0.8 ** 0.5 - 1)) < 1e-7);
});

test("Indian number formatting round-trips", () => {
  assert.equal(groupIndian(1_00_000), "1,00,000");
  assert.equal(groupIndian(1_23_45_678), "1,23,45,678");
  assert.equal(parseIndian("1,23,45,678"), 1_23_45_678);
  assert.equal(groupIndian(0), "");
});
