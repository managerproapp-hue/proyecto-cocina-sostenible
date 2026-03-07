import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing profiles query...');
    const { data, count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

    console.log('Error:', error);
    console.log('Count:', count);
    console.log('Data:', data);

    console.log('\nTesting teams query...');
    const teams = await supabase.from('teams').select('*', { count: 'exact' });
    console.log('Teams count:', teams.count);
    console.log('Teams error:', teams.error);
}

test();
