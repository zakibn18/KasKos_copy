const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Cek apakah variabel .env terbaca
console.log("Cek URL .env:", supabaseUrl ? "Terbaca" : "KOSONG/TIDAK TERBACA");
console.log("Cek Key .env:", supabaseKey ? "Terbaca" : "KOSONG/TIDAK TERBACA");

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;