import { Hono } from 'hono';
import type { MenuItemRequest, UiResponse } from '@devvit/web/shared';
import type { FormField } from '@devvit/shared-types/shared/form.js';
import { context } from '@devvit/web/server';
import { getBotConfig } from '../core/config';

export const menu = new Hono();

const buildNukeFields = (targetId: string): FormField[] => [
  {
    name: 'targetId',
    label: 'Target ID',
    type: 'string',
    helpText: 'Auto-filled from the selected item.',
    required: true,
    defaultValue: targetId,
  },
  {
    name: 'remove',
    label: 'Remove comments',
    type: 'boolean',
    defaultValue: true,
  },
  {
    name: 'lock',
    label: 'Lock comments',
    type: 'boolean',
    defaultValue: false,
  },
  {
    name: 'skipDistinguished',
    label: 'Skip distinguished comments',
    type: 'boolean',
    defaultValue: false,
  },
];

const buildNukeForm = (title: string, targetId: string) => ({
  fields: buildNukeFields(targetId),
  title,
  acceptLabel: 'Mop',
  cancelLabel: 'Cancel',
});

menu.post('/mop-comment', async (c) => {
  const request = await c.req.json<MenuItemRequest>();
  console.log('request', request.targetId);
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopComment',
        form: buildNukeForm('Mop Comments', request.targetId),
      },
    },
    200
  );
});

menu.post('/mop-post', async (c) => {
  const request = await c.req.json<MenuItemRequest>();
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopPost',
        form: buildNukeForm('Mop Post Comments', request.targetId),
      },
    },
    200
  );
});

menu.post('/configure-phrases-bot', async (c) => {
  const current = await getBotConfig(context.subredditId);

  return c.json<UiResponse>(
    {
      showForm: {
        name: 'configurePhrasesBot',
        form: {
          title: 'Config Phrases Bot',
          acceptLabel: 'Save',
          cancelLabel: 'Cancel',
          fields: [
            {
              name: 'triggerPhrases',
              label: 'Words and phrases that triggers the bot',
              type: 'paragraph',
              helpText: 'One phrase per line.',
              required: true,
              defaultValue: current.triggerPhrases.join('\n'),
            },
            {
              name: 'responsePhrases',
              label: 'Phrases that will comment the bot',
              type: 'paragraph',
              helpText: 'One phrase per line. These are randomly selected when responding to trigger phrases.',
              required: true,
              defaultValue: current.responsePhrases.join('\n'),
            },
          ],
        },
      },
    },
    200
  );
});