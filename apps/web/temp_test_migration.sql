-- Test if we can at least check the current schema
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
