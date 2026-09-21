// backend/routes/fees.js

const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────
// CREATE — Add a fee record (admin only)
// POST /fees
// ─────────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const newFee = await Fee.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Fee record created successfully',
      data: newFee,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// READ ALL
// GET /fees
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const fees = await Fee.find().sort({ createdAt: -1 });

    // Aggregate totals for the dashboard
    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);

    res.status(200).json({
      success: true,
      count: fees.length,
      totalAmount,
      totalPaid,
      totalBalance: Math.max(0, totalAmount - totalPaid),
      data: fees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// READ ONE
// GET /fees/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }
    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE (admin only)
// PUT /fees/:id
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Fee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Fee record updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE (admin only)
// DELETE /fees/:id
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Fee.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Fee record deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;