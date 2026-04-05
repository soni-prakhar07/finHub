const { asyncHandler } = require("../middleware/asyncHandler");
const recordService = require("../services/recordService");

const list = asyncHandler(async (req, res) => {
  const result = await recordService.getRecords(req.query);
  res.status(200).json(result);
});

const create = asyncHandler(async (req, res) => {
  const record = await recordService.createRecord(req.body);
  res.status(201).json({ message: "Record created", record });
});

const update = asyncHandler(async (req, res) => {
  const record = await recordService.updateRecord(req.params.id, req.body);
  res.status(200).json({ message: "Record updated", record });
});

const remove = asyncHandler(async (req, res) => {
  await recordService.deleteRecord(req.params.id);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
