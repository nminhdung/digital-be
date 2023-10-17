const router = require("express").Router();
const CouponControllers = require("../controllers/couponController");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

router.post("/",[verifyAccessToken, isAdmin],CouponControllers.createCoupon)
router.put("/:cid",[verifyAccessToken, isAdmin],CouponControllers.updateCoupon)
router.delete("/:cid",[verifyAccessToken, isAdmin],CouponControllers.deleteCoupon)
router.get("/",CouponControllers.getAllCoupons)
module.exports = router;
