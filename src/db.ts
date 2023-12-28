import PocketBase from 'pocketbase';
import { TypedPocketBase } from './db.types';

export const client = new PocketBase(
  'https://lfc-muddy-shadow-6005.fly.dev'
) as TypedPocketBase;
