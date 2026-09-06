import { Hono } from 'hono';
import type { OnAppInstallRequest, TriggerResponse } from '@devvit/web/shared';
import { context, reddit, redis } from '@devvit/web/server';
import { getBotConfig, buildRegexFromPhrases, getRandomPhrase } from '../core/config';

interface CommentSubmitPayload {
  comment?: {
    id?: string;
    body?: string;
  };
  commentId?: string;
}

interface PostSubmitPayload {
  post?: {
    id?: string;
    title?: string;
    body?: string;
  };
  postId?: string;
}

export const triggers = new Hono();

async function alreadyAnswered(id: string): Promise<boolean> {
  const value = await redis.get(`laucha:answered:${id}`);
  return value !== undefined && value !== null;
}

async function markAnswered(id: string): Promise<void> {
  await redis.set(`laucha:answered:${id}`, '1');
}

triggers.post('/on-app-install', async (c) => {
  const input = await c.req.json<OnAppInstallRequest>();
  console.log('App installed to subreddit: r/' + input.subreddit?.name);
  return c.json<TriggerResponse>({ status: 'success' }, 200);
});

triggers.post('/comment-submit', async (c) => {
  //Input from JSON
  const input = await c.req.json<CommentSubmitPayload>();
  
  //Bot config for this subreddit
  const config = await getBotConfig(context.subredditId);
  const regex = buildRegexFromPhrases(config.triggerPhrases);

   //console.log('payload comment-submit:', JSON.stringify(input));

  //Comment info
  const commentId: string | undefined = input.comment?.id ?? input.commentId;
  const commentBody: string | undefined = input.comment?.body;

  if (!commentId || !commentBody) return c.json<TriggerResponse>({ status: 'success' }, 200);
  if (await alreadyAnswered(commentId)) return c.json<TriggerResponse>({ status: 'success' }, 200);

  if (regex && commentBody && regex.test(commentBody)) {
    const phrase = getRandomPhrase(config.responsePhrases);
    await reddit.submitComment({ id: commentId as `t1_${string}`, text: phrase });
    await markAnswered(commentId);
    console.log(`Respondido a comentario ${commentId} con: "${phrase.slice(0, 50)}..."`);
  }

  return c.json<TriggerResponse>({ status: 'success' }, 200);
});

triggers.post('/post-submit', async (c) => {
  //Input from JSON
  const input = await c.req.json<PostSubmitPayload>();

  //Bot config for this subreddit
  const config = await getBotConfig(context.subredditId);
  const regex = buildRegexFromPhrases(config.triggerPhrases);

  //Post info
  const postId: string | undefined = input.post?.id ?? input.postId;
  const postTitle: string | undefined = input.post?.title;
  const postContent: string | undefined = input.post?.body;

  if (!postId || !postTitle || !postContent) return c.json<TriggerResponse>({ status: 'success' }, 200);
  if (await alreadyAnswered(postId)) return c.json<TriggerResponse>({ status: 'success' }, 200);

  if (regex && ( postTitle && regex.test(postTitle) || postContent && regex.test(postContent))) {
    const phrase = getRandomPhrase(config.responsePhrases);
    await reddit.submitComment({ id: postId as `t3_${string}`, text: phrase });
    await markAnswered(postId);
    console.log(`Respondido al post ${postId} con: "${phrase.slice(0, 50)}..."`);
  }

  return c.json<TriggerResponse>({ status: 'success' }, 200);
});
