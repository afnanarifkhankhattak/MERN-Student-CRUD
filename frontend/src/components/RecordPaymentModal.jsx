// frontend/src/components/RecordPaymentModal.jsx

import { useState, useEffect } from 'react';
import {
  FEE_PAYMENTS_URL,
  FEE_INVOICES_URL,
  apiFetch,
} from '../api';

const PAYMENT_METHODS = [
  { value: 'cash',           label: '💵 Cash' },
  { value: 'bank-transfer',  label: '🏦 Bank Transfer' },
  { value: 'cheque',         label: '📝 Cheque' },
  { value: 'card',           label: '💳 Card' },
  { value: 'online',         label: '🌐 Online' },
  { value: 'other',          label: '📎 Other' },
];

function RecordPaymentModal({
  invoice,
  onClose,
  showToast,
  onPaymentRecorded,
}) {
  // If we only have an invoice ID, fetch the full invoice
  const [fullInvoice, setFullInvoice] = useState(invoice?.totalAmount ? invoice : null);
  const [loadingInvoice, setLoadingInvoice] = useState(!fullInvoice);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    method: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNo: '',
    bankName: '',
    remarks: '',
  });

  const [saving, setSaving] = useState(false);

  // Fetch full invoice if needed
  useEffect(() => {
    if (fullInvoice) return;
    if (!invoice?._id) return;
    (async () => {
      try {
        const res = await apiFetch(`${FEE_INVOICES_URL}/${invoice._id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load invoice');
        setFullInvoice(data.data.invoice);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingInvoice(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?._id]);

  // Auto-fill amount with the remaining balance
  useEffect(() => {
    if (fullInvoice) {
      const balance = Math.max(0, fullInvoice.totalAmount - fullInvoice.paidAmount);
      setFormData((p) => ({ ...p, amount: balance > 0 ? balance : '' }));
    }
  }, [fullInvoice]);

  const balance = fullInvoice
    ? Math.max(0, fullInvoice.totalAmount - fullInvoice.paidAmount)
    : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = Number(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (amt > balance + 0.001) {
      setError(`Amount exceeds balance. Balance is Rs ${balance.toLocaleString()}.`);
      return;
    }
    if (!formData.paymentDate) {
      setError('Payment date is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(FEE_PAYMENTS_URL, {
        method: 'POST',
        body: JSON.stringify({
          invoice: fullInvoice._id,
          amount: amt,
          method: formData.method,
          paymentDate: formData.paymentDate,
          referenceNo: formData.referenceNo,
          bankName: formData.bankName,
          remarks: formData.remarks,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record payment');

      showToast(
        'success',
        `Payment recorded — Receipt ${data.data.payment.receiptNo} ✅`
      );

      if (onPaymentRecorded) {
        onPaymentRecorded(data.data.payment, data.data.invoice);
      }
    } catch (e) {
      setError(e.message);
      showToast('error', `Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Quick amount buttons
  const setQuickAmount = (val) => {
    setFormData((p) => ({ ...p, amount: val }));
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>💰 Record Payment</h2>
            <p style={styles.subtitle}>
              {fullInvoice
                ? `${fullInvoice.invoiceNo} · ${fullInvoice.periodLabel || fullInvoice.period}`
                : 'Loading invoice...'}
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {loadingInvoice ? (
            <p style={styles.info}>Loading invoice...</p>
          ) : error && !fullInvoice ? (
            <p style={styles.error}>{error}</p>
          ) : (
            <>
              {/* Invoice summary card */}
              {fullInvoice && (
                <div style={styles.summaryCard}>
                  <div style={styles.summaryStudent}>
                    <strong>{fullInvoice.student?.name}</strong>
                    <div style={styles.summaryMeta}>
                      {fullInvoice.student?.regNo && `Reg: ${fullInvoice.student.regNo}`}
                      {fullInvoice.enrollment?.rollNo && ` · Roll: ${fullInvoice.enrollment.rollNo}`}
                    </div>
                    <div style={styles.summaryMeta}>
                      {fullInvoice.class?.name} · Due: {fullInvoice.dueDate}
                    </div>
                  </div>
                  <div style={styles.summaryAmounts}>
                    <div style={styles.summaryAmountRow}>
                      <span style={styles.summaryAmountLabel}>Total</span>
                      <span style={styles.summaryAmountValue}>
                        Rs {Number(fullInvoice.totalAmount).toLocaleString()}
                      </span>
                    </div>
                    <div style={styles.summaryAmountRow}>
                      <span style={styles.summaryAmountLabel}>Paid</span>
                      <span style={{ ...styles.summaryAmountValue, color: '#10b981' }}>
                        Rs {Number(fullInvoice.paidAmount).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ ...styles.summaryAmountRow, borderTop: '1px solid #e3e8f0', paddingTop: '6px', marginTop: '4px' }}>
                      <span style={styles.summaryAmountLabel}>Balance</span>
                      <span style={{ ...styles.summaryAmountValue, color: '#dc3545' }}>
                        Rs {balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {error && <div style={styles.inlineError}>{error}</div>}

              <form onSubmit={handleSubmit} style={styles.form}>
                {/* Amount + quick buttons */}
                <div style={styles.field}>
                  <label style={styles.label}>Amount (Rs) *</label>
                  <input
                    type="number"
                    name="amount"
                    min="1"
                    max={balance}
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    style={styles.input}
                    autoFocus
                  />
                  <div style={styles.quickRow}>
                    <button
                      type="button"
                      onClick={() => setQuickAmount(balance)}
                      style={styles.quickBtn}
                    >
                      Full (Rs {balance.toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickAmount(Math.round(balance / 2))}
                      style={styles.quickBtn}
                    >
                      Half
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickAmount(1000)}
                      style={styles.quickBtn}
                    >
                      Rs 1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickAmount(5000)}
                      style={styles.quickBtn}
                    >
                      Rs 5,000
                    </button>
                  </div>
                </div>

                {/* Method + date */}
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Payment Method *</label>
                    <select
                      name="method"
                      value={formData.method}
                      onChange={handleChange}
                      style={{ ...styles.input, ...styles.select }}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Payment Date *</label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* Reference (for non-cash) */}
                {['bank-transfer', 'cheque', 'card', 'online'].includes(formData.method) && (
                  <div style={styles.row}>
                    <div style={styles.field}>
                      <label style={styles.label}>Reference No / Transaction ID</label>
                      <input
                        type="text"
                        name="referenceNo"
                        value={formData.referenceNo}
                        onChange={handleChange}
                        placeholder={
                          formData.method === 'cheque' ? 'e.g. cheque #012345' : 'e.g. TXN-ABC-123'
                        }
                        style={styles.input}
                      />
                    </div>
                    {['bank-transfer', 'cheque'].includes(formData.method) && (
                      <div style={styles.field}>
                        <label style={styles.label}>Bank Name</label>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          placeholder="e.g. HBL, UBL"
                          style={styles.input}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Remarks */}
                <div style={styles.field}>
                  <label style={styles.label}>Remarks (optional)</label>
                  <input
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="e.g. 1st installment"
                    style={styles.input}
                  />
                </div>

                {/* Footer actions */}
                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || balance <= 0}
                    style={{
                      ...styles.saveBtn,
                      opacity: saving || balance <= 0 ? 0.6 : 1,
                      cursor: saving || balance <= 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {saving ? 'Saving...' : '💾 Record Payment'}
                  </button>
                </div>
              </form>
            </>
          )}
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
    zIndex: 2100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '640px',
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

  info: { textAlign: 'center', color: '#6b7280', padding: '30px' },
  error: { textAlign: 'center', color: '#dc3545', padding: '30px' },
  inlineError: {
    backgroundColor: '#fde8e8',
    color: '#991b1b',
    border: '1px solid #f5c2c2',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px',
  },

  summaryCard: {
    display: 'flex',
    gap: '16px',
    padding: '14px',
    backgroundColor: '#eef3fb',
    borderRadius: '10px',
    marginBottom: '18px',
    flexWrap: 'wrap',
  },
  summaryStudent: { flex: 1, minWidth: '180px' },
  summaryMeta: { fontSize: '12px', color: '#4b5563', marginTop: '3px' },
  summaryAmounts: {
    minWidth: '180px',
    textAlign: 'right',
  },
  summaryAmountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '13px',
    padding: '2px 0',
  },
  summaryAmountLabel: { color: '#6b7280' },
  summaryAmountValue: { fontWeight: 'bold', color: '#1e2a4a' },

  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  row: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  field: { flex: '1 1 200px', display: 'flex', flexDirection: 'column' },
  label: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  select: { cursor: 'pointer' },

  quickRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
    flexWrap: 'wrap',
  },
  quickBtn: {
    padding: '5px 10px',
    backgroundColor: '#fff',
    border: '1px solid #4a72c4',
    color: '#4a72c4',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
    paddingTop: '14px',
    borderTop: '1px solid #eef1f6',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  saveBtn: {
    padding: '10px 24px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    fontFamily: 'inherit',
  },
};

export default RecordPaymentModal;