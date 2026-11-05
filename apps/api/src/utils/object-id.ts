import { z } from 'zod';

export const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
export const isObjectId = (value: unknown): value is string => typeof value === 'string' && OBJECT_ID_REGEX.test(value);
export const objectIdSchema = z.string().regex(OBJECT_ID_REGEX, 'Invalid id');