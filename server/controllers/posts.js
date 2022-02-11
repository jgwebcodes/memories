import mongoose from 'mongoose';
import PostMessage from '../models/postMessage.js';

// GET POST
export const getPost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await PostMessage.findById(id);

    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// GET POSTS
export const getPosts = async (req, res) => {
  const { page } = req.query;

  try {
    const LIMIT = 8;
    const startIndex = (Number(page) - 1) * LIMIT;
    const total = await PostMessage.countDocuments({});
    const posts = await PostMessage.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);

    res.status(200).json({ data: posts, currentPage: Number(page), numberOfPages: Math.ceil(total / LIMIT) });
  } catch (error) {
    res.status(404).json({ message: error });
  }
};

// GET POSTS BY SEARCH
export const getPostsBySearch = async (req, res) => {
  const { searchQuery, tags } = req.query;

  try {
    const title = new RegExp(searchQuery, 'i');
    const posts = await PostMessage.find({ $or: [{ title }, { tags: { $in: tags.split(',') } }] });
    res.json({ data: posts });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// CREATE A NEW POST
export const createPost = async (req, res) => {
  const post = req.body;
  const newPost = new PostMessage({ ...post, creator: req.userId, createdAt: new Date().toISOString() });

  try {
    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// UPDATE AN EXISTING POST
export const updatePost = async (req, res) => {
  const { id: _id } = req.params;
  const post = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No post with that id');

  const updatedPost = await PostMessage.findByIdAndUpdate(_id, post, { new: true });

  res.json(updatedPost);
};

// DELETE AN EXISTING POST
export const deletePost = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No post with that id');

  await PostMessage.findByIdAndRemove(id);

  res.json({ message: 'Post deleted succesfully' });
};

// LIKE A POST
export const likePost = async (req, res) => {
  const { id } = req.params;

  // Authentication
  if (!req.userId) return res.json({ message: 'Unauthenticated' });
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No post with that id');
  const post = await PostMessage.findById(id);
  const index = post.likes.findIndex((id) => id === String(req.userId));

  if (index === -1) {
    // like the post
    post.likes.push(req.userId);
  } else {
    // dislike the post
    post.likes = post.likes.filter((id) => id !== String(req.userId));
  }
  const updatedPost = await PostMessage.findByIdAndUpdate(id, post, { new: true });
  res.json(updatedPost);
};

// COMMENT A POST
export const commentPost = async (req, res) => {
  // Getting the data coming from the Front End
  const { id } = req.params;
  const { value } = req.body;

  // Updating data in Front End
  const post = await PostMessage.findById(id);
  post.comments.push(value);

  // Updating the DB (Back End)
  const updatedPost = await PostMessage.findByIdAndUpdate(id, post, { new: true });

  // Sending updated post back to the Front End
  res.json(updatedPost);
};
