// frontend/src/components/FeePaymentsTable.jsx

import { useEffect, useState } from 'react';
import {
  FEE_PAYMENTS_URL as API_URL,
  apiFetch,
} from '../api';

const PAYMENTS_PER_PAGE = 15;

const METHOD_STYLE = {
  cash:            { backgroundColor: '#d4edda', color: '#155724' },
  'bank-transfer': { backgroundColor: '#dbeafe', color: '#1e40af' },
  cheque:          { backgroundColor: '#fef3c7', color: '#92400e' },
  card:            { backgroundColor: '#ede9fe', color: '#5b21b6' },
  online:          { backgroundColor: '#cffafe', color: '#155e75' },
  other:           { backgroundColor: '#f1f3f5', color: '#6b7280' },
};

function FeePaymentsTable({ refreshTrigger, onViewReceipt, onDelete }) {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    method: '',
    from: '',
    to: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.method) params.append('method', filters.method);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      const q = params.toString();
      const url = q ? `${API_URL}?${q}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch payments');
      setPayments(data.data || []);
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
  }, [refreshTrigger, filters.method, filters.from, filters.to]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.method, filters.from, filters.to]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(payments.length / PAYMENTS_PER_PAGE));
    if (currentPage > tp) setCurrentPage(tp);
  }, [payments, currentPage]);

  const totalPages = Math.max(1, Math.ceil(payments.length / PAYMENTS_PER_PAGE));
  const startIndex = (currentPage - 1) * PAYMENTS_PER_PAGE;
  const currentPayments = payments.slice(startIndex, startIndex + PAYMENTS_PER_PAGE);

  const renderFilters = () => (
    <div style={styles.filterBar}>
      <select
        value={filters.method}
        onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Methods</option>
        <option value="cash">Cash</option>
        <option value="bank-transfer">Bank Transfer</option>
        <option value="cheque">Cheque</option>
        <option value="card">Card</option>
        <option value="online">Online</option>
        <option value="other">Other</option>
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

      {(filters.method || filters.from || filters.to) && (
        <button
          type="button"
          onClick={() => setFilters({ method: '', from: '', to: '' })}
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
        <h2 style={styles.heading}>All Payments</h2>
        {payments.length > 0 && (
          <div style={styles.totalBox}>
            Total: <strong>Rs {Number(total).toLocaleString()}</strong>
          </div>
        )}
      </div>

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading payments...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : payments.length === 0 ? (
        <p style={styles.info}>
          No payments recorded yet.
          {(filters.method || filters.from || filters.to) && (
            <> Try clearing filters.</>
          )}
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Receipt</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Invoice</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Reference</th>
                  <th style={styles.th}>Received By</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPayments.map((p, i) => (
                  <tr key={p._id} style={styles.bodyRow}>
                    <td style={styles.td}>{startIndex + i + 1}</td>
                    <td style={styles.td}>
                      <span style={styles.receiptNo}>{p.receiptNo}</span>
                    </td>
                    <td style={styles.td}>{p.paymentDate}</td>
                    <td style={styles.td}>
                      <strong>{p.student?.name || '—'}</strong>
                      {p.student?.regNo && (
                        <div style={styles.subText}>{p.student.regNo}</div>
                      )}
                    </td>
                    <td style={styles.td}>
                      {p.invoice?.invoiceNo ? (
                        <span style={styles.invoiceNo}>{p.invoice.invoiceNo}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.methodBadge,
                          ...(METHOD_STYLE[p.method] || METHOD_STYLE.other),
                        }}
                      >
                        {p.method}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {p.referenceNo || '—'}
                    </td>
                    <td style={styles.td}>
                      {p.receivedBy?.username || '—'}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <strong>Rs {Number(p.amount).toLocaleString()}</strong>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.viewBtn }}
                          onClick={() => onViewReceipt(p)}
                        >
                          Receipt
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          onClick={() => onDelete(p)}
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
            {Math.min(startIndex + PAYMENTS_PER_PAGE, payments.length)} of{' '}
            {payments.length} payments
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
    backgroundColor: '#eef3fb',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#1e2a4a',
    border: '1px solid #c8e0f9',
  },
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
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
  receiptNo: {
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  invoiceNo: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  methodBadge: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
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
  viewBtn: { backgroundColor: '#4a72c4' },
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

export default FeePaymentsTable;