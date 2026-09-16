// frontend/src/components/UploadCSV.jsx

import { useRef, useState } from 'react';
import Papa from 'papaparse';

const API_URL = 'https://mern-student-crud-tlt6.onrender.com/students';

// These are the fields we expect each CSV row to provide.
// "Picture" is optional.
const REQUIRED_FIELDS = [
  'username',
  'regNo',
  'name',
  'phone',
  'age',
  'email',
  'department',
  'semester',
];

function UploadCSV({ onUploadComplete }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  // ── Open the hidden file picker ──────────────────
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // ── When a file is selected ─────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset the input so picking the same file again still triggers onChange
    e.target.value = '';

    setUploading(true);
    setStatus({ type: '', text: '' });

    Papa.parse(file, {
      header: true,          // treat first row as column names
      skipEmptyLines: true,  // ignore blank lines
      complete: (result) => {
        handleParsedRows(result.data);
      },
      error: (err) => {
        setUploading(false);
        setStatus({ type: 'error', text: `Parse error: ${err.message}` });
      },
    });
  };

  // ── Convert parsed rows → student objects, then send ──
  const handleParsedRows = async (rows) => {
    // 1. Normalize header names: trim + camelCase-ish
    //    e.g. "Reg No"  → "regNo"
    //         "Username" → "username"
    const normalized = rows.map((row) => {
      const out = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
        const value = String(row[key] ?? '').trim();

        // Map common header variants to our schema field names
        if (cleanKey === 'username') out.username = value;
        else if (cleanKey === 'regno' || cleanKey === 'registrationnumber')
          out.regNo = value;
        else if (cleanKey === 'name' || cleanKey === 'studentname')
          out.name = value;
        else if (cleanKey === 'picture' || cleanKey === 'profilepicture')
          out.picture = value;
        else if (cleanKey === 'phone' || cleanKey === 'phonenumber')
          out.phone = value;
        else if (cleanKey === 'age') out.age = value === '' ? '' : Number(value);
        else if (cleanKey === 'email') out.email = value;
        else if (cleanKey === 'department') out.department = value;
        else if (cleanKey === 'semester')
          out.semester = value === '' ? '' : Number(value);
      });
      return out;
    });

    // 2. Basic client-side validation — filter out rows missing required fields
    const validRows = [];
    const clientErrors = [];

    normalized.forEach((row, idx) => {
      const missing = REQUIRED_FIELDS.filter(
        (f) => row[f] === undefined || row[f] === '' || row[f] === null
      );
      if (missing.length > 0) {
        clientErrors.push({
          row: idx + 2, // +2 because CSV row 1 is the header
          reason: `Missing fields: ${missing.join(', ')}`,
        });
      } else {
        // Provide an empty string for picture so the schema default kicks in
        if (!row.picture) row.picture = undefined;
        validRows.push(row);
      }
    });

    if (validRows.length === 0) {
      setUploading(false);
      setStatus({
        type: 'error',
        text: `No valid rows found. ${clientErrors.length} row(s) had errors.`,
      });
      return;
    }

    // 3. Send valid rows to the backend
    try {
      const response = await fetch(`${API_URL}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: validRows }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bulk upload failed');
      }

      // 4. Show a friendly summary
      const msg = `Imported ${data.insertedCount} student(s).` +
        (data.failedCount > 0 ? ` ${data.failedCount} failed.` : '') +
        (clientErrors.length > 0
          ? ` ${clientErrors.length} skipped (missing fields).`
          : '');

      setStatus({ type: 'success', text: msg });

      // 5. Tell the parent to refresh the table
      if (onUploadComplete) onUploadComplete(data.insertedCount);
    } catch (err) {
      setStatus({ type: 'error', text: `Upload error: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  // ── Render ──────────────────────────────────────
  return (
    <div style={styles.wrapper}>
      <input
        type="file"
        accept=".csv,text/csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploading}
        style={{
          ...styles.button,
          opacity: uploading ? 0.6 : 1,
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? '⏳ Uploading...' : '📁 Upload CSV'}
      </button>

      {status.text && (
        <span
          style={{
            ...styles.status,
            color: status.type === 'success' ? '#155724' : '#721c24',
            backgroundColor:
              status.type === 'success' ? '#d4edda' : '#f8d7da',
            border: `1px solid ${
              status.type === 'success' ? '#c3e6cb' : '#f5c6cb'
            }`,
          }}
        >
          {status.text}
        </span>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────
const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '15px',
    flexWrap: 'wrap',
    fontFamily: 'Arial, sans-serif',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#6f42c1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease, transform 0.15s ease',
  },
  status: {
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '13px',
  },
};

export default UploadCSV;