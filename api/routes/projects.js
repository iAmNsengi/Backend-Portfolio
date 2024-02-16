const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

const checkAuth = require("../middleware/check-auth");

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

const Project = require("../models/project");

router.get("/", (req, res, next) => {
  Project.find()
    .select("image tile description link _id")
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        projects: docs.map((doc) => {
          return {
            image: doc.image,
            title: doc.title,
            description: doc.description,
            link: doc.link,
            _id: doc._id,
            request: {
              type: "GET",
              url: "http://localhost:3000/projects/" + doc._id,
              imageUrl: "http://localhost:3000/" + doc.image,
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
router.post("/", checkAuth, upload.single("image"), (req, res, next) => {
  console.log(req.file);
  const blog = new Project({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    description: req.body.description,
    image: req.file.path,
    link: req.body.link,
  });
  blog
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Project Created Successfully!",
        createdBlog: {
          _id: result._id,
          title: result.title,
          descrition: result.description,
          content: result.image.path,
          link: result.link,
          request: {
            type: "GET",
            link: "http://localhost:3000/projects/" + result._id,
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

router.get("/:projectId", (req, res, next) => {
  const id = req.params.projectId;
  Project.findById(id)
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

router.patch("/:projectId", checkAuth, (req, res, next) => {
  const id = req.params.projectId;
  Project.findOneAndUpdate({ _id: id }, req.body)
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Item upated successfully",
        request: {
          method: "GET",
          url: "http:localhost:3000/projects/" + id,
        },
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.delete("/:projectId", checkAuth, (req, res, next) => {
  const id = req.params.projectId;
  Project.deleteOne({ _id: id })
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
