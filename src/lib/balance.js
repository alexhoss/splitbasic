// Core money logic for the app.

export const round2 = (n) => Math.round(n * 100) / 100

/**
 * Compute each person's net balance from expenses and recorded payments.
 * Positive balance = they are owed money (a creditor).
 * Negative balance = they owe money (a debtor).
 * A payment from A to B increases A's balance (debt reduced) and
 * decreases B's (money owed reduced).
 */
export function computeBalances(expenses, payments = []) {
  const net = new Map() // personId -> net balance
  const track = (id, amount) => net.set(id, round2((net.get(id) || 0) + amount))

  for (const p of payments) {
    track(p.fromId, p.amount)
    track(p.toId, -p.amount)
  }

  for (const exp of expenses) {
    if (!exp.participants.length) continue
    // Round each share so they sum *exactly* to the expense amount
    // (avoids phantom pennies like $10 / 3 leaving +$0.01 behind).
    const n = exp.participants.length
    const base = Math.floor((exp.amount / n) * 100) / 100
    let remainder = round2(exp.amount - base * n)
    const shares = exp.participants.map((pid) => {
      const extra = Math.min(remainder, 0.01)
      remainder = round2(remainder - extra)
      return { pid, share: round2(base + extra) }
    })

    // The payer is owed the full amount; everyone in the split
    // (including the payer) pays their share towards it.
    track(exp.paidBy, exp.amount)
    for (const { pid, share } of shares) {
      track(pid, -share)
    }
  }
  return net
}

/**
 * Simplify the balances into the minimal set of transfers
 * ("who owes whom") using a greedy pairing of debtors and creditors.
 * Returns [{ fromId, toId, amount }].
 */
export function settleBalances(balances) {
  const debtors = []
  const creditors = []
  for (const [id, balance] of balances) {
    if (balance < -0.005) debtors.push({ id, amount: -balance })
    else if (balance > 0.005) creditors.push({ id, amount: balance })
  }

  const transfers = []
  let d = 0
  let c = 0
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d]
    const creditor = creditors[c]
    const amount = Math.min(debtor.amount, creditor.amount)
    if (amount > 0.005) {
      transfers.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: round2(amount),
      })
    }
    debtor.amount = round2(debtor.amount - amount)
    creditor.amount = round2(creditor.amount - amount)
    if (debtor.amount <= 0.005) d++
    if (creditor.amount <= 0.005) c++
  }
  return transfers
}

export function formatMoney(n) {
  const abs = Math.abs(n)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(abs)
}
