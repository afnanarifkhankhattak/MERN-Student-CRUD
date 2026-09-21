// frontend/src/components/FeeTable.jsx

import { useEffect, useState } from 'react';
import { FEES_URL as API_URL, apiFetch } from '../api';

const FEES_PER_PAGE = 10;

const statusStyle = {
  Paid:    { backgroundColor: '#d4edda', color: '#155724' },
  Partial: { backgroundColor: '#fff3cd', color: '#856404' },
  Pending: { backgroundColor: '#f8d7da', color: '#721c24' },
};

function FeeTable({ refreshTrigger, onEdit, onDelete }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchFees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_URL);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch fees');
      setFees(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [refreshTrigger]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(fees.length / FEES_PER_PAGE));
    if (currentPage > tp) setCurrentPage(tp);
  }, [fees, currentPage]);

  if (loading) return <p style={styles.info}>Loading fees...</p>;
  if (error) return <p style={styles.error}>Error: {error}</p>;
  if (fees.length === 0) return <p style={styles.info}>No fee records yet. Add one above! 👆</p>;

  const totalPages = Math.max(1, Math.ceil(fees.length / FEES_PER_PAGE));
  const startIndex = (currentPage - 1) * FEES_PER_PAGE;
  const currentFees = fees.slice(startIndex, startIndex + FEES_PER_PAGE);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Fee Records</h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Reg No</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Paid</th>
              <th style={styles.th}>Balance</th>
              <th style={styles.th}>Due Date</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentFees.map((f, i) => (
              <tr key={f._id} style={styles.bodyRow}>
                <td style={styles.td}>{startIndex + i + 1}</td>
                <td style={styles.td}>{f.studentName}</td>
                <td style={styles.td}>{f.regNo}</td>
                <td style={styles.td}>Rs {Number(f.amount).toLocaleString()}</td>
                <td style={styles.td}>Rs {Number(f.paidAmount).toLocaleString()}</td>
                <td style={styles.td}>Rs {Number(f.balance ?? 0).toLocaleString()}</td>
                <td style={styles.td}>{f.dueDate || '—'}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...(statusStyle[f.status] || statusStyle.Pending),
                    }}
                  >
                    {f.status || 'Pending'}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionRow}>
                    <button
                      style={{ ...styles.actionBtn, ...styles.editBtn }}
                      onClick={() => onEdit(f)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                      onClick={() => onDelete(f)}
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
        Showing {startIndex + 1}–{Math.min(startIndex + FEES_PER_PAGE, fees.length)} of {fees.length} records
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1400px', margin: '20px auto', padding: '20px',
    backgroundColor: '#f9f9f9', borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: { textAlign: 'center', color: '#333', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' },
  headerRow: { backgroundColor: '#007bff', color: 'white' },
  bodyRow: { borderBottom: '1px solid #ddd' },
  th: { padding: '10px', textAlign: 'left', fontSize: '13px' },
  td: { padding: '10px', fontSize: '13px', verticalAlign: 'middle' },
  badge: {
    padding: '4px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: 'bold',
  },
  actionRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  actionBtn: {
    padding: '5px 10px', border: 'none', borderRadius: '4px',
    color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
  },
  editBtn: { backgroundColor: '#28a745' },
  deleteBtn: { backgroundColor: '#dc3545' },
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: '6px', marginTop: '20px', flexWrap: 'wrap',
  },
  pageBtn: {
    padding: '8px 14px', border: '1px solid #ccc', borderRadius: '6px',
    backgroundColor: '#fff', color: '#333', cursor: 'pointer',
    fontSize: '13px', fontWeight: 'bold',
  },
  pageBtnActive: {
    backgroundColor: '#007bff', color: 'white', borderColor: '#007bff',
  },
  pageInfo: {
    textAlign: 'center', marginTop: '10px', color: '#666', fontSize: '13px',
  },
  info: { textAlign: 'center', color: '#666', margin: '20px' },
  error: { textAlign: 'center', color: '#dc3545', margin: '20px' },
};

export default FeeTable;