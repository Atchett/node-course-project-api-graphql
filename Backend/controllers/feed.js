const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");

const { deleteFile } = require("../utils/deleteFile");
const io = require("../utils/socket");

// get all posts
exports.getPosts = async (req, res, next) => {
  const currentPage = +req.query.page || 1;
  const perPage = 2;

  try {
    const count = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: "desc" })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    if (!posts) {
      const error = new Error("No posts found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: "Posts fetched",
      posts: posts,
      totalItems: count,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

// create a post
exports.createPost = async (req, res, next) => {
  // check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(`Validation failed`);
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  // file check
  const file = req.file;
  if (!file) {
    const error = new Error(`No image attached`);
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = file.path;
  // post data
  const { title, content } = req.body;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  try {
    await post.save();

    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    io.getIO().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });

    res.status(201).json({
      message: "Post created successfully",
      post: post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

// update a post
exports.updatePost = async (req, res, next) => {
  // check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(`Validation failed`);
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { postId } = req.params;
  const { title, content, image } = req.body;
  let imageUrl = image;
  const file = req.file;
  if (file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error(`No image attached`);
    error.statusCode = 422;
    throw error;
  }
  try {
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("No post found");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      deleteFile(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const result = await post.save();
    io.getIO().emit("posts", { action: "update", post: result });
    res.status(200).json({ message: "Post updated", post: result });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

// get a single post
exports.getPost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("No post found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post found", post: post });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    // post update
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("No post found");
      error.statusCode = 404;
      throw error;
    }
    // Check logged in user
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    deleteFile(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    // user update
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIO().emit("posts", { action: "delete", post: postId });
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
