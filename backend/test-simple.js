require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function test() {
    console.log('Testing Supabase connection...');

    const { data, error } = await supabase
        .from('usuarios')
        .select('count');

    if (error) {
        console.log('ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS: Connected to Supabase');
        console.log('Data:', data);
    }
}

test().catch(console.error);
