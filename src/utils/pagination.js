const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n) || n < 1) {
    return fallback;
  }
  return n;
}

function getPagination(query = {}) {
  const page = parsePositiveInt(query.page, DEFAULT_PAGE);
  let limit = parsePositiveInt(query.limit, DEFAULT_LIMIT);
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginationMeta({ total, page, limit }) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

module.exports = {
  getPagination,
  paginationMeta,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
