/**
 * Debt Simplification Algorithm for Paylog
 * Computes individual net balances across shared expenses and recorded settlements,
 * and simplifies multi-party debts into the minimum number of direct transfers
 * while strictly preserving every member's net balance.
 */

/**
 * Computes net balances for all members in a group.
 * Positive balance = member is owed money (creditor).
 * Negative balance = member owes money (debtor).
 * Zero balance = settled.
 *
 * @param {Array<{ id: string, name?: string }>} members
 * @param {Array<{ member_id: string, amount_paise: number|string }>} payers
 * @param {Array<{ member_id: string, amount_paise: number|string }>} allocations
 * @param {Array<{ from_member_id: string, to_member_id: string, amount_paise: number|string, status?: string }>} settlements
 * @returns {Map<string, number>} Map of memberId -> netPaise
 */
export function calculateNetBalances(members, payers = [], allocations = [], settlements = []) {
  const netMap = new Map();

  for (const member of members) {
    netMap.set(member.id, 0);
  }

  // Add payments (credits to the payer)
  for (const payer of payers) {
    const current = netMap.get(payer.member_id) || 0;
    netMap.set(payer.member_id, current + Number(payer.amount_paise));
  }

  // Subtract expense shares (debits to the participant)
  for (const alloc of allocations) {
    const current = netMap.get(alloc.member_id) || 0;
    netMap.set(alloc.member_id, current - Number(alloc.amount_paise));
  }

  // Adjust recorded completed settlements
  for (const settlement of settlements) {
    if (settlement.status === 'completed' || !settlement.status) {
      const amount = Number(settlement.amount_paise);
      // Payer of settlement sent money -> their net increases (they paid down debt or gave credit)
      const fromCurrent = netMap.get(settlement.from_member_id) || 0;
      netMap.set(settlement.from_member_id, fromCurrent + amount);

      // Recipient received money -> their net decreases
      const toCurrent = netMap.get(settlement.to_member_id) || 0;
      netMap.set(settlement.to_member_id, toCurrent - amount);
    }
  }

  return netMap;
}

/**
 * Simplifies debts using greedy max-debtor to max-creditor matching.
 * Preserves the exact net balance of every participant.
 *
 * @param {Map<string, number>} netMap Map of memberId -> netPaise
 * @param {Map<string, string>} memberNamesMap Map of memberId -> memberName
 * @returns {Array<{ fromMemberId: string, fromName: string, toMemberId: string, toName: string, amountPaise: number }>}
 */
export function simplifyDebts(netMap, memberNamesMap = new Map()) {
  const debtors = [];
  const creditors = [];

  for (const [memberId, balance] of netMap.entries()) {
    if (balance < 0) {
      debtors.push({ memberId, netPaise: balance });
    } else if (balance > 0) {
      creditors.push({ memberId, netPaise: balance });
    }
  }

  // Sort descending by magnitude
  debtors.sort((a, b) => a.netPaise - b.netPaise); // most negative first
  creditors.sort((a, b) => b.netPaise - a.netPaise); // largest credit first

  const transactions = [];

  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex];
    const creditor = creditors[cIndex];

    const debtRemaining = -debtor.netPaise;
    const creditRemaining = creditor.netPaise;

    const transfer = Math.min(debtRemaining, creditRemaining);

    if (transfer > 0) {
      transactions.push({
        fromMemberId: debtor.memberId,
        fromName: memberNamesMap.get(debtor.memberId) || debtor.memberId,
        toMemberId: creditor.memberId,
        toName: memberNamesMap.get(creditor.memberId) || creditor.memberId,
        amountPaise: transfer,
      });

      debtor.netPaise += transfer;
      creditor.netPaise -= transfer;
    }

    if (debtor.netPaise === 0) {
      dIndex++;
    }
    if (creditor.netPaise === 0) {
      cIndex++;
    }
  }

  return transactions;
}
