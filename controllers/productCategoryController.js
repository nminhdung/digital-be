const ProductCategory = require("../models/productCategory");
const asyncHandler = require("express-async-handler");

const createCategory = asyncHandler(async (req, res) => {
  const response = await ProductCategory.create(req.body);
  return res.json({
    success: response ? true : false,
    createdCategory: response ? response : "Can't create new product-category",
  });
});
const getAllCategories = asyncHandler(async (req, res) => {
  const response = await ProductCategory.find();
  return res.json({
    success: response ? true : false,
    productCategories: response ? response : "Can not get all categories",
  });
});
const updateCategory = asyncHandler(async (req, res) => {
  const { pcid } = req.params;
  const response = await ProductCategory.findByIdAndUpdate(pcid, req.body, {
    new: true,
  });

  return res.json({
    success: response ? true : false,
    updatedCategory: response ? response : "Can not update category",
  });
});
const deleteCategory = asyncHandler(async (req, res) => {
  const { pcid } = req.params;
  const response = await ProductCategory.findByIdAndDelete(pcid);

  return res.json({
    success: response ? true : false,
    deletedCategory: response ? response : "Can not delete category",
  });
});
module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
