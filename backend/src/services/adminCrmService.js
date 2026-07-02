const mongoose = require("mongoose");
const Inquiry = require("../models/Inquiry");

const STATUSES = ["interested", "contacted", "confirmed", "dropped"];
const TRANSITIONS = {
  interested: ["contacted", "dropped"],
  contacted: ["confirmed", "dropped"],
  confirmed: ["dropped"],
  dropped: [],
};

function toClient(doc) {
  const item = doc.toObject ? doc.toObject() : { ...doc };
  const mongoId = item._id ? item._id.toString() : undefined;
  return {
    ...item,
    id: item.id || mongoId,
    created_at: item.created_at || item.createdAt,
    updated_at: item.updated_at || item.updatedAt,
    _id: undefined,
    __v: undefined,
  };
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatch({ search, status, eventDate, eventMonth, eventYear } = {}) {
  const match = {};
  if (status && status !== "all") match.status = status;
  const and = [];
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    and.push({ $or: [{ customerName: regex }, { customerPhone: regex }, { hallName: regex }] });
  }
  if (eventDate) {
    and.push({
      $or: [
        { $and: [{ eventStartDate: { $lte: eventDate } }, { eventEndDate: { $gte: eventDate } }] },
        { eventDate },
      ],
    });
  } else if (eventMonth) {
    const regex = new RegExp(`^${escapeRegex(eventMonth)}`);
    and.push({ $or: [{ eventStartDate: regex }, { eventEndDate: regex }, { eventDate: regex }] });
  } else if (eventYear) {
    const regex = new RegExp(`^${escapeRegex(eventYear)}`);
    and.push({ $or: [{ eventStartDate: regex }, { eventEndDate: regex }, { eventDate: regex }] });
  }
  if (and.length > 0) match.$and = and;
  return match;
}

function rowMatchesEventFilters(row, { eventDate, eventMonth, eventYear } = {}) {
  const start = row.eventStartDate || row.eventDate || "";
  const end = row.eventEndDate || row.eventDate || start;
  if (eventDate) return start <= eventDate && eventDate <= end;
  if (eventMonth) return [start, end, row.eventDate].some((value) => String(value || "").startsWith(eventMonth));
  if (eventYear) return [start, end, row.eventDate].some((value) => String(value || "").startsWith(eventYear));
  return true;
}

async function createInquiry(store, payload = {}) {
  const inquiry = {
    id: payload.id || `inq-${Date.now()}`,
    customerName: payload.customerName || payload.name,
    customerPhone: payload.customerPhone || payload.mobile,
    customerEmail: payload.customerEmail || payload.email || "",
    hallId: payload.hallId || payload.hall_id,
    hallName: payload.hallName,
    inquirySource: payload.inquirySource || "whatsapp",
    status: "interested",
    notes: payload.notes || payload.message || "",
    eventDate: payload.eventDate || payload.eventStartDate || payload.date,
    eventStartDate: payload.eventStartDate || payload.eventDate || payload.date,
    eventEndDate: payload.eventEndDate || payload.eventDate || payload.date,
    slot: payload.slot,
    expectedGuests: payload.expectedGuests || payload.guests,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!inquiry.customerName || !inquiry.customerPhone) {
    const error = new Error("Customer name and phone are required");
    error.status = 400;
    throw error;
  }

  if (mongoose.connection.readyState === 1) {
    const doc = await Inquiry.create(inquiry);
    return toClient(doc);
  }

  const fallbackInquiry = { ...inquiry, createdAt: inquiry.createdAt.toISOString(), updatedAt: inquiry.updatedAt.toISOString() };
  store.push("inquiries", fallbackInquiry);
  return fallbackInquiry;
}

async function getCrmStats(store) {
  if (mongoose.connection.readyState === 1) {
    const rows = await Inquiry.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    return STATUSES.reduce((acc, status) => {
      acc[status] = rows.find((row) => row._id === status)?.count || 0;
      return acc;
    }, { total: rows.reduce((sum, row) => sum + row.count, 0) });
  }

  const rows = store.get("inquiries") || [];
  return STATUSES.reduce((acc, status) => {
    acc[status] = rows.filter((row) => row.status === status).length;
    return acc;
  }, { total: rows.length });
}

async function listInquiries(store, query = {}) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20", 10), 1), 100);
  const sortBy = ["createdAt", "customerName", "hallName", "status"].includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortDir = query.sortDir === "asc" ? 1 : -1;
  const match = buildMatch(query);

  if (mongoose.connection.readyState === 1) {
    const [result] = await Inquiry.aggregate([
      { $match: match },
      {
        $facet: {
          items: [{ $sort: { [sortBy]: sortDir } }, { $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ]);
    return {
      items: (result.items || []).map(toClient),
      total: result.total?.[0]?.count || 0,
      page,
      limit,
    };
  }

  const rows = (store.get("inquiries") || []).filter((row) => {
    if (match.status && row.status !== match.status) return false;
    if (!rowMatchesEventFilters(row, query)) return false;
    if (!query.search) return true;
    const q = query.search.toLowerCase();
    return [row.customerName, row.customerPhone, row.hallName].some((value) => String(value || "").toLowerCase().includes(q));
  });
  return { items: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit };
}

async function updateInquiryStatus(store, id, status) {
  if (!STATUSES.includes(status)) {
    const error = new Error("Invalid inquiry status");
    error.status = 400;
    throw error;
  }

  if (mongoose.connection.readyState === 1) {
    const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { id }] } : { id };
    const existing = await Inquiry.findOne(query).lean();
    if (!existing) return null;
    if (!TRANSITIONS[existing.status]?.includes(status)) {
      const error = new Error(`Cannot move ${existing.status} inquiry to ${status}`);
      error.status = 400;
      throw error;
    }
    const doc = await Inquiry.findOneAndUpdate(query, { status }, { new: true, runValidators: true });
    return toClient(doc);
  }

  const rows = store.get("inquiries") || [];
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return null;
  if (!TRANSITIONS[rows[index].status]?.includes(status)) {
    const error = new Error(`Cannot move ${rows[index].status} inquiry to ${status}`);
    error.status = 400;
    throw error;
  }
  rows[index] = { ...rows[index], status, updatedAt: new Date().toISOString() };
  return rows[index];
}

async function deleteInquiry(store, id) {
  if (mongoose.connection.readyState === 1) {
    const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { id }] } : { id };
    const result = await Inquiry.deleteOne(query);
    return result.deletedCount > 0;
  }

  const rows = store.get("inquiries") || [];
  const nextRows = rows.filter((row) => row.id !== id);
  if (nextRows.length === rows.length) return false;

  store.set("inquiries", nextRows);
  return true;
}

async function exportInquiries(store, query = {}) {
  const { items } = await listInquiries(store, { ...query, page: 1, limit: 10000 });
  return items.map((row) => ({
    "Customer Name": row.customerName || "",
    "Phone Number": row.customerPhone || "",
    Email: row.customerEmail || "",
    "Hall Name": row.hallName || "",
    "Event Start Date": row.eventStartDate || row.eventDate || "",
    "Event End Date": row.eventEndDate || row.eventDate || "",
    Slot: row.slot || "",
    Status: row.status || "",
    "Created Date": row.created_at || row.createdAt || "",
  }));
}

async function getAnalytics(store) {
  if (mongoose.connection.readyState !== 1) {
    const stats = await getCrmStats(store);
    return { stats, conversionRate: 0, statusDistribution: [], monthlyInquiries: [], hallPerformance: [], inquiryTrend: [], customers: { unique: 0, repeat: 0, newThisMonth: 0 } };
  }

  const now = new Date();
  const start30 = new Date(now);
  start30.setDate(start30.getDate() - 29);
  start30.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [stats, monthlyInquiries, hallPerformance, inquiryTrend, customerRows] = await Promise.all([
    getCrmStats(store),
    Inquiry.aggregate([{ $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Inquiry.aggregate([{ $group: { _id: { hallId: "$hallId", hallName: "$hallName" }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }, { $project: { _id: 0, hallId: "$_id.hallId", hallName: "$_id.hallName", count: 1 } }]),
    Inquiry.aggregate([{ $match: { createdAt: { $gte: start30 } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, date: "$_id", count: 1 } }]),
    Inquiry.aggregate([{ $group: { _id: "$customerPhone", count: { $sum: 1 }, firstSeen: { $min: "$createdAt" } } }, { $group: { _id: null, unique: { $sum: 1 }, repeat: { $sum: { $cond: [{ $gt: ["$count", 1] }, 1, 0] } }, newThisMonth: { $sum: { $cond: [{ $gte: ["$firstSeen", monthStart] }, 1, 0] } } } }]),
  ]);

  return {
    stats,
    conversionRate: stats.total ? Math.round((stats.confirmed / stats.total) * 100) : 0,
    statusDistribution: STATUSES.map((status) => ({ status, count: stats[status] || 0 })),
    monthlyInquiries: Array.from({ length: 12 }, (_, index) => ({
      month: new Date(2000, index, 1).toLocaleString("en", { month: "short" }),
      inquiries: monthlyInquiries.find((row) => row._id === index + 1)?.count || 0,
    })),
    hallPerformance,
    inquiryTrend,
    customers: customerRows[0] || { unique: 0, repeat: 0, newThisMonth: 0 },
  };
}

module.exports = {
  createInquiry,
  getCrmStats,
  listInquiries,
  updateInquiryStatus,
  deleteInquiry,
  exportInquiries,
  getAnalytics,
};
