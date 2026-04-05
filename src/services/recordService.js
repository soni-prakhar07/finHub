const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");
const { getPagination, paginationMeta } = require("../utils/pagination");

const RECORD_TYPES = ["INCOME", "EXPENSE"];

function assertRecordType(value) {
  if (!RECORD_TYPES.includes(value)) {
    throw new AppError(`type must be one of: ${RECORD_TYPES.join(", ")}`, 400);
  }
}

function parseDate(value, label) {
  if (!value) {
    return null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return d;
}

function buildListWhere(query) {
  const where = {};

  if (query.type !== undefined && query.type !== "") {
    assertRecordType(query.type);
    where.type = query.type;
  }

  if (query.category !== undefined && query.category !== "") {
    where.category = query.category;
  }

  const dateFrom = parseDate(query.dateFrom, "dateFrom");
  const dateTo = parseDate(query.dateTo, "dateTo");

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) {
      where.date.gte = dateFrom;
    }
    if (dateTo) {
      where.date.lte = dateTo;
    }
  }

  return where;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
};

async function getRecords(query) {
  const where = buildListWhere(query);
  const { page, limit, skip } = getPagination(query);

  const [total, records] = await prisma.$transaction([
    prisma.record.count({ where }),
    prisma.record.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: { user: { select: userSelect } },
    }),
  ]);

  return {
    records,
    pagination: paginationMeta({ total, page, limit }),
  };
}

async function createRecord(body) {
  const { amount, type, category, date, notes, userId } = body;

  if (
    amount === undefined ||
    type === undefined ||
    !category ||
    !date ||
    !userId
  ) {
    throw new AppError(
      "amount, type, category, date, and userId are required",
      400
    );
  }

  if (typeof amount !== "number" || amount <= 0 || Number.isNaN(amount)) {
    throw new AppError("amount must be a positive number", 400);
  }

  assertRecordType(type);

  const recordDate = parseDate(date, "date");

  const owner = await prisma.user.findUnique({ where: { id: userId } });
  if (!owner) {
    throw new AppError("User not found", 404);
  }

  const record = await prisma.record.create({
    data: {
      amount,
      type,
      category,
      date: recordDate,
      notes: notes ?? null,
      userId,
    },
    include: { user: { select: userSelect } },
  });

  return record;
}

async function updateRecord(id, body) {
  const existing = await prisma.record.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Record not found", 404);
  }

  const data = {};

  if (body.amount !== undefined) {
    if (typeof body.amount !== "number" || body.amount <= 0 || Number.isNaN(body.amount)) {
      throw new AppError("amount must be a positive number", 400);
    }
    data.amount = body.amount;
  }

  if (body.type !== undefined) {
    assertRecordType(body.type);
    data.type = body.type;
  }

  if (body.category !== undefined) {
    data.category = body.category;
  }

  if (body.date !== undefined) {
    data.date = parseDate(body.date, "date");
  }

  if (body.notes !== undefined) {
    data.notes = body.notes;
  }

  if (body.userId !== undefined) {
    const owner = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!owner) {
      throw new AppError("User not found", 404);
    }
    data.userId = body.userId;
  }

  if (Object.keys(data).length === 0) {
    throw new AppError("No updatable fields provided", 400);
  }

  const record = await prisma.record.update({
    where: { id },
    data,
    include: { user: { select: userSelect } },
  });

  return record;
}

async function deleteRecord(id) {
  const existing = await prisma.record.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Record not found", 404);
  }

  await prisma.record.delete({ where: { id } });
}

module.exports = {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
};
