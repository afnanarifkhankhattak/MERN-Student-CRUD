// frontend/src/components/PaymentReceipt.jsx

import { useEffect } from 'react';

function PaymentReceipt({ payment, invoice, onClose }) {
  // Auto-focus the print button for quick printing
  useEffect(() => {
    // Optional: could autofocus but let's not force it
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const balanceAfter = invoice
    ? Math.max(0, invoice.totalAmount - invoice.paidAmount)
    : 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        className="payment-receipt-printable"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Payment Receipt</h2>
            <p style={styles.subtitle}>
              Receipt No: <strong>{payment.receiptNo}</strong>
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {/* School header */}
          <div style={styles.schoolHeader}>
            <div style={styles.schoolName}>🎓 SchoolApp</div>
            <div style={styles.schoolSub}>
              Official Payment Receipt
            </div>
          </div>

          {/* Meta grid */}
          <div style={styles.metaGrid}>
            <div>
              <div style={styles.metaLabel}>Receipt Number</div>
              <div style={styles.metaValue}>{payment.receiptNo}</div>
            </div>
            <div>
              <div style={styles.metaLabel}>Payment Date</div>
              <div style={styles.metaValue}>{payment.paymentDate}</div>
            </div>
            <div>
              <div style={styles.metaLabel}>Invoice Number</div>
              <div style={styles.metaValue}>{invoice?.invoiceNo || '—'}</div>
            </div>
            <div>
              <div style={styles.metaLabel}>Period</div>
              <div style={styles.metaValue}>
                {invoice?.periodLabel || invoice?.period || '—'}
              </div>
            </div>
          </div>

          {/* Student */}
          <div style={styles.studentSection}>
            <div style={styles.sectionLabel}>Received From</div>
            <div style={styles.studentName}>{invoice?.student?.name || '—'}</div>
            <div style={styles.studentMeta}>
              {invoice?.student?.regNo && <>Reg No: {invoice.student.regNo}</>}
              {invoice?.enrollment?.rollNo && (
                <> · Roll: {invoice.enrollment.rollNo}</>
              )}
            </div>
            <div style={styles.studentMeta}>
              {invoice?.class?.name}
              {invoice?.academicYear?.name && ` · ${invoice.academicYear.name}`}
            </div>
          </div>

          {/* Amount highlight */}
          <div style={styles.amountBox}>
            <div style={styles.amountLabel}>Amount Received</div>
            <div style={styles.amountValue}>
              Rs {Number(payment.amount).toLocaleString()}
            </div>
            <div style={styles.amountWords}>
              (via {payment.method})
            </div>
          </div>

          {/* Payment details table */}
          <table style={styles.table}>
            <tbody>
              <tr style={styles.tableRow}>
                <td style={styles.tableLabel}>Method</td>
                <td style={styles.tableValue}>
                  <span style={styles.methodPill}>{payment.method}</span>
                </td>
              </tr>
              {payment.referenceNo && (
                <tr style={styles.tableRow}>
                  <td style={styles.tableLabel}>Reference No</td>
                  <td style={styles.tableValue}>{payment.referenceNo}</td>
                </tr>
              )}
              {payment.bankName && (
                <tr style={styles.tableRow}>
                  <td style={styles.tableLabel}>Bank</td>
                  <td style={styles.tableValue}>{payment.bankName}</td>
                </tr>
              )}
              {payment.remarks && (
                <tr style={styles.tableRow}>
                  <td style={styles.tableLabel}>Remarks</td>
                  <td style={styles.tableValue}>{payment.remarks}</td>
                </tr>
              )}
              <tr style={styles.tableRow}>
                <td style={styles.tableLabel}>Received By</td>
                <td style={styles.tableValue}>
                  {payment.receivedBy?.username || '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Invoice summary after payment */}
          {invoice && (
            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Total Billed</span>
                <span style={styles.summaryValue}>
                  Rs {Number(invoice.totalAmount).toLocaleString()}
                </span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Total Paid</span>
                <span style={{ ...styles.summaryValue, color: '#10b981' }}>
                  Rs {Number(invoice.paidAmount).toLocaleString()}
                </span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Balance</span>
                <span
                  style={{
                    ...styles.summaryValue,
                    color: balanceAfter > 0 ? '#dc3545' : '#10b981',
                  }}
                >
                  Rs {balanceAfter.toLocaleString()}
                </span>
              </div>
              <div style={styles.summaryStatusRow}>
                <span style={styles.summaryLabel}>Status</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    ...(invoice.status === 'paid'
                      ? { backgroundColor: '#d4edda', color: '#155724' }
                      : invoice.status === 'partial'
                      ? { backgroundColor: '#fef3c7', color: '#92400e' }
                      : { backgroundColor: '#fee2e2', color: '#991b1b' }),
                  }}
                >
                  {invoice.status}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={styles.receiptFooter}>
            <div style={styles.signatureLine}>
              <div style={styles.signatureLabel}>Authorized Signature</div>
              <div style={styles.signatureRule} />
            </div>
            <div style={styles.thankYou}>
              Thank you for your payment. Please keep this receipt for your records.
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.printBtn} onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
          <button style={styles.closePrimary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    zIndex: 2200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #e3e8f0',
  },
  title: { margin: 0, fontSize: '20px', color: '#1e2a4a' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#6b7280' },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  body: { padding: '20px 24px', overflowY: 'auto', flex: 1 },

  schoolHeader: {
    textAlign: 'center',
    paddingBottom: '16px',
    borderBottom: '2px solid #1e2a4a',
    marginBottom: '16px',
  },
  schoolName: { fontSize: '20px', fontWeight: 'bold', color: '#1e2a4a' },
  schoolSub: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '2px',
  },

  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px 20px',
    marginBottom: '16px',
  },
  metaLabel: {
    fontSize: '10px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  metaValue: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    marginTop: '2px',
    fontFamily: 'monospace',
  },

  studentSection: {
    padding: '12px 14px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  sectionLabel: {
    fontSize: '10px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '4px',
  },
  studentName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1e2a4a',
  },
  studentMeta: {
    fontSize: '12px',
    color: '#4b5563',
    marginTop: '2px',
  },

  amountBox: {
    textAlign: 'center',
    padding: '20px 16px',
    backgroundColor: '#eef3fb',
    borderRadius: '10px',
    marginBottom: '16px',
    border: '2px dashed #4a72c4',
  },
  amountLabel: {
    fontSize: '11px',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  amountValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    lineHeight: 1.2,
    marginTop: '4px',
  },
  amountWords: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    fontStyle: 'italic',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '16px',
  },
  tableRow: { borderBottom: '1px solid #eef1f6' },
  tableLabel: {
    padding: '8px 0',
    fontSize: '12px',
    color: '#6b7280',
    width: '40%',
  },
  tableValue: {
    padding: '8px 0',
    fontSize: '13px',
    color: '#1e2a4a',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  methodPill: {
    backgroundColor: '#f1f3f5',
    color: '#1e2a4a',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  summaryBox: {
    backgroundColor: '#f8fafc',
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '3px 0',
  },
  summaryStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    padding: '8px 0 0',
    marginTop: '4px',
    borderTop: '1px solid #e3e8f0',
  },
  summaryLabel: { color: '#6b7280' },
  summaryValue: { fontWeight: 'bold', color: '#1e2a4a' },
  statusBadge: {
    padding: '3px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  receiptFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: '20px',
    marginTop: '20px',
    borderTop: '1px dashed #ccc',
    gap: '20px',
    flexWrap: 'wrap',
  },
  signatureLine: { minWidth: '160px' },
  signatureLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '20px',
  },
  signatureRule: {
    borderBottom: '1px solid #1e2a4a',
    height: '1px',
  },
  thankYou: {
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
    maxWidth: '220px',
    textAlign: 'right',
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    borderTop: '1px solid #e3e8f0',
    backgroundColor: '#fafbfd',
  },
  printBtn: {
    padding: '10px 22px',
    backgroundColor: '#6f42c1',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  closePrimary: {
    padding: '10px 22px',
    backgroundColor: '#4a72c4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default PaymentReceipt;