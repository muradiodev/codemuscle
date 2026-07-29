export interface RecommendationCandidate {
  fileId: string; fileName: string; projectId?: string; order: number; completed: boolean; repeated: boolean;
  accuracy?: number; cpm?: number; lastPractisedAt?: Date; weakTopic?: string;
}
export function recommend(candidates: RecommendationCandidate[], limit = 5) {
  const now = Date.now();
  return candidates.map(candidate => {
    let score = candidate.order * -0.01;
    let reason = "Next file in the project sequence";
    if (candidate.repeated) { score += 100; reason = "Marked for repetition"; }
    else if (candidate.accuracy !== undefined && candidate.accuracy < 95) { score += 70 + (95-candidate.accuracy); reason = "Accuracy is below 95%"; }
    else if (!candidate.completed) { score += 50; reason = "Not yet completed"; }
    else if (candidate.lastPractisedAt && now-candidate.lastPractisedAt.getTime() > 7*86_400_000) { score += 35; reason = "Not practised in the last seven days"; }
    else if (candidate.weakTopic) { score += 25; reason = `${candidate.weakTopic} is a weaker topic`; }
    return {...candidate, score, reason};
  }).sort((a,b)=>b.score-a.score).slice(0,limit);
}
