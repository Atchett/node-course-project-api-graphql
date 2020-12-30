const bcrypt = require("bcryptjs");
const { default: validator } = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");
const { generalConfig } = require("../config/generalParams");
const { errorCodes } = require("../config/statusCodes");
const { authCheck } = require("../utils/authCheck");
const { deleteFile } = require("../utils/deleteFile");

module.exports = {
  createUser: async ({ userInput }, req) => {
    const { email, name, password } = userInput;
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: "Invalid email address" });
    }
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({ message: "Invalid password" });
    }
    if (errors.length) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = errorCodes.INVALID_INPUT;
      throw error;
    }
    try {
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        const error = new Error("User exists");
        throw error;
      }
      const hashedPwd = await bcrypt.hash(password, 12);
      const user = new User({
        email: email,
        name: name,
        password: hashedPwd,
      });
      const createdUser = await user.save();
      return { ...createdUser._doc, _id: createdUser._id.toString() };
    } catch (error) {
      throw error;
    }
  },
  // login resolver
  login: async ({ userInput }) => {
    const { email, password } = userInput;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("Could not login");
        error.code = errorCodes.NOT_AUTHENTICATED;
        throw error;
      }
      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        const error = new Error("Could not login");
        error.code = errorCodes.NOT_AUTHENTICATED;
        throw error;
      }
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1hr" }
      );
      return { token: token, userId: user._id.toString() };
    } catch (error) {
      throw error;
    }
  },
  // Post
  createPost: async ({ postInput }, req) => {
    // validate user logged in
    authCheck(req);
    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: "Title invalid" });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: "Content invalid" });
    }
    if (errors.length) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = errorCodes.INVALID_INPUT;
      throw error;
    }
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error("Invalid user");
        error.code = errorCodes.NOT_AUTHORIZED;
        throw error;
      }
      const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: user,
      });

      // add post to user
      const createdPost = await post.save();
      user.posts.push(createdPost);
      await user.save();
      return {
        ...createdPost._doc,
        _id: createdPost._id.toString(),
        createdAt: createdPost.createdAt.toISOString(),
        updatedAt: createdPost.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },
  posts: async ({ page }, req) => {
    // validate user logged in
    authCheck(req);
    if (!page) {
      page = 1;
    }
    try {
      const perPage = generalConfig.numberPostsPerPage;
      const totalPosts = await Post.find().countDocuments();
      const posts = await Post.find()
        .sort({ createdAt: "desc" })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate("creator");
      return {
        posts: posts.map((p) => {
          return {
            ...p._doc,
            _id: p._id.toString(),
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          };
        }),
        totalPosts: totalPosts,
      };
    } catch (error) {
      throw error;
    }
  },
  post: async ({ id }, req) => {
    // validate user logged in
    authCheck(req);
    try {
      const post = await Post.findById(id).populate("creator");
      if (!post) {
        const error = new Error("No post found");
        error.code = errorCodes.NOT_FOUND;
        throw error;
      }
      return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },
  updatePost: async ({ id, postInput }, req) => {
    // validate user logged in
    authCheck(req);
    try {
      const post = await Post.findById(id).populate("creator");
      if (!post) {
        const error = new Error("No post found");
        error.code = errorCodes.NOT_FOUND;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("Not authorised to edit post");
        error.code = errorCodes.NOT_AUTHORIZED;
        throw error;
      }
      const { title, content, imageUrl } = postInput;
      const errors = [];
      if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
        errors.push({ message: "Title invalid" });
      }
      if (
        validator.isEmpty(content) ||
        !validator.isLength(content, { min: 5 })
      ) {
        errors.push({ message: "Content invalid" });
      }
      if (errors.length) {
        const error = new Error("Invalid input");
        error.data = errors;
        error.code = errorCodes.INVALID_INPUT;
        throw error;
      }
      post.title = title;
      post.content = content;
      if (imageUrl !== "undefined") {
        post.imageUrl = imageUrl;
      }
      const updatedPost = await post.save();
      return {
        ...updatedPost._doc,
        _id: updatedPost._id.toString(),
        createdAt: updatedPost.createdAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },
  deletePost: async ({ id }, req) => {
    // validate user logged in
    authCheck(req);
    try {
      const post = await Post.findById(id);
      if (!post) {
        const error = new Error("No post found");
        error.code = errorCodes.NOT_FOUND;
        throw error;
      }
      if (post.creator.toString() !== req.userId.toString()) {
        const error = new Error("Not authorised to delete post");
        error.code = errorCodes.NOT_AUTHORIZED;
        throw error;
      }
      deleteFile(post.imageUrl);
      await Post.findByIdAndRemove(id);
      const user = await User.findById(req.userId);
      user.posts.pull(id);
      await user.save();
      return true;
    } catch (error) {
      throw error;
    }
  },
  user: async (args, req) => {
    authCheck(req);
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error("No user found");
        error.code = errorCodes.NOT_FOUND;
        throw error;
      }
      return {
        ...user._doc,
        _id: user._id.toString(),
      };
    } catch (error) {
      throw error;
    }
  },
  updateStatus: async ({ status }, req) => {
    authCheck(req);
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error("No user found");
        error.code = errorCodes.NOT_FOUND;
        throw error;
      }
      user.status = status;
      await user.save();
      return {
        ...user._doc,
        _id: user._id.toString(),
      };
    } catch (error) {
      throw error;
    }
  },
};
