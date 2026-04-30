import { Request, Response, NextFunction } from 'express';
import { CommunityPost } from './community.model';
import { successResponse } from '../../lib/response';

export const communityController = {
  /** GET /api/v1/community/posts?page=1&limit=10&tag=&q=&sort=createdAt */
  listPosts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Number(req.query.limit) || 10);
      const skip = (page - 1) * limit;
      const tag = req.query.tag as string | undefined;
      const q = req.query.q as string | undefined;
      const sort = req.query.sort === 'likes' ? { 'likes': -1 as const } : { createdAt: -1 as const };

      const filter: Record<string, any> = {};
      if (tag) filter.tags = tag;
      if (q) filter.content = { $regex: q, $options: 'i' };

      const [posts, total] = await Promise.all([
        CommunityPost.find(filter).sort(sort as any).skip(skip).limit(limit).lean(),
        CommunityPost.countDocuments(filter),
      ]);

      const enriched = posts.map((p) => ({
        ...p,
        likeCount: p.likes.length,
        replyCount: p.replies.length,
        isLiked: req.user ? p.likes.includes(req.user.userId) : false,
        isBookmarked: req.user ? p.bookmarks.includes(req.user.userId) : false,
      }));

      res.json(successResponse(enriched, { page, limit, total, totalPages: Math.ceil(total / limit) }));
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/community/posts */
  createPost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content, tags } = req.body;
      const post = await CommunityPost.create({
        authorId: req.user!.userId,
        authorName: (req.user as any)!.fullName || 'Student',
        content: String(content).replace(/<[^>]*>/g, ''), // strip HTML (XSS guard)
        tags: Array.isArray(tags) ? tags : [],
      });
      res.status(201).json(successResponse(post));
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/community/posts/:id/like */
  likePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const post = await CommunityPost.findById(req.params.id);
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

      const alreadyLiked = post.likes.includes(userId);
      if (alreadyLiked) {
        post.likes = post.likes.filter((id) => id !== userId);
      } else {
        post.likes.push(userId);
      }
      await post.save();
      res.json(successResponse({ liked: !alreadyLiked, likeCount: post.likes.length }));
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/community/posts/:id/bookmark */
  bookmarkPost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const post = await CommunityPost.findById(req.params.id);
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

      const already = post.bookmarks.includes(userId);
      if (already) {
        post.bookmarks = post.bookmarks.filter((id) => id !== userId);
      } else {
        post.bookmarks.push(userId);
      }
      await post.save();
      res.json(successResponse({ bookmarked: !already }));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/community/posts/:id/replies */
  getReplies: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await CommunityPost.findById(req.params.id).select('replies').lean();
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
      res.json(successResponse(post.replies));
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/community/posts/:id/replies */
  addReply: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body;
      const post = await CommunityPost.findById(req.params.id);
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

      post.replies.push({
        authorId: req.user!.userId,
        authorName: (req.user as any)!.fullName || 'Student',
        content: String(content).replace(/<[^>]*>/g, ''),
        createdAt: new Date(),
      });
      await post.save();
      res.status(201).json(successResponse(post.replies[post.replies.length - 1]));
    } catch (err) {
      next(err);
    }
  },
};
