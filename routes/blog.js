const router = require("express").Router();
const BlogControllers = require("../controllers/blogController");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");
const uploadFile = require("../config/cloudinary.config")

router.get("/", BlogControllers.getAllBlogs);
router.post("/", [verifyAccessToken, isAdmin], BlogControllers.createBlog);
router.get("/singleblog/:bid", BlogControllers.getBlog);
router.put("/like/:bid", [verifyAccessToken], BlogControllers.likeBlog);
router.put("/dislike/:bid", [verifyAccessToken], BlogControllers.dislikeBlog);
router.put("/:bid", [verifyAccessToken, isAdmin], BlogControllers.updateBlog);
router.put("/image/:bid", [verifyAccessToken, isAdmin],uploadFile.single("image") ,BlogControllers.uploadImageBlog);
router.delete("/:bid", [verifyAccessToken, isAdmin], BlogControllers.deleteBlog);

module.exports = router;
