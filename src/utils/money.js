/**
 * Frontend Money Utilities
 */

export function splitEqual(totalPaise, participantCount) {
  if (!Number.isInteger(totalPaise) || totalPaise <= 0) {
    throw new Error('Total amount must be a positive integer in paise');
  }
  if (!Number.isInteger(participantCount) || participantCount <= 0) {
    throw new Error('Participant count must be a positive integer');
  }

  const base = Math.floor(totalPaise / participantCount);
  const remainder = totalPaise % participantCount;

  const shares = [];
  for (let i = 0; i < participantCount; i++) {
    shares.push(i < remainder ? base + 1 : base);
  }

  return shares;
}
