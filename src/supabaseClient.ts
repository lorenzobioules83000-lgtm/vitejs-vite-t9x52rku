import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sbqkhudetdfvjwyryvx.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicWtodWRldGR0ZnZqd3lyeXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzc0NTQsImV4cCI6MjEwMzg1MzQ1NH0.8cbiFL5cGAN2vLL4vvDBIsr-N-4diAahHRDAxxKCkxQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
