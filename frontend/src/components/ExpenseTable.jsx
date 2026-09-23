// frontend/src/components/ExpenseTable.jsx

import { useEffect, useState } from 'react';
import {
  EXPENSES_URL as API_URL,
  apiFetch,
} from '../api';

const EXPENSES_PER_PAGE = 15;

const CATEGORY_STYLE = {
  salary:      { backgroundColor: '#dbeafe', color: '#1e40af' },
  utilities:   { backgroundColor: '#fef3c7', color: '#92400e' },
  internet:    { backgroundColor: '#cffafe', color: '#155e75' },
  rent:        { backgroundColor: '#ede9fe', color: '#5b21b6' },
  maintenance: { backgroundColor: '#ffedd5', color: '#9a3412' },
  transport:   { backgroundColor: '#dcfce7', color: '#166534' },
  supplies:    { backgroundColor: '#fce7f3', color: '#9d174d' },
  sports:      { backgroundColor: '#e0f2fe', color: '#075985' },
  events:      { backgroundColor: '#f3e8ff', color: '#6b21a8' },
  marketing:   { backgroundColor: '#fef9c3', color: '#854d0e' },
  legal:       { backgroundColor: '#f1f3f5', color: '#374151' },
  charity:     { backgroundColor: '#fee2e2', color: '#991b1b' },
  other:       { backgroundColor: '#f1f3f5', color: '#6b7280' },
};

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

function ExpenseTable({ refreshTrigger, onEdit, onDelete }) {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    from: '',
    to: '',
    search: '',
  });

  // Load categories once
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`${API_URL}/categories`);
        const data = await res.json();
        if (res.ok) setCategories(data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.search.trim()) params.append('search', filters.search.trim());
      const q = params.toString();
      const url = q ? `${API_URL}?${q}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch expenses');
      setExpenses(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.category, filters.from, filters.to, filters.search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.category, filters.from, filters.to, filters.search]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(expenses.length / EXPENSES_PER_PAGE));
    if (currentPage > tp) setCurrentPage(tp);
  }, [expenses, currentPage]);

  const totalPages = Math.max(1, Math.ceil(expenses.length / EXPENSES_PER_PAGE));
  const startIndex = (currentPage - 1) * EXPENSES_PER_PAGE;
  const currentExpenses = expenses.slice(startIndex, startIndex + EXPENSES_PER_PAGE);

  const renderFilters = () => (
    <div style={styles.filterBar}>
      <input
        type="text"
        placeholder="🔍 Search title, vendor, reference..."
        value={filters.search}
        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        style={styles.filterInput}
      />

      <select
        value={filters.category}
        onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
        ))}
      </select>

      <div style={styles.dateGroup}>
        <label style={styles.dateLabel}>From</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          style={styles.dateInput}
        />
      </div>

      <div style={styles.dateGroup}>
        <label style={styles.dateLabel}>To</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          style={styles.dateInput}
        />
      </div>

      {(filters.category || filters.from || filters.to || filters.search) && (
        <button
          type="button"
          onClick={() =>
            setFilters({ category: '', from: '', to: '', search: '' })
          }
          style={styles.clearBtn}
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.headerWrap}>
        <h2 style={styles.heading}>All Expenses</h2>
        {expenses.length > 0 && (
          <div style={styles.totalBox}>
            Filtered Total: <strong>Rs {Number(total).toLocaleString()}</strong>
          </div>
        )}
      </div>

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading expenses...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : expenses.length === 0 ? (
        <p style={styles.info}>
          No expenses found. Add one above! 👆
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Vendor</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Reference</th>
                  <th style={styles.th}>Recorded By</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentExpenses.map((exp, i) => (
                  <tr key={exp._id} style={styles.bodyRow}>
                    <td style={styles.td}>{startIndex + i + 1}</td>
                    <td style={styles.td}>
                      <span style={styles.dateBadge}>{exp.date}</span>
                    </td>
                    <td style={styles.td}>
                      <strong>{exp.title}</strong>
                      {exp.notes && (
                        <div style={styles.subText}>{exp.notes}</div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.categoryBadge,
                          ...(CATEGORY_STYLE[exp.category] || CATEGORY_STYLE.other),
                        }}
                      >
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {exp.vendor || <span style={styles.muted}>—</span>}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.methodPill}>{exp.paymentMethod}</span>
                    </td>
                    <td style={styles.td}>
                      {exp.referenceNo || <span style={styles.muted}>—</span>}
                    </td>
                    <td style={styles.td}>
                      {exp.recordedBy?.username || <span style={styles.muted}>—</span>}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <strong>Rs {Number(exp.amount).toLocaleString()}</strong>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.editBtn }}
                          onClick={() => onEdit(exp)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          onClick={() => onDelete(exp)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={styles.pagination}>
            <button
              style={{
                ...styles.pageBtn,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                style={{
                  ...styles.pageBtn,
                  ...(page === currentPage ? styles.pageBtnActive : {}),
                }}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              style={{
                ...styles.pageBtn,
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>

          <div style={styles.pageInfo}>
            Showing {startIndex + 1}–
            {Math.min(startIndex + EXPENSES_PER_PAGE, expenses.length)} of{' '}
            {expenses.length} expenses
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1500px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  headerWrap: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  heading: { margin: 0, color: '#1e2a4a', fontSize: '20px' },
  totalBox: {
    padding: '8px 16px',
    backgroundColor: '#fef3c7',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#92400e',
    border: '1px solid #fde68a',
  },
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterInput: {
    flex: '1 1 240px',
    padding: '9px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    minWidth: '200px',
    outline: 'none',
    backgroundColor: '#fff',
  },
  filterSelect: {
    padding: '9px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    backgroundColor: '#fff',
    minWidth: '150px',
  },
  dateGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '4px 10px',
    backgroundColor: '#fff',
  },
  dateLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  dateInput: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: 'transparent',
  },
  clearBtn: {
    padding: '9px 14px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  headerRow: { backgroundColor: '#1e2a4a', color: 'white' },
  bodyRow: { borderBottom: '1px solid #eef1f6' },
  th: {
    padding: '10px',
    textAlign: 'left',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  },
  td: { padding: '10px', fontSize: '13px', verticalAlign: 'middle' },
  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  muted: { color: '#9ca3af' },
  dateBadge: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  categoryBadge: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  methodPill: {
    backgroundColor: '#f1f3f5',
    color: '#4b5563',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  actionRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  actionBtn: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  editBtn: { backgroundColor: '#28a745' },
  deleteBtn: { backgroundColor: '#dc3545' },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    marginTop: '20px',
    flexWrap: 'wrap',
  },
  pageBtn: {
    padding: '8px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#333',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  pageBtnActive: {
    backgroundColor: '#4a72c4',
    color: 'white',
    borderColor: '#4a72c4',
  },
  pageInfo: {
    textAlign: 'center',
    marginTop: '10px',
    color: '#666',
    fontSize: '13px',
  },
  info: { textAlign: 'center', color: '#666', margin: '20px' },
  error: { textAlign: 'center', color: '#dc3545', margin: '20px' },
};

export default ExpenseTable;