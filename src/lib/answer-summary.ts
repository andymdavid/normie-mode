interface TaskPosition {
  task: { label: string };
  pos: { position: number; of: number };
}

export function modelAnswer(modelName: string, positions: TaskPosition[], independentTests: number) {
  const topThree = positions.filter((item) => item.pos.position <= 3);
  const tasks = topThree.slice(0, 3).map((item) => item.task.label.replace(/^Best AI for /, '').toLowerCase());
  const answer = positions.length === 0
    ? `${modelName} does not have enough relevant independent results for a Normie Mode task score yet.`
    : topThree.length === 0
      ? `${modelName} is scored for ${positions.length} task${positions.length === 1 ? '' : 's'}, but does not currently rank in the top three for any of them.`
      : `${modelName} ranks in the top three for ${topThree.length} of ${positions.length} scored task${positions.length === 1 ? '' : 's'}, including ${tasks.join(', ')}.`;
  const limitation = independentTests === 0
    ? 'There are no independent results for this exact version yet.'
    : independentTests < 8
      ? `Only ${independentTests} independent result${independentTests === 1 ? ' is' : 's are'} available for this exact version so far.`
      : `Task positions use only the relevant tests listed on this page; they are not a claim that one model is best at everything.`;
  return { answer, limitation };
}
