export const calculateHealthScore = (income = [], expenses = [], invoices = [], prevMonths = []) => {
  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const unpaidInvoices = invoices.filter((item) => item.status !== "paid")
  const overdueInvoices = invoices.filter((item) => item.status === "overdue")
  const savingsRate = totalIncome > 0 ? Math.max((totalIncome - totalExpenses) / totalIncome, 0) : 0
  const incomeTrend = prevMonths.length > 1
    ? prevMonths[prevMonths.length - 1].income - prevMonths[0].income
    : 0

  let score = 40
  score += Math.min(savingsRate * 35, 35)
  score += totalIncome > 0 ? 15 : 0
  score += overdueInvoices.length === 0 ? 10 : -10
  score += unpaidInvoices.length <= 2 ? 5 : -5
  score += incomeTrend >= 0 ? 8 : -8

  const normalizedScore = Math.max(0, Math.min(Math.round(score), 100))
  const grade = normalizedScore >= 85
    ? "A"
    : normalizedScore >= 70
      ? "B"
      : normalizedScore >= 55
        ? "C"
        : normalizedScore >= 40
          ? "D"
          : "E"

  return {
    score: normalizedScore,
    grade,
    breakdown: {
      totalIncome,
      totalExpenses,
      savingsRate,
      unpaidInvoices: unpaidInvoices.length,
      overdueInvoices: overdueInvoices.length,
      incomeTrend,
    },
  }
}

export default calculateHealthScore
