// frontend/src/components/FeeInvoiceTable.jsx

import { useEffect, useState } from 'react';
import {
  FEE_INVOICES_URL as API_URL,
  CLASSES_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

const INVOICES_PER_PAGE = 15;

const STATUS_STYLE = {
  unpaid:  { backgroundColor: '#fee2e2', color: '#991b1b' },
  partial: { backgroundColor: '#fef3c7', color: '#92400e' },
  paid:    { backgroundColor: '#d4edda', color: '#155724' },
  overdue: { backgroundColor: '#fecaca', color: '#7f1d1d' },
  waived:  { backgroundColor: '#e0e7ff', color: '#3730a3' },
};

function FeeInvoiceTable({
  refreshTrigger,
  onGenerateClick,
  onViewInvoice,
  onDelete,
}) {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    class: '',
    academicYear: '',
    status: '',
    period: '',
  });

  // Load filter options
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, yRes] = await Promise.all([
          apiFetch(CLASSES_URL),
          apiFetch(ACADEMIC_YEARS_URL),
        ]);
        const cData = await cRes.json();
        const yData = await yRes.json();
        if (cRes.ok) setClasses(cData.data || []);
        if (yRes.ok) setAcademicYears(yData.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // Fetch invoices + summary
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.status) params.append('status', filters.status);
      if (filters.period) params.append('period', filters.period);
      const q = params.toString();

      const [invRes, sumRes] = await Promise.all([
        apiFetch(q ? `${API_URL}?${q}` : API_URL),
        apiFetch(`${API_URL}/summary${q ? `?${q}` : ''}`),
      ]);

      const invData = await invRes.json();
      const sumData = await sumRes.json();

      if (!invRes.ok) throw new Error(invData.message || 'Failed to fetch invoices');
      setInvoices(invData.data || []);
      if (sumRes.ok) setSummary(sumData.data || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    refreshTrigger,
    filters.class,
    filters.academicYear,
    filters.status,
    filters.period,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.class, filters.academicYear, filters.status, filters.period]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(invoices.length / INVOICES_PER_PAGE));
    if (currentPage > tp) setCurrentPage(tp);
  }, [invoices, currentPage]);

  const totalPages = Math.max(1, Math.ceil(invoices.length / INVOICES_PER_PAGE));
  const startIndex = (currentPage - 1) * INVOICES_PER_PAGE;
  const currentInvoices = invoices.slice(startIndex, startIndex + INVOICES_PER_PAGE);

  const isOverdue = (inv) => {
    if (inv.status === 'paid' || inv.status === 'waived') return false;
    if (!inv.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return inv.dueDate < today;
  };

  const renderFilters = () => (
    <div style={styles.filterBar}>
      <select
        value={filters.class}
        onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Classes</option>
        {classes.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>

      <select
        value={filters.academicYear}
        onChange={(e) => setFilters((f) => ({ ...f, academicYear: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Years</option>
        {academicYears.map((y) => (
          <option key={y._id} value={y._id}>{y.name}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Period (e.g. 2025-01)"
        value={filters.period}
        onChange={(e) => setFilters((f) => ({ ...f, period: e.target.value }))}
        style={styles.filterInput}
      />

      <select
        value={filters.status}
        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Statuses</option>
        <option value="unpaid">Unpaid</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
        <option value="waived">Waived</option>
      </select>

      {(filters.class || filters.academicYear || filters.status || filters.period) && (
        <button
          type="button"
          onClick={() =>
            setFilters({ class: '', academicYear: '', status: '', period: '' })
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
      {/* Header with Generate button */}
      <div style={styles.headerWrap}>
        <h2 style={styles.heading}>Fee Invoices</h2>
        <button
          style={styles.generateBtn}
          onClick={onGenerateClick}
        >
          ⚡ Generate Invoices
        </button>
      </div>

      {/* Summary strip */}
      {summary && (
        <div style={styles.summaryStrip}>
          <div style={styles.summaryCell}>
            <div style={styles.summaryLabel}>Total Invoices</div>
            <div style={styles.summaryValue}>{summary.count}</div>
          </div>
          <div style={styles.summaryCell}>
            <div style={styles.summaryLabel}>Total Billed</div>
            <div style={styles.summaryValue}>
              Rs {Number(summary.billed || 0).toLocaleString()}
            </div>
          </div>
          <div style={styles.summaryCell}>
            <div style={styles.summaryLabel}>Collected</div>
            <div style={{ ...styles.summaryValue, color: '#10b981' }}>
              Rs {Number(summary.collected || 0).toLocaleString()}
            </div>
          </div>
          <div style={styles.summaryCell}>
            <div style={styles.summaryLabel}>Outstanding</div>
            <div style={{ ...styles.summaryValue, color: '#dc3545' }}>
              Rs {Number(summary.outstanding || 0).toLocaleString()}
            </div>
          </div>
          <div style={styles.summaryCell}>
            <div style={styles.summaryLabel}>By Status</div>
            <div style={styles.summaryStatusRow}>
              <span style={{ color: '#991b1b' }}>U: {summary.byStatus?.unpaid || 0}</span>
              <span style={{ color: '#92400e' }}>P: {summary.byStatus?.partial || 0}</span>
              <span style={{ color: '#155724' }}>✓: {summary.byStatus?.paid || 0}</span>
              <span style={{ color: '#7f1d1d' }}>O: {summary.byStatus?.overdue || 0}</span>
            </div>
          </div>
        </div>
      )}

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading invoices...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : invoices.length === 0 ? (
        <p style={styles.info}>
          No invoices found. Click <strong>⚡ Generate Invoices</strong> to create them.
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Invoice #</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Period</th>
                  <th style={styles.th}>Due</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Paid</th>
                  <th style={styles.th}>Balance</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoices.map((inv, i) => {
                  const overdue = isOverdue(inv);
                  const balance = Math.max(0, inv.totalAmount - inv.paidAmount);
                  return (
                    <tr key={inv._id} style={styles.bodyRow}>
                      <td style={styles.td}>{startIndex + i + 1}</td>
                      <td style={styles.td}>
                        <span style={styles.invoiceNo}>{inv.invoiceNo}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.studentCell}>
                          {inv.student?.picture && (
                            <img
                              src={inv.student.picture}
                              alt=""
                              style={styles.avatar}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <strong>{inv.student?.name || '—'}</strong>
                            {inv.student?.regNo && (
                              <div style={styles.subText}>{inv.student.regNo}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{inv.class?.name || '—'}</td>
                      <td style={styles.td}>
                        <div>{inv.periodLabel || inv.period}</div>
                        {inv.enrollment?.rollNo && (
                          <div style={styles.subText}>Roll #{inv.enrollment.rollNo}</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div>{inv.dueDate || '—'}</div>
                        {overdue && (
                          <div style={styles.overdueTag}>Overdue</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <strong>Rs {Number(inv.totalAmount || 0).toLocaleString()}</strong>
                      </td>
                      <td style={styles.td}>
                        Rs {Number(inv.paidAmount || 0).toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        <strong
                          style={{
                            color: balance > 0 ? '#dc3545' : '#10b981',
                          }}
                        >
                          Rs {balance.toLocaleString()}
                        </strong>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(overdue
                              ? STATUS_STYLE.overdue
                              : STATUS_STYLE[inv.status] || STATUS_STYLE.unpaid),
                          }}
                        >
                          {overdue ? 'overdue' : inv.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button
                            style={{ ...styles.actionBtn, ...styles.viewBtn }}
                            onClick={() => onViewInvoice(inv)}
                          >
                            Open
                          </button>
                          <button
                            style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                            onClick={() => onDelete(inv)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            {Math.min(startIndex + INVOICES_PER_PAGE, invoices.length)} of{' '}
            {invoices.length} invoices
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1600px',
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
  generateBtn: {
    padding: '11px 20px',
    backgroundColor: '#6f42c1',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  summaryStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '16px',
  },
  summaryCell: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '12px 16px',
    border: '1px solid #eef1f6',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    marginTop: '2px',
  },
  summaryStatusRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    marginTop: '4px',
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
  filterInput: {
    padding: '9px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    minWidth: '160px',
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
  invoiceNo: {
    backgroundColor: '#eef3fb',
    color: '#4a72c4',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  studentCell: { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  subText: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  overdueTag: {
    fontSize: '10px',
    color: '#991b1b',
    fontWeight: 'bold',
    marginTop: '2px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
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

export default FeeInvoiceTable;