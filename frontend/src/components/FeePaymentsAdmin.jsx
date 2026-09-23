// frontend/src/components/FeePaymentsAdmin.jsx

import { useState } from 'react';
import FeePaymentsTable from './FeePaymentsTable';
import PaymentReceipt from './PaymentReceipt';
import RecordPaymentModal from './RecordPaymentModal';
import {
  FEE_PAYMENTS_URL as API_URL,
  FEE_INVOICES_URL,
  apiFetch,
} from '../api';

function FeePaymentsAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [receiptData, setReceiptData] = useState(null);
  const [pendingRecordFor, setPendingRecordFor] = useState(null);

  const bump = () => setRefreshTrigger((p) => p + 1);

  // Open receipt modal for an existing payment
  const handleViewReceipt = async (payment) => {
    try {
      // Fetch the invoice for context
      const res = await apiFetch(
        `${FEE_INVOICES_URL}/${payment.invoice?._id || payment.invoice}`
      );
      const data = await res.json();
      const invoice = res.ok ? data.data?.invoice : null;
      setReceiptData({ payment, invoice });
    } catch (e) {
      // Fallback: open receipt without the invoice
      setReceiptData({ payment, invoice: null });
    }
  };

  // Delete a payment
  const handleDelete = async (payment) => {
    if (
      !window.confirm(
        `Delete payment ${payment.receiptNo}?\n\nThe invoice's paid amount will be reduced by Rs ${payment.amount}.`
      )
    )
      return;
    try {
      const res = await apiFetch(`${API_URL}/${payment._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      bump();
      showToast('success', `Payment deleted. Invoice updated.`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  const handlePaymentRecordedFromTable = (payment, invoice) => {
    setPendingRecordFor(null);
    bump();
    setReceiptData({ payment, invoice });
  };

  return (
    <>
      <FeePaymentsTable
        refreshTrigger={refreshTrigger}
        onViewReceipt={handleViewReceipt}
        onDelete={handleDelete}
      />

      {receiptData && (
        <PaymentReceipt
          payment={receiptData.payment}
          invoice={receiptData.invoice}
          onClose={() => setReceiptData(null)}
        />
      )}

      {pendingRecordFor && (
        <RecordPaymentModal
          invoice={pendingRecordFor}
          showToast={showToast}
          onClose={() => setPendingRecordFor(null)}
          onPaymentRecorded={handlePaymentRecordedFromTable}
        />
      )}
    </>
  );
}

export default FeePaymentsAdmin;