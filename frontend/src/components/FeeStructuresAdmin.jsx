 // frontend/src/components/FeeStructureTable.jsx

import { useEffect, useState } from 'react';
import {
  FEE_STRUCTURES_URL as API_URL,
  CLASSES_URL,
  ACADEMIC_YEARS_URL,
  apiFetch,
} from '../api';

function FeeStructureTable({ refreshTrigger, onEdit, onDelete }) {
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    class: '',
    academicYear: '',
    isActive: '',
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

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);
      const q = params.toString();
      const url = q ? `${API_URL}?${q}` : API_URL;

      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch structures');
      setStructures(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filters.class, filters.academicYear, filters.isActive]);

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

      <select
        value={filters.isActive}
        onChange={(e) => setFilters((f) => ({ ...f, isActive: e.target.value }))}
        style={styles.filterSelect}
      >
        <option value="">All Statuses</option>
        <option value="true">Active Only</option>
        <option value="false">Inactive Only</option>
      </select>

      {(filters.class || filters.academicYear || filters.isActive !== '') && (
        <button
          type="button"
          onClick={() => setFilters({ class: '', academicYear: '', isActive: '' })}
          style={styles.clearBtn}
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>All Fee Structures</h2>

      {renderFilters()}

      {loading ? (
        <p style={styles.info}>Loading structures...</p>
      ) : error ? (
        <p style={styles.error}>Error: {error}</p>
      ) : structures.length === 0 ? (
        <p style={styles.info}>
          No fee structures found. Create one above! 👆
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Year</th>
                <th style={styles.th}>Heads</th>
                <