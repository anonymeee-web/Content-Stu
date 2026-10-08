import type {ContentStage} from "@/lib/content-flow";

export type PolicyScope = "news" | "social";
export function stagePolicyScope(stage: ContentStage): PolicyScope {
  return stage === "social" ? "social" : "news";
}
export function rulePolicyScope(rule: {id?: number; text: string; scope?: PolicyScope}): PolicyScope {
  if (rule.scope === "news" || rule.scope === "social") return rule.scope;
  // Existing event recap policy remains a news rule even when it mentions captions.
  if (rule.id === 900001) return "news";
  return /\bcaption\b|social\s+caption/i.test(rule.text) ? "social" : "news";
}
