import express, { Request, Response, NextFunction } from "express";
import mongoose, { Document } from "mongoose";
import multer from "multer";
import BlogModel, { Blog } from "../models/blog";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
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

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs: Blog[] = await BlogModel.find()
      .select("blogImage author title content _id")
      .exec();

    const response = {
      count: docs.length,
      blogs: docs.map((doc) => ({
        blogImage: doc.blogImage,
        title: doc.title,
        author: doc.author,
        content: doc.content,
        _id: doc._id,
        request: {
          type: "GET",
          url: `http://localhost:3000/blogs/${doc._id}`,
          imageUrl: `http://localhost:3000/${doc.blogImage}`,
        },
      })),
    };
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.post(
  "/",
  upload.single("blogImage"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.file);
      const blog = new BlogModel({
        _id: new mongoose.Types.ObjectId(),
        title: req.body.title,
        author: req.body.author,
        content: req.body.content,
        blogImage: req.file.path,
      });
      const result = await blog.save();

      res.status(201).json({
        message: "Blog Post Created Successfully!",
        createdBlog: {
          _id: result._id,
          title: result.title,
          author: result.author,
          content: result.content,
          request: {
            type: "GET",
            url: `http://localhost:3000/blogs/${result._id}`,
          },
        },
      });
    } catch (err) {
      res.status(500).json({ error: err });
      console.log(err);
    }
  }
);

router.get(
  "/:blogId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.blogId;
      const doc: Blog | null = await BlogModel.findById(id).exec();

      console.log("From database", doc);
      if (doc) res.status(200).json(doc);
      else
        res
          .status(404)
          .json({ message: "No entry with the given ID was found" });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }
);

router.patch(
  "/:blogId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.blogId;
      await BlogModel.findOneAndUpdate({ _id: id }, req.body).exec();
      res.status(200).json({
        message: "Item updated successfully",
        request: {
          method: "GET",
          url: `http:localhost:3000/blogs/${id}`,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }
);

router.delete(
  "/:blogId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.blogId;
      const result = await BlogModel.deleteOne({ _id: id }).exec();
      res.status(200).json({ message: result });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }
);

export default router;
