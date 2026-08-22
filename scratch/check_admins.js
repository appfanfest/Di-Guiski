import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdmins() {
  console.log('--- Verificando esquema de perfiles_usuarios ---');
  const { data: columns, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'perfiles_usuarios' });
  if (colError) {
    console.log('No se pudo obtener columnas via RPC. Intentando consulta directa.');
    const { data: sample, error: sampleError } = await supabase.from('perfiles_usuarios').select('*').limit(1);
    if (sampleError) {
      console.error('Error al consultar perfiles_usuarios:', sampleError);
    } else {
      console.log('Campos disponibles:', Object.keys(sample[0] || {}));
    }
  } else {
    console.log('Columnas:', columns.map(c => c.column_name).join(', '));
  }

  console.log('\n--- Buscando administradores ---');
  const { data: admins, error: adminError } = await supabase
    .from('perfiles_usuarios')
    .select('id, nombre, correo, rol')
    .eq('rol', 'admin');

  if (adminError) {
    console.error('Error al buscar admins:', adminError);
  } else {
    console.log('Administradores encontrados:', admins.length);
    admins.forEach(a => console.log(`- ${a.nombre} (${a.correo}): Rol=${a.rol}`));
  }
}

checkAdmins();
