// frontend/src/components/ExpensesAdmin.jsx

import { useState } from 'react';
import ExpenseForm from './ExpenseForm';
import ExpenseTable from './ExpenseTable';
import { EXPENSES_URL as API_URL, apiFetch } from '../api';

function ExpensesAdmin({ showToast }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingExpense, setEditingExpense] = useState(null);

  const bump = () => setRefreshTrigger((p) => p + 1);

  const handleExpenseAdded = () => {
    bump();
    showToast('success', 'Expense recorded ✅');
  };

  const handleEdit = (exp) => {
    setEditingExpense(exp);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateComplete = () => {
    setEditingExpense(null);
    bump();
    showToast('success', 'Expense updated ✅');
  };

  const handleCancelEdit = () => setEditingExpense(null);

  const handleDelete = async (exp) => {
    if (
      !window.confirm(
        `Delete expense "${exp.title}" (Rs ${Number(exp.amount).toLocaleString()})?`
      )
    )
      return;
    try {
      const res = await apiFetch(`${API_URL}/${exp._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      bump();
      showToast('success', 'Expense deleted ✅');
    } catch (e) {
      showToast('error', `Error: ${e.message}`);
    }
  };

  return (
    <>
      <ExpenseForm
        onExpenseAdded={handleExpenseAdded}
        editingExpense={editingExpense}
        onUpdateComplete={handleUpdateComplete}
        onCancelEdit={handleCancelEdit}
      />
      <ExpenseTable
        refreshTrigger={refreshTrigger}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default ExpensesAdmin;