import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
export const createSessionId = customAlphabet(alphabet, 8);
