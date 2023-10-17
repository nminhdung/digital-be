const Product = require("../models/product");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");

//CRUD Product
const createProduct = asyncHandler(async (req, res) => {
  const { title, price, description, brand, category, color } = req.body;
  console.log(req.body)
  console.log(req.files);
  if (!title || !price || !description || !brand || !category || !color)
    throw new Error("Missing inputs");
  const thumb = req.files?.thumb.path;
  const images = req.files?.images?.map((item) => item.path);
 
  if (thumb) req.body.thumb = thumb;
  if (images) req.body.images = images;
  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  }
  const newProduct = await Product.create(req.body);
  return res.status(200).json({
    success: newProduct ? true : false,
    mes: newProduct ? "Created new product" : "Can't create new product",
    createdProduct: newProduct ? newProduct : "Can not create new product",
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const product = await Product.findById(pid).populate({
    path: "ratings",
    populate: {
      path: "postedBy",
      select: "firstname lastname",
    },
  });

  return res.status(200).json({
    success: product ? true : false,
    productData: product ? product : "Can not get product",
  });
});
const getAllProducts = asyncHandler(async (req, res) => {
  const queries = { ...req.query };
  console.log(queries);
  //Tach cac truong dac biet ra khoi query
  const excludeFields = ["limit", "sort", "page", "fields"];
  excludeFields.forEach((element) => delete queries[element]);

  //Format lai cac operators cho dung cu phap mongoose
  let queryString = JSON.stringify(queries).replace(
    /\b(gte|gt|lt|lte)\b/g,
    (matchedElement) => `$${matchedElement}`
  );

  const formatedQueries = JSON.parse(queryString);
  let colorQueryObject = {};
  //filter ( chi can go mot tu giong thi se tu dong match ) ex: doi vs nhung san pham ten dai`
  if (queries?.title)
    formatedQueries.title = { $regex: queries.title, $options: "i" };
  if (queries?.category) {
    formatedQueries.category = { $regex: queries.category, $options: "i" };
  }
  if (queries?.color) {
    delete formatedQueries.color;

    const colorArray = queries.color?.split(",");
    const colorQuery = colorArray.map((item) => {
      return { color: { $regex: item, $options: "i" } };
    });
    colorQueryObject = { $or: colorQuery };
  }
  let querySearchObject = {};
  if (queries?.search) {
    delete formatedQueries.search;
    querySearchObject = {
      $or: [
        { title: { $regex: queries.search, $options: "i" } },
        { category: { $regex: queries.search, $options: "i" } },
        { brand: { $regex: queries.search, $options: "i" } },
      ],
    };
  }
  const q = { ...colorQueryObject, ...formatedQueries, ...querySearchObject };
  let queryCommand = Product.find(q);
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    queryCommand = queryCommand.sort(req.query.sort);
  }
  //fields limit
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    queryCommand = queryCommand.select(fields);
  }
  //pagination
  const page = +req.query.page || 1;
  const limit = +req.query.limit || process.env.LIMIT_PRODUCT;
  const skip = (page - 1) * limit;
  queryCommand.skip(skip).limit(limit);
  //so luong san pham thoa dieu kien
  queryCommand.then(async (response, err) => {
    if (err) throw new Error(err.message);
    const counts = await Product.find(q).countDocuments();

    return res.status(200).json({
      success: response ? true : false,
      listProduct: response ? response : "Cant not get all products",
      counts,
    });
  });

  //Execute query
  //   queryCommand.exec(async (err, response) => {
  //     if (err) throw new Error(err.message);
  //     const counts = await Product.find(formatedQueries).countDocuments();
  //     return res.status(200).json({
  //       success: response ? true : false,
  //       listProduct: response ? response : "Can not get all products",
  //       counts,
  //     });
  //   });
});
const updateProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const files = req?.files;
  if (files?.thumb) {
    req.body.thumb = files?.thumb[0]?.path;
  }
  if (files?.images) {
    req.body.images = files.images?.map((item) => item.path);
  }
  if (req.body && req.body.title) {
    req.body.slug = slugify(req.body.title);
  }
  const updatedProduct = await Product.findByIdAndUpdate(pid, req.body, {
    new: true,
  });
  return res.status(200).json({
    success: updatedProduct ? true : false,
    mes: updatedProduct ? "Updated" : "Can not update product",
  });
});
const deleteProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  const deletedProduct = await Product.findByIdAndDelete(pid);
  return res.status(200).json({
    success: deletedProduct ? true : false,
    mes: deletedProduct ? "Deleted" : "Can not delete product",
  });
});
const rating = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, comment, pid, updatedAt } = req.body;
  if (!star || !pid) throw new Error("Missing input");
  //user da~ danh gia roi
  const ratingProduct = await Product.findById(pid);
  const alreadyRating = ratingProduct?.ratings?.find(
    (element) => element.postedBy.toString() === _id
  );

  if (alreadyRating) {
    //update star && comment
    //Bang Product => Update 1 document co Array ratings va ratings co chua mot element giong voi alreadyRating
    await Product.updateOne(
      {
        ratings: { $elemMatch: alreadyRating }, //dieu kien de filter o doi so 1
      },
      {
        // $ la ket qua  elemMatch:alreadyRating
        $set: {
          "ratings.$.star": star,
          "ratings.$.comment": comment,
          "ratings.$.updatedAt": updatedAt,
        },
      },
      { new: true }
    );
  } else {
    //add star and comment
    const response = await Product.findByIdAndUpdate(
      pid,
      //dung toan tu push cua mongoose de push vao mang Ratings
      {
        $push: { ratings: { star, comment, postedBy: _id, updatedAt } },
      },
      { new: true }
    );
  }
  //Sum ratings
  const updatedProduct = await Product.findById(pid);
  const ratingCount = updatedProduct.ratings.length;
  let sumRatings = updatedProduct.ratings.reduce((sum, element) => {
    return sum + +element.star;
  }, 0);
  updatedProduct.totalRatings =
    Math.round((sumRatings * 10) / ratingCount) / 10;
  await updatedProduct.save();
  return res.status(200).json({
    status: true,
    updatedProduct,
  });
});
const uploadImagesProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  if (req.files.length === 0) throw new Error("Missing inputs");
  const response = await Product.findByIdAndUpdate(
    pid,
    {
      $push: { images: { $each: req.files.map((file) => file.path) } },
    },
    { new: true }
  );
  return res.json({
    status: response ? true : false,
    updatedImages: response ? response : "Can not update images product",
  });
});

module.exports = {
  createProduct,
  getProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  rating,
  uploadImagesProduct,
};
