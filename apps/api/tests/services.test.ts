import { describe,expect,it } from "vitest";
import { calculateMetrics, compareCode, tokenizeJava } from "../src/services/comparison.js";
import { recommend } from "../src/services/recommendations.js";
import { buildTree } from "../src/services/tree.js";
import { calculateStreak } from "../src/services/streak.js";

describe("comparison and metrics",()=>{
  it("ignores formatting in syntax mode",()=>expect(compareCode("class A{ }","class A {\n}","syntax").tokenAccuracy).toBe(100));
  it("detects incorrect identifiers",()=>expect(compareCode("int count;","int total;","syntax").tokenAccuracy).toBeLessThan(100));
  it("tokenizes annotations and generics",()=>expect(tokenizeJava("@Valid List<String> x;")).toEqual(["@","Valid","List","<","String",">","x",";"]));
  it("calculates documented ratios",()=>{
    const result=calculateMetrics({typedCode:"abc",activeDurationMs:60000,manualCharacterCount:3,autocompleteCharacterCount:1,keystrokeCount:3,backspaceCount:0,pasteAttemptCount:0,errorCount:0,correctedErrorCount:0,recoveryTimesMs:[1000,3000]},"abc","strict");
    expect(result.correctCharactersPerMinute).toBe(3);expect(result.manualCodingRatio).toBe(75);expect(result.averageRecoveryTimeMs).toBe(2000);
  });
});
describe("recommendations",()=>it("prioritizes repetition then low accuracy",()=>{
  const values=recommend([{fileId:"1",fileName:"A",order:1,completed:true,repeated:false,accuracy:90},{fileId:"2",fileName:"B",order:2,completed:true,repeated:true}]);
  expect(values[0]?.fileId).toBe("2");
}));
describe("tree",()=>it("builds nested repository nodes",()=>{
  const tree=buildTree([{id:"1",path:"src/main/A.java"}] as never);
  expect(tree[0]?.children?.[0]?.children?.[0]?.fileId).toBe("1");
}));
describe("streak",()=>{
  it("counts consecutive UTC days ending today",()=>{
    const today=new Date("2026-07-29T12:00:00Z");
    const dates=[new Date("2026-07-29T01:00:00Z"),new Date("2026-07-28T01:00:00Z"),new Date("2026-07-27T01:00:00Z")];
    expect(calculateStreak(dates,today)).toBe(3);
  });
  it("returns zero when the latest practice is older than yesterday",()=>{
    expect(calculateStreak([new Date("2026-07-20T01:00:00Z")], new Date("2026-07-29T12:00:00Z"))).toBe(0);
  });
});
