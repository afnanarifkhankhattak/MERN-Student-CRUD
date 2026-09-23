// backend/routes/feePayments.js

const express = require('express');
const router = express.Router();
const FeePayment = require('../models/FeePayment');
const FeeInvoice = require('../models/FeeInvoice');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ── Populate helper ────────────────────────────
const populate = (query) =>
  query
    .populate('student', 'name regNo admissionNo picture')
    .populate({
      path: 'invoice',
      select: 'invoiceNo period periodLabel totalAmount paidAmount status dueDate',
    })
    .populate('receivedBy', 'username role');

// ── Helper: generate receipt number ────────────
// Sequential per year, format: R-2025-0001
const generateReceiptNo = async () => {
  const year = new Date().getFullYear();
  const prefix = `R-${year}-`;
  const last = await FeePayment.findOne(
    { receiptNo: new RegExp(`^${prefix}`) },
    { receiptNo: 1 }
  ).sort({ receiptNo: -1 });

  let nextSeq = 1;
  if (last && last.receiptNo) {
    const num = parseInt(last.receiptNo.replace(prefix, ''), 10);
    if (!isNaN(num)) nextSeq = num + 1;
  }
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
};

// ── Helper: recompute invoice from its payments ─
const recomputeInvoice = async (invoiceId) => {
  const payments = await FeePayment.find({
    invoice: invoiceId,
    status: 'completed',
  });
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  const invoice = await FeeInvoice.findById(invoiceId);
  if (!invoice) return null;

  invoice.paidAmount = totalPaid;

  if (invoice.status !== 'waived') {
    if (totalPaid >= invoice.totalAmount) invoice.status = 'paid';
    else if (totalPaid > 0) invoice.status = 'partial';
    else invoice.status = 'unpaid';
  }

  await invoice.save();
  return invoice;
};

// ═══════════════════════════════════════════════
// SPECIAL ROUTES
// ═══════════════════════════════════════════════

// GET /fee-payments/today — today's collections
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const payments = await populate(
      FeePayment.find({ paymentDate: today, status: 'completed' }).sort({
        createdAt: -1,
      })
    );
    const total = payments.reduce((s, p) => s + p.amount, 0);
    res.status(200).json({
      success: true,
      date: today,
      count: payments.length,
      total,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════════
// STANDARD CRUD
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// CREATE — POST /fee-payments (any logged-in user)
// ─────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  let created = null;
  try {
    const { invoice: invoiceId, amount, method, paymentDate, referenceNo, bankName, remarks, status } = req.body;

    if (!invoiceId || !amount || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'invoice, amount, and paymentDate are required',
      });
    }

    // Load invoice
    const invoice = await FeeInvoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const amt = Number(amount);
    if (amt <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }

    const balance = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    if (amt > balance + 0.001) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds balance. Balance is Rs ${balance}.`,
      });
    }

    // Generate receipt no
    const receiptNo = await generateReceiptNo();
    const payStatus = status === 'pending' ? 'pending' : 'completed';

    // Create payment
    created = await FeePayment.create({
      invoice: invoiceId,
      student: invoice.student,
      amount: amt,
      method: method || 'cash',
      paymentDate,
      referenceNo: referenceNo || '',
      bankName: bankName || '',
      receiptNo,
      receivedBy: req.user?.id || null,
      remarks: remarks || '',
      status: payStatus,
    });

    // Recompute invoice (only completed payments count)
    await recomputeInvoice(invoiceId);

    const populated = await populate(FeePayment.findById(created._id));
    const updatedInvoice = await FeeInvoice.findById(invoiceId);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment: populated,
        invoice: updatedInvoice,
      },
    });
  } catch (error) {
    // Manual rollback if invoice update failed
    if (created) {
      try {
        await FeePayment.findByIdAndDelete(created._id);
      } catch {
        /* ignore */
      }
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ALL — GET /fee-payments
// Filters: ?invoice= &student= &method= &from= &to= &status=
// ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.invoice) filter.invoice = req.query.invoice;
    if (req.query.student) filter.student = req.query.student;
    if (req.query.method) filter.method = req.query.method;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.paymentDate = {};
      if (req.query.from) filter.paymentDate.$gte = req.query.from;
      if (req.query.to) filter.paymentDate.$lte = req.query.to;
    }

    const payments = await populate(
      FeePayment.find(filter).sort({ paymentDate: -1, createdAt: -1 })
    );

    const total = payments
      .filter((p) => p.status === 'completed')
      .reduce((s, p) => s + p.amount, 0);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// READ ONE — GET /fee-payments/:id
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await populate(FeePayment.findById(req.params.id));
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// UPDATE — PUT /fee-payments/:id (admin only)
// Used to mark a pending payment as completed or reversed
// ─────────────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const updated = await FeePayment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Recompute invoice in case status changed
    await recomputeInvoice(updated.invoice);

    const populated = await populate(FeePayment.findById(updated._id));
    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE — DELETE /fee-payments/:id (admin only)
// ─────────────────────────────────────────────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const payment = await FeePayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const invoiceId = payment.invoice;

    await FeePayment.findByIdAndDelete(req.params.id);

    // Recompute invoice after delete
    await recomputeInvoice(invoiceId);

    res.status(200).json({
      success: true,
      message: 'Payment deleted and invoice updated',
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;