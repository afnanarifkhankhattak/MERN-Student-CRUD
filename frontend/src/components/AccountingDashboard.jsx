// frontend/src/components/AccountingDashboard.jsx

import { useState, useEffect } from 'react';
import {
  ACCOUNTING_URL,
  apiFetch,
} from '../api';

// ── Helpers ─────────────────────────────────────
const toISODate = (d) => d.toISOString().split('T')[0];

const firstOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return toISODate(d);
};

const today = () => toISODate(new Date());

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Color palette for categories
const CATEGORY_COLORS = [
  '#4a72c4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6',
  '#6366f1', '#a855f7', '#6b7280',
];

// Human-readable category labels
const CATEGORY_LABELS = {
  salary: 'Salary',
  utilities: 'Utilities',
  internet: 'Internet',
  rent: 'Rent',
  maintenance: 'Maintenance',
  transport: 'Transport',
  supplies: 'Supplies',
  sports: 'Sports',
  events: 'Events',
  marketing: 'Marketing',
  legal: 'Legal',
  charity: 'Charity',
  other: 'Other',
};

function AccountingDashboard() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [year, setYear] = useState(new Date().getFullYear());

  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Load summary + monthly in parallel ─────────
  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, monthRes] = await Promise.all([
        apiFetch(`${ACCOUNTING_URL}/summary?from=${from}&to=${to}`),
        apiFetch(`${ACCOUNTING_URL}/monthly?year=${year}`),
      ]);
      const sumData = await sumRes.json();
      const monthData = await monthRes.json();

      if (!sumRes.ok) throw new Error(sumData.message || 'Failed to load summary');
      setSummary(sumData.data);

      if (monthRes.ok) setMonthly(monthData.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, year]);

  // ── Render ─────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerWrap}>
        <h2 style={styles.heading}>📊 Accounting Dashboard</h2>
        <p style={styles.subtitle}>
          Real-time view of income, expenses, and net balance.
        </p>
      </div>

      {/* Date range + year pickers */}
      <div style={styles.controls}>
        <div style={styles.dateGroup}>
          <label style={styles.dateLabel}>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={styles.dateInput}
          />
        </div>
        <div style={styles.dateGroup}>
          <label style={styles.dateLabel}>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={styles.dateInput}
          />
        </div>
        <div style={styles.dateGroup}>
          <label style={styles.dateLabel}>Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ ...styles.dateInput, width: '80px' }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setFrom(firstOfMonth());
            setTo(today());
            setYear(new Date().getFullYear());
          }}
          style={styles.resetBtn}
        >
          ↺ This Month
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <p style={styles.info}>Loading financial data...</p>
      ) : summary ? (
        <>
          {/* ── Summary cards ─────────────────── */}
          <div style={styles.summaryGrid}>
            <div style={{ ...styles.summaryCard, borderTopColor: '#10b981' }}>
              <div style={styles.summaryLabel}>Total Income</div>
              <div style={{ ...styles.summaryValue, color: '#10b981' }}>
                Rs {Number(summary.totals.income).toLocaleString()}
              </div>
              <div style={styles.summarySub}>
                {summary.totals.incomeCount} payment(s) received
              </div>
            </div>

            <div style={{ ...styles.summaryCard, borderTopColor: '#dc3545' }}>
              <div style={styles.summaryLabel}>Total Expenses</div>
              <div style={{ ...styles.summaryValue, color: '#dc3545' }}>
                Rs {Number(summary.totals.expenses).toLocaleString()}
              </div>
              <div style={styles.summarySub}>
                {summary.totals.expenseCount} expense(s) recorded
              </div>
            </div>

            <div
              style={{
                ...styles.summaryCard,
                borderTopColor: summary.totals.net >= 0 ? '#10b981' : '#dc3545',
              }}
            >
              <div style={styles.summaryLabel}>Net Balance</div>
              <div
                style={{
                  ...styles.summaryValue,
                  color: summary.totals.net >= 0 ? '#10b981' : '#dc3545',
                }}
              >
                {summary.totals.net >= 0 ? '+' : '−'} Rs{' '}
                {Math.abs(summary.totals.net).toLocaleString()}
              </div>
              <div style={styles.summarySub}>
                {summary.totals.net >= 0 ? 'Surplus' : 'Deficit'}
              </div>
            </div>

            <div style={{ ...styles.summaryCard, borderTopColor: '#4a72c4' }}>
              <div style={styles.summaryLabel}>Collection Ratio</div>
              <div style={{ ...styles.summaryValue, color: '#4a72c4' }}>
                {summary.totals.income > 0
                  ? Math.round(
                      (summary.totals.income /
                        (summary.totals.income + summary.totals.expenses)) *
                        100
                    )
                  : 0}
                %
              </div>
              <div style={styles.summarySub}>
                Income ÷ (Income + Expenses)
              </div>
            </div>
          </div>

          {/* ── Two-column: category breakdown + income by method ── */}
          <div style={styles.twoColumn}>
            {/* Category pie (via bars) */}
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>Expenses by Category</h3>
                <span style={styles.panelTag}>
                  {summary.expenseByCategory.length} categories
                </span>
              </div>

              {summary.expenseByCategory.length === 0 ? (
                <p style={styles.emptyText}>No expenses in this period.</p>
              ) : (
                <div style={styles.categoryList}>
                  {summary.expenseByCategory.map((cat, idx) => {
                    const pct = summary.totals.expenses
                      ? (cat.total / summary.totals.expenses) * 100
                      : 0;
                    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                    return (
                      <div key={cat.category} style={styles.categoryRow}>
                        <div style={styles.categoryTop}>
                          <span style={styles.categoryName}>
                            <span
                              style={{
                                ...styles.categoryDot,
                                backgroundColor: color,
                              }}
                            />
                            {CATEGORY_LABELS[cat.category] || cat.category}
                          </span>
                          <span style={styles.categoryAmount}>
                            Rs {Number(cat.total).toLocaleString()}
                            <span style={styles.categoryPct}>
                              {' '}
                              ({Math.round(pct)}%)
                            </span>
                          </span>
                        </div>
                        <div style={styles.categoryBarOuter}>
                          <div
                            style={{
                              ...styles.categoryBarInner,
                              width: `${pct}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Income by method */}
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>Income by Method</h3>
                <span style={styles.panelTag}>
                  {summary.incomeByMethod.length} method(s)
                </span>
              </div>

              {summary.incomeByMethod.length === 0 ? (
                <p style={styles.emptyText}>No payments in this period.</p>
              ) : (
                <div style={styles.methodList}>
                  {summary.incomeByMethod.map((m, idx) => (
                    <div key={m.method} style={styles.methodRow}>
                      <span style={styles.methodName}>
                        {methodEmoji(m.method)} {m.method}
                      </span>
                      <span style={styles.methodAmount}>
                        Rs {Number(m.total).toLocaleString()}
                        <span style={styles.methodCount}>
                          {' '}
                          ({m.count})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Monthly bar chart ─────────────── */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>
                Monthly Income vs Expenses — {year}
              </h3>
              <span style={styles.panelTag}>
                Year Total:{' '}
                <strong style={{ color: monthly?.yearTotals?.net >= 0 ? '#10b981' : '#dc3545' }}>
                  {monthly?.yearTotals?.net >= 0 ? '+' : '−'} Rs{' '}
                  {Math.abs(monthly?.yearTotals?.net || 0).toLocaleString()}
                </strong>
              </span>
            </div>

            {monthly && monthly.months.length > 0 ? (
              <MonthlyBarChart months={monthly.months} />
            ) : (
              <p style={styles.emptyText}>No monthly data available.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ──────────────────────────────────────────────
// Monthly Bar Chart (CSS-only)
// ──────────────────────────────────────────────
function MonthlyBarChart({ months }) {
  const maxValue = Math.max(
    1,
    ...months.map((m) => Math.max(m.income, m.expenses))
  );

  return (
    <div style={styles.chartWrap}>
      {/* Legend */}
      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#10b981' }} />
          Income
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#dc3545' }} />
          Expenses
        </span>
      </div>

      {/* Bars */}
      <div style={styles.chart}>
        {months.map((m, idx) => {
          const incomeHeight = (m.income / maxValue) * 100;
          const expenseHeight = (m.expenses / maxValue) * 100;
          const monthNum = parseInt(m.month.split('-')[1], 10);
          return (
            <div key={m.month} style={styles.chartColumn}>
              <div style={styles.barPair}>
                <div
                  style={{
                    ...styles.bar,
                    height: `${incomeHeight}%`,
                    backgroundColor: '#10b981',
                  }}
                  title={`Income: Rs ${Number(m.income).toLocaleString()}`}
                />
                <div
                  style={{
                    ...styles.bar,
                    height: `${expenseHeight}%`,
                    backgroundColor: '#dc3545',
                  }}
                  title={`Expenses: Rs ${Number(m.expenses).toLocaleString()}`}
                />
              </div>
              <div style={styles.chartMonthLabel}>
                {MONTH_NAMES[monthNum - 1]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Y-axis label */}
      <div style={styles.yAxisLabel}>
        Max: Rs {Number(maxValue).toLocaleString()}
      </div>
    </div>
  );
}

// Small helper
function methodEmoji(method) {
  const map = {
    cash: '💵',
    'bank-transfer': '🏦',
    cheque: '📝',
    card: '💳',
    online: '🌐',
    other: '📎',
  };
  return map[method] || '📎';
}

// ── Styles ──────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1500px',
    margin: '20px auto',
    fontFamily: 'Arial, sans-serif',
  },
  headerWrap: { textAlign: 'center', marginBottom: '20px' },
  heading: { margin: 0, fontSize: '24px', color: '#1e2a4a' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#6b7280' },

  controls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    marginBottom: '20px',
    flexWrap: 'wrap',
    padding: '14px',
    backgroundColor: '#eef3fb',
    borderRadius: '10px',
  },
  dateGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  dateLabel: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  dateInput: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  resetBtn: {
    padding: '9px 18px',
    backgroundColor: '#4a72c4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  error: {
    backgroundColor: '#fde8e8',
    color: '#991b1b',
    border: '1px solid #f5c2c2',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  info: { textAlign: 'center', color: '#6b7280', padding: '40px' },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: '16px 20px',
    borderRadius: '12px',
    borderTop: '4px solid #4a72c4',
    boxShadow: '0 2px 8px rgba(30, 42, 74, 0.05)',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: '4px',
  },
  summarySub: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
  },

  twoColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  panel: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(30, 42, 74, 0.05)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  panelTitle: { margin: 0, fontSize: '15px', color: '#1e2a4a' },
  panelTag: {
    fontSize: '11px',
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '4px 12px',
    borderRadius: '20px',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '30px',
    fontSize: '13px',
  },

  categoryList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  categoryRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  categoryTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  categoryName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  categoryDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
  },
  categoryAmount: {
    color: '#1e2a4a',
    fontWeight: 'bold',
  },
  categoryPct: {
    color: '#9ca3af',
    fontWeight: 'normal',
    fontSize: '11px',
  },
  categoryBarOuter: {
    height: '8px',
    backgroundColor: '#f1f3f5',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  categoryBarInner: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },

  methodList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  methodRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    fontSize: '13px',
  },
  methodName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textTransform: 'capitalize',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  methodAmount: {
    fontWeight: 'bold',
    color: '#1e2a4a',
  },
  methodCount: {
    color: '#9ca3af',
    fontWeight: 'normal',
    fontSize: '11px',
  },

  chartWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  legend: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#4b5563',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
  },
  chart: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '8px',
    height: '220px',
    alignItems: 'flex-end',
    padding: '10px 0',
    borderBottom: '2px solid #e3e8f0',
  },
  chartColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barPair: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '3px',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
  },
  bar: {
    width: '40%',
    minHeight: '2px',
    borderRadius: '3px 3px 0 0',
    transition: 'height 0.3s ease',
  },
  chartMonthLabel: {
    fontSize: '10px',
    color: '#6b7280',
    fontWeight: 'bold',
  },
  yAxisLabel: {
    textAlign: 'right',
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
};

export default AccountingDashboard;