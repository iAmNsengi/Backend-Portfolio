const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // to reject a file not matching my criterias
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png")
    cb(null, true);
  else cb(new Error("File type not supported"), false);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

const Blog = require("../models/blog");

router.get("/", (req, res, next) => {
  Blog.find()
    .select("blogImage author title content _id")
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        blogs: docs.map((doc) => {
          return {
            blogImage: doc.blogImage,
            title: doc.title,
            author: doc.author,
            content: doc.content,
            _id: doc._id,
            request: {
              type: "GET",
              url: "http://localhost:3000/blogs/" + doc._id,
              imageUrl: "http://localhost:3000/" + doc.blogImage,
            },
          };
        }),
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
router.post("/", upload.single("blogImage"), (req, res, next) => {
  console.log(req.file);
  const blog = new Blog({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    author: req.body.author,
    content: req.body.content,
    blogImage: req.file.path,
  });
  blog
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Blog Post Created Successfully!",
        createdBlog: {
          _id: result._id,
          title: result.title,
          author: result.author,
          content: result.content,
          request: {
            type: "GET",
            url: "http://localhost:3000/blogs/" + result._id,
          },
        },
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
      console.log(err);
    });
});

router.get("/:blogId", (req, res, next) => {
  const id = req.params.blogId;
  Blog.findById(id)
    .exec()
    .then((doc) => {
      console.log("From database", doc);
      if (doc) res.status(200).json(doc);
      else
        res
          .status(404)
          .json({ message: "No entry with the given ID was found" });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

router.patch("/:blogId", (req, res, next) => {
  const id = req.params.blogId;
  Blog.findOneAndUpdate({ _id: id }, req.body)
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Item upated successfully",
        request: {
          method: "GET",
          url: "http:localhost:3000/blogs/" + id,
        },
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.delete("/:blogId", (req, res, next) => {
  const id = req.params.blogId;
  Blog.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
