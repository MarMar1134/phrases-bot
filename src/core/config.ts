import { redis } from '@devvit/web/server';
import type { T5 } from '@devvit/shared-types/tid.js';

export type PhrasesBotConfig = {
  triggerPhrases: string[];
  responsePhrases: string[];
};

export const DEFAULT_CONFIG: PhrasesBotConfig = {
  triggerPhrases: ['el laucha', 'lautaro acosta', 'laucha acosta', 'al laucha'],
  responsePhrases: [
    'es todo lo que yo no soy',
    'Madurar es alcanzar un equilibrio, y en ese camino estoy, aprendiendo, escuchando a los que saben',
    'Los jugadores de fútbol vivimos dentro de una burbuja',
    'Mi ídolo no es ni Maradona, ni Messi... ¿Sabés quién es mi ídolo? Batistuta',
    'No unifican criterios',
    'Es un referí complicado. Depende quién lo necesite, dirige Hernán',
    'No hay que confundirse y creer que todos somos millonarios',
    'La gambeta me salvó la vida, y hacer terapia, la carrera',
  ],
};

function configKey(subredditId: T5): string {
  return `laucha:config:${subredditId}`;
}

export async function getBotConfig(subredditId: T5): Promise<PhrasesBotConfig> {
  const raw = await redis.get(configKey(subredditId));
  if (!raw) return DEFAULT_CONFIG;

  try {
    const parsed = JSON.parse(raw) as Partial<PhrasesBotConfig>;
    return {
      triggerPhrases:
        Array.isArray(parsed.triggerPhrases) && parsed.triggerPhrases.length > 0
          ? parsed.triggerPhrases
          : DEFAULT_CONFIG.triggerPhrases,
      responsePhrases:
        Array.isArray(parsed.responsePhrases) && parsed.responsePhrases.length > 0
          ? parsed.responsePhrases
          : DEFAULT_CONFIG.responsePhrases,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveBotConfig(subredditId: T5, config: PhrasesBotConfig): Promise<void> {
  await redis.set(configKey(subredditId), JSON.stringify(config));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildRegexFromPhrases(phrases: string[]): RegExp | null {
  const cleaned = phrases.map((p) => p.trim()).filter((p) => p.length > 0);
  if (cleaned.length === 0) return null;

  const alternatives = cleaned
    .map((phrase) => escapeRegExp(phrase).replace(/\s+/g, '\\s+'))
    .join('|');

  try {
    return new RegExp(`\\b(${alternatives})\\b`, 'i');
  } catch {
    return null;
  }
}

export function getRandomPhrase(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)] ?? '';
}