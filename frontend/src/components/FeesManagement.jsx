// frontend/src/components/FeesManagement.jsx

import { useState } from 'react';
import FeeStructuresAdmin from './FeeStructuresAdmin';
import FeeInvoicesAdmin from './FeeInvoicesAdmin';
import FeePaymentsAdmin from './FeePaymentsAdmin';
import RecordPaymentModal from './RecordPaymentModal';

const TABS = [
  { id: 'structures', label: '📋 Structures', sub: 'Define fees' },
  { id: 'invoices',   label: '📄 Invoices',   sub: 'Generate & view' },
  { id: 'payments',   label: '💰 Payments',   sub: 'Receipts & records' },
];

function FeesManagement({ showToast }) {
  const [activeTab, setActiveTab] = useState('structures');

  // Global state for "Record Payment" modal — can be triggered
  // from the invoices tab (via invoice detail) or the payments tab.
  const [recordPaymentFor, setRecordPaymentFor] = useState(null);

  // Refresher bumped when a payment is recorded from anywhere
  const [paymentsRefresh, setPaymentsRefresh] = useState(0);

  const handleRecordPayment = (invoice) => {
    setRecordPaymentFor(invoice);
  };

  const handlePaymentRecorded = (payment, invoice) => {
    setRecordPaymentFor(null);
    setPaymentsRefresh((p) => p + 1);
    showToast('success', `Payment recorded — Receipt ${payment.receiptNo} ✅`);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerWrap}>
        <h2 style={styles.heading}>💰 Fee Management</h2>
        <p style={styles.subtitle}>
          Define fee structures, generate invoices, and record payments.
        </p>
      </div>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              ...styles.tab,
              ...(activeTab === t.id ? styles.tabActive : {}),
            }}
          >
            <span style={styles.tabLabel}>{t.label}</span>
            <span
              style={{
                ...styles.tabSub,
                color: activeTab === t.id ? '#4a72c4' : '#9ca3af',
              }}
            >
              {t.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'structures' && (
          <FeeStructuresAdmin showToast={showToast} />
        )}

        {activeTab === 'invoices' && (
          <FeeInvoicesAdmin
            showToast={showToast}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {activeTab === 'payments' && (
          <FeePaymentsAdmin
            showToast={showToast}
            refreshTrigger={paymentsRefresh}
          />
        )}
      </div>

      {/* Global Record Payment modal (used by invoices tab) */}
      {recordPaymentFor && (
        <RecordPaymentModal
          invoice={recordPaymentFor}
          showToast={showToast}
          onClose={() => setRecordPaymentFor(null)}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1600px',
    margin: '20px auto',
    fontFamily: 'Arial, sans-serif',
  },
  headerWrap: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  heading: {
    margin: 0,
    fontSize: '24px',
    color: '#1e2a4a',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#6b7280',
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    padding: '6px',
    backgroundColor: '#eef3fb',
    borderRadius: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tab: {
    flex: '1 1 180px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 6px rgba(30, 42, 74, 0.08)',
  },
  tabLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1e2a4a',
  },
  tabSub: {
    fontSize: '11px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  content: {
    minHeight: '400px',
  },
};

export default FeesManagement;