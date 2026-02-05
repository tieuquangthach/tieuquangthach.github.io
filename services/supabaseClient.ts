
import { createClient } from '@supabase/supabase-js';

// Thông tin kết nối dự án HocToan2 của bạn
const supabaseUrl = 'https://kwwvvntrdyfpxveesopp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3d3Z2bnRyZHlmcHh2ZWVzb3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTcxOTEsImV4cCI6MjA4NDg3MzE5MX0.Kdtt0fxQxsPiBOhRYBpmV1Ok-DGx9TSQjqMHBEIXBGc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
