const router = require("express").Router();
const BrandControllers = require("../controllers/brandController");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

router.post("/",[verifyAccessToken,isAdmin],BrandControllers.createBrand)
router.get("/",BrandControllers.getAllBrands)
router.put("/:brid",[verifyAccessToken,isAdmin],BrandControllers.updateBrand)
router.delete("/:brid",[verifyAccessToken,isAdmin],BrandControllers.deleteBrand)


module.exports = router;
