const router = require("express").Router();
const ProductControllers = require("../controllers/productController");
const uploadFile = require("../config/cloudinary.config");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

// router.post(
//   "/",
//   [verifyAccessToken, isAdmin],
//   ProductControllers.createProduct
// );
router.get("/", ProductControllers.getAllProducts);
router.put("/rating", [verifyAccessToken], ProductControllers.rating);
router.post(
  "/create",
  [verifyAccessToken, isAdmin],
  uploadFile.fields([
    { name: "images", maxCount: 10 },
    { name: "thumb", maxCount: 1 },
  ]),
  ProductControllers.createProduct
);
router.put(
  "/uploadimage/:pid",
  [verifyAccessToken, isAdmin],
  uploadFile.array("images", 10),
  ProductControllers.uploadImagesProduct
);
router.put(
  "/:pid",
  [verifyAccessToken, isAdmin],
  uploadFile.fields([
    { name: "images", maxCount: 10 },
    { name: "thumb", maxCount: 1 },
  ]),
  ProductControllers.updateProduct
);
router.delete(
  "/:pid",
  [verifyAccessToken, isAdmin],
  ProductControllers.deleteProduct
);
router.get("/:pid", ProductControllers.getProduct);

module.exports = router;
