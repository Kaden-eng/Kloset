import { createBrowserClient } from './src/lib/supabaseClient';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');

  const supabase = createBrowserClient();

  // Test 1: Check if we can connect
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    console.log('Connection test result:', { data, error });
  } catch (err) {
    console.error('Connection test failed:', err);
  }

  // Test 2: Check table structure
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    console.log('Table structure test result:', { data, error });
  } catch (err) {
    console.error('Table structure test failed:', err);
  }

  // Test 3: Check RLS policies
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);

    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);
      console.log('RLS test result:', { data, error });
    } else {
      console.log('No authenticated user for RLS test');
    }
  } catch (err) {
    console.error('RLS test failed:', err);
  }
}

testSupabaseConnection();