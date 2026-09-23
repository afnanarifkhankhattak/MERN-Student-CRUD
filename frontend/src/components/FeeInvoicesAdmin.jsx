// frontend/src/components/FeeInvoicesAdmin.jsx

import { useState } from 'react';
import FeeInvoiceTable from './FeeInvoiceTable';
import GenerateInvoicesModal from './GenerateInvoicesModal';
import FeeInvoiceDetail from './FeeInvoiceDetail';
import { FEE_INVOICES_URL as API_URL, apiFetch } from '../api';

function FeeInvoicesAdmin({ showToast, onRecordPayment }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);

  const bump = () => setRefreshTrigger((p) => p + 1);

  const handleGenerated = () => {
    bump();
  };

  const handleDelete = async (inv) => {
    if (
      !window.confirm(
        `Delete invoice ${inv.invoiceNo}?\n\nThis cannot be undone.`
      )
    )
      return;
    try {
      const res = await apiFetch(`${API_URL}/${inv._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      bump();
      showToast('success', `Invoice deleted ✅`);
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  const handlePaymentClickFromDetail = (invoice) => {
    setViewingInvoiceId(null);
    if (onRecordPayment) onRecordPayment(invoice);
  };

  return (
    <>
      <FeeInvoiceTable
        refreshTrigger={refreshTrigger}
        onGenerateClick={() => setShowGenerate(true)}
        onViewInvoice={(inv) => setViewingInvoiceId(inv._id)}
        onDelete={handleDelete}
      />

      {showGenerate && (
        <GenerateInvoicesModal
          onClose={() => setShowGenerate(false)}
          showToast={showToast}
          onGenerated={handleGenerated}
        />
      )}

      {viewingInvoiceId && (
        <FeeInvoiceDetail
          invoiceId={viewingInvoiceId}
          onClose={() => setViewingInvoiceId(null)}
          onRecordPayment={handlePaymentClickFromDetail}
        />
      )}
    </>
  );
}

export default FeeInvoicesAdmin;