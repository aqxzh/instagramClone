import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        likes: {
          select: { userId: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong while fetching posts' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  const { description } = req.body;
  const authorId = req.userId;

  if (!req.file) {
    return res.status(400).json({ error: 'Image is required' });
  }

  if (!authorId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const imageUrl = req.file.path;

  try {
    const post = await prisma.post.create({
      data: {
        authorId,
        imageUrl,
        description,
      },
    });
    res.status(201).json(post);
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Something went wrong while creating the post', details: error.message });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const userId = req.userId;

  console.log('deletePost called for', postId, 'by user', userId);

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId !== userId) return res.status(403).json({ error: 'Not allowed' });

    await prisma.comment.deleteMany({ where: { postId } });
    await prisma.like.deleteMany({ where: { postId } });
    await prisma.post.delete({ where: { id: postId } });

    console.log('Post deleted', postId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Something went wrong while deleting the post' });
  }
};