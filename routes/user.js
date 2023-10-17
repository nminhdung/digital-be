const router = require("express").Router();
const UserControllers = require("../controllers/userController");
const uploadFile = require("../config/cloudinary.config");

const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

router.post("/register", UserControllers.register);
router.post("/mock", UserControllers.createUsers);
router.put("/confirmregister/:token", UserControllers.confirmRegister);
router.get("/current", verifyAccessToken, UserControllers.getUser);
router.post("/login", UserControllers.login);
router.get("/refreshtoken", UserControllers.expiredToken);
router.get("/logout", UserControllers.logout);
router.post("/forgotpassword", UserControllers.forgotPassword);
router.put("/resetpassword", UserControllers.resetPassword);
router.get("/", [verifyAccessToken, isAdmin], UserControllers.getUsers);
router.delete("/:uid", [verifyAccessToken, isAdmin], UserControllers.deleteUser);
router.put("/currentuser", [verifyAccessToken,uploadFile.single("avatar")], UserControllers.updateUser);
router.put("/address", [verifyAccessToken], UserControllers.updateAddressUser);

router.put("/:uid", [verifyAccessToken,isAdmin], UserControllers.updateUserByAdmin);

module.exports = router;
