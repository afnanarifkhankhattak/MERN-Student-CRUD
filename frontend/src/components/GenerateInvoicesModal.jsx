// frontend/src/components/GenerateInvoicesModal.jsx

import { useState, useEffect } from 'react';
import {
  FEE_INVOICES_URL,
  FEE_STRUCTURES_URL,
  CLASSES_URL,
  SECTIONS_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

function GenerateInvoicesModal({ onClose, showToast, onGenerated }) {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState({
    class: '',
    section: '',
    academicYear: '',
    period: '',
    periodLabel: '',
    dueDate: '',
    feeStructureId: '',
  });

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Load dropdowns
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
        if (yRes.ok) {
          setAcademicYears(yData.data || []);
          const active = (yData.data || []).find((y) => y.isActive);
          if (active) setFormData((p) => ({ ...p, academicYear: active._id }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!formData.class) {
      setSections([]);
      return;
    }
    (async () => {
      try {
        const res = await apiFetch(`${SECTIONS_URL}?class=${formData.class}`);
        const data = await res.json();
        if (res.ok) setSections(data.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [formData.class]);

  // Load fee structures when class/year changes
  useEffect(() => {
    if (!formData.class || !formData.academicYear) {
      setStructures([]);
      return;
    }
    (async () => {
      try {
        const res = await apiFetch(
          `${FEE_STRUCTURES_URL}?class=${formData.class}&academicYear=${formData.academicYear}`
        );
        const data = await res.json();
        if (res.ok) setStructures(data.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [formData.class, formData.academicYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => {
      const next = { ...p, [name]: value };
      if (name === 'class') next.section = '';
      // Auto-fill periodLabel from period
      if (name === 'period' && value && !p.periodLabel) {
        next.periodLabel = value;
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!formData.class || !formData.academicYear || !formData.period || !formData.dueDate || !formData.feeStructureId) {
      setError('Please fill in all required fields.');
      return;
    }

    setBusy(true);
    setError('');
    setResult(null);

    try {
      const res = await apiFetch(`${FEE_INVOICES_URL}/generate-bulk`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Generation failed');

      setResult(data);
      showToast('success', data.message || `Generated ${data.insertedCount} invoice(s)`);
      if (onGenerated) onGenerated();
    } catch (e) {
      setError(e.message);
      showToast('error', `Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>⚡ Generate Invoices</h2>
            <p style={styles.subtitle}>
              Create invoices for all enrolled students in one batch
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Class *</label>
              <select
                name="class"
                value={formData.class}
                onChange={handleChange}
                disabled={loadingOptions}
                style={styles.input}
              >
                <option value="">-- Select Class --</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Section (optional)</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                disabled={!formData.class}
                style={styles.input}
              >
                <option value="">-- All Sections --</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Academic Year *</label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                disabled={loadingOptions}
                style={styles.input}
              >
                <option value="">-- Select Year --</option>
                {academicYears.map((y) => (
                  <option key={y._id} value={y._id}>
                    {y.name} {y.isActive ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Fee Structure *</label>
              <select
                name="feeStructureId"
                value={formData.feeStructureId}
                onChange={handleChange}
                disabled={!formData.class || !formData.academicYear}
                style={styles.input}
              >
                <option value="">
                  {structures.length === 0
                    ? '-- No structures available --'
                    : '-- Select Structure --'}
                </option>
                {structures.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} (Rs {s.totalMonthly}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Period *</label>
              <input
                type="text"
                name="period"
                value={formData.period}
                onChange={handleChange}
                placeholder="e.g. 2025-01"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Period Label</label>
              <input
                type="text"
                name="periodLabel"
                value={formData.periodLabel}
                onChange={handleChange}
                placeholder="e.g. January 2025"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Due Date *</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          {/* Result summary */}
          {result && (
            <div style={styles.resultBox}>
              <div style={styles.resultTitle}>✅ Generation Complete</div>
              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Inserted</span>
                  <span style={{ ...styles.resultValue, color: '#10b981' }}>
                    {result.insertedCount}
                  </span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Skipped</span>
                  <span style={{ ...styles.resultValue, color: '#f59e0b' }}>
                    {result.skippedCount}
                  </span>
                </div>
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>Failed</span>
                  <span style={{ ...styles.resultValue, color: '#dc3545' }}>
                    {result.failedCount}
                  </span>
                </div>
              </div>
              {result.skipped && result.skipped.length > 0 && (
                <details style={styles.details}>
                  <summary style={styles.detailsSummary}>
                    See {result.skipped.length} skipped
                  </summary>
                  <div style={styles.detailsList}>
                    {result.skipped.slice(0, 20).map((s, i) => (
                      <div key={i} style={styles.detailsItem}>
                        {s.reason}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </button>
          <button
            style={{
              ...styles.primaryBtn,
              opacity: busy ? 0.6 : 1,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
            onClick={handleGenerate}
            disabled={busy}
          >
            {busy ? 'Generating...' : '⚡ Generate'}
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
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
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
  error: {
    backgroundColor: '#fde8e8',
    color: '#991b1b',
    border: '1px solid #f5c2c2',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  field: { display: 'flex', flexDirection: 'column' },
  label: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  input: {
    padding: '9px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  resultBox: {
    marginTop: '20px',
    padding: '14px',
    backgroundColor: '#f0f8ff',
    border: '1px solid #c8e0f9',
    borderRadius: '8px',
  },
  resultTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#1e2a4a',
    marginBottom: '10px',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  resultItem: { textAlign: 'center' },
  resultLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  resultValue: { fontSize: '22px', fontWeight: 'bold' },
  details: { marginTop: '12px', fontSize: '12px' },
  detailsSummary: {
    cursor: 'pointer',
    color: '#4a72c4',
    fontWeight: 'bold',
  },
  detailsList: {
    marginTop: '6px',
    padding: '8px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  detailsItem: { fontSize: '11px', color: '#6b7280', padding: '2px 0' },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    borderTop: '1px solid #e3e8f0',
    backgroundColor: '#fafbfd',
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
  primaryBtn: {
    padding: '10px 24px',
    backgroundColor: '#6f42c1',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default GenerateInvoicesModal;