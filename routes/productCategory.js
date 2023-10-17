const router = require("express").Router();
const ProductControllers = require("../controllers/productCategoryController");
const uploadFile = require("../config/cloudinary.config");

const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

router.post("/",[verifyAccessToken,isAdmin],ProductControllers.createCategory)
router.get("/",ProductControllers.getAllCategories)
router.put("/:pcid",[verifyAccessToken,isAdmin],ProductControllers.updateCategory)
router.delete("/:pcid",[verifyAccessToken,isAdmin],ProductControllers.deleteCategory)


module.exports = router;
