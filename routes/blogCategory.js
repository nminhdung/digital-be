const router = require("express").Router();
const BlogCategoryControllers = require("../controllers/blogCategoryController");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

router.post("/",[verifyAccessToken,isAdmin],BlogCategoryControllers.createCategory)
router.get("/",BlogCategoryControllers.getAllCategories)
router.put("/:bcid",[verifyAccessToken,isAdmin],BlogCategoryControllers.updateCategory)
router.delete("/:bcid",[verifyAccessToken,isAdmin],BlogCategoryControllers.deleteCategory)


module.exports = router;
