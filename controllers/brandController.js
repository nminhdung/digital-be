const Brand = require("../models/brand");
const asyncHandler = require("express-async-handler");

const createBrand = asyncHandler(async (req, res) => {
  const response = await Brand.create(req.body);
  return res.json({
    success: response ? true : false,
    createdBrand: response ? response : "Can't create new bbrand",
  });
});
const getAllBrands = asyncHandler(async (req, res) => {
  const response = await Brand.find();
  return res.json({
    success: response ? true : false,
    listBrand: response ? response : "Can not get all brands",
  });
});
const updateBrand = asyncHandler(async (req, res) => {
  const { brid } = req.params;
  const response = await Brand.findByIdAndUpdate(brid, req.body, {
    new: true,
  });

  return res.json({
    success: response ? true : false,
    updatedBrand: response ? response : "Can not update  Brand",
  });
});
const deleteBrand = asyncHandler(async (req, res) => {
  const { brid } = req.params;
  const response = await Brand.findByIdAndDelete(brid);

  return res.json({
    success: response ? true : false,
    deletedBrand: response ? response : "Can not delete  brand",
  });
});
module.exports = {
  createBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
};
