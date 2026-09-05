import { Hono } from 'hono';
import type { OnAppInstallRequest, TriggerResponse } from '@devvit/web/shared';
import { reddit, redis } from '@devvit/web/server';

export const triggers = new Hono();

// --- Mismo criterio que la versión en Python ---

const lauchaMatchCases = /\b(el\s+laucha|lautaro\s+acosta|laucha\s+acosta|al\s+laucha)\b/i;

const lauchaPhrases: string[] = [
  'es todo lo que yo no soy',
  'Madurar es alcanzar un equilibrio, y en ese camino estoy, aprendiendo, escuchando a los que saben',
  'Los jugadores de fútbol vivimos dentro de una burbuja',
  'Mi ídolo no es ni Maradona, ni Messi... ¿Sabés quién es mi ídolo? Batistuta',
  'No unifican criterios',
  'Es un referí complicado. Depende quién lo necesite, dirige Hernán',
  'No hay que confundirse y creer que todos somos millonarios',
  'La gambeta me salvó la vida, y hacer terapia, la carrera',
];

function getRandomLauchaPhrase(): string {
  return lauchaPhrases[Math.floor(Math.random() * lauchaPhrases.length)] ?? '';
}

// Reemplaza tus comments.txt / submissions.txt de antes
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
  const input = await c.req.json<any>();

  // 👇 IMPORTANTE: descomentá esta línea, hacé un comentario de prueba
  // en tu subreddit de playtest, y mirá los logs para confirmar los
  // nombres de campo reales (pueden variar según versión de Devvit).
   console.log('payload comment-submit:', JSON.stringify(input));

  const commentId: string | undefined = input.comment?.id ?? input.commentId;
  const commentBody: string | undefined = input.comment?.body;

  if (!commentId || !commentBody) return c.json<TriggerResponse>({ status: 'success' }, 200);
  if (await alreadyAnswered(commentId)) return c.json<TriggerResponse>({ status: 'success' }, 200);

  if (lauchaMatchCases.test(commentBody)) {
    const phrase = getRandomLauchaPhrase();
    await reddit.submitComment({ id: commentId as `t1_${string}`, text: phrase });
    await markAnswered(commentId);
    console.log(`Respondido a comentario ${commentId} con: "${phrase.slice(0, 50)}..."`);
  }

  return c.json<TriggerResponse>({ status: 'success' }, 200);
});

triggers.post('/post-submit', async (c) => {
  const input = await c.req.json<any>();

  const postId: string | undefined = input.post?.id ?? input.postId;
  const postTitle: string | undefined = input.post?.title;
  const postContent: string | undefined = input.post?.body;

  if (!postId || !postTitle || !postContent) return c.json<TriggerResponse>({ status: 'success' }, 200);
  if (await alreadyAnswered(postId)) return c.json<TriggerResponse>({ status: 'success' }, 200);

  if (lauchaMatchCases.test(postTitle) || lauchaMatchCases.test(postContent)) {
    const phrase = getRandomLauchaPhrase();
    await reddit.submitComment({ id: postId as `t3_${string}`, text: phrase });
    await markAnswered(postId);
    console.log(`Respondido al post ${postId} con: "${phrase.slice(0, 50)}..."`);
  }

  return c.json<TriggerResponse>({ status: 'success' }, 200);
});
