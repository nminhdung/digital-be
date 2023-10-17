const Product = require("../models/product");
const ProductCategory = require("../models/productCategory");
const Brand = require("../models/brand");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const data = require("../../data/data.json");
const dataCategory = require("../../data/cate-brand.js");
const dataBrand = require("../../data/brand.js");

const prepareData = async (product) => {
  await Product.create({
    title: product?.productName,
    slug: slugify(product?.productName) + Math.round(Math.random() * 100) + "",
    description: product?.description,
    brand: product?.brand,
    price: Math.round(Number(product?.price.match(/\d/g).join("")) / 100),
    category: product?.category[1],
    quantity: Math.round(Math.random() * 1000),
    sold: Math.round(Math.random() * 100),
    thumb: product?.thumb,
    images: product?.images,
    color: product?.variants?.find((element) => element.label === "Color")
      ?.variants[0],
    totalRatings: 0,
  });
};
const prepareProductCategory = async (category) => {
  await ProductCategory.create({
    title: category?.cate,
 
    image: category?.image,
  });
};
const prepareBrand = async (brand) => {
  await Brand.create({
    title: brand.title,
  });
};
const insertProduct = asyncHandler(async (req, res) => {
  const promises = [];
  for (let product of data) {
    promises.push(prepareData(product));
  }
  await Promise.all(promises);
  return res.json("Done");
});
const insertBrand = asyncHandler(async (req, res) => {
  const promises = [];
  for(let brand of dataBrand){
    promises.push(prepareBrand(brand))
  }
  await Promise.all(promises)
  return res.json("Done")
});
const insertCategory = asyncHandler(async (req, res) => {
  const promises = [];
  for (let category of dataCategory) {
    promises.push(prepareProductCategory(category));
  }
  await Promise.all(promises);
  return res.json("Done");
});
module.exports = { insertProduct, insertCategory ,insertBrand};
