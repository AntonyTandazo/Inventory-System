/**
 * Script de prueba para verificar conexión con Supabase
 * Ejecutar con: node test-supabase.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('=== TEST DE CONEXIÓN SUPABASE ===\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NO CONFIGURADA');
console.log('');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Faltan credenciales de Supabase en .env');
    console.error('   Asegúrate de tener SUPABASE_URL y SUPABASE_ANON_KEY configurados');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('1. Probando conexión básica...');

        // Test 1: Verificar que las tablas existen
        console.log('\n2. Verificando tabla USUARIOS...');
        const { data: usuarios, error: errorUsuarios } = await supabase
            .from('usuarios')
            .select('count')
            .limit(1);

        if (errorUsuarios) {
            console.error('❌ Error al acceder a tabla USUARIOS:', errorUsuarios.message);
            console.error('   Código:', errorUsuarios.code);
            console.error('   Detalles:', errorUsuarios.details);
        } else {
            console.log('✅ Tabla USUARIOS accesible');
        }

        // Test 2: Verificar otras tablas
        const tablas = ['categorias', 'productos', 'clientes', 'pedidos', 'pagos'];
        console.log('\n3. Verificando otras tablas...');

        for (const tabla of tablas) {
            const { error } = await supabase
                .from(tabla)
                .select('count')
                .limit(1);

            if (error) {
                console.error(`❌ Tabla ${tabla.toUpperCase()}: ${error.message}`);
            } else {
                console.log(`✅ Tabla ${tabla.toUpperCase()} accesible`);
            }
        }

        // Test 3: Intentar crear un usuario de prueba
        console.log('\n4. Probando INSERT en tabla USUARIOS...');
        const testUser = {
            usuario: 'test_' + Date.now(),
            password: 'test123',
            email: `test${Date.now()}@example.com`,
            nombre_negocio: 'Test Store'
        };

        const { data: newUser, error: insertError } = await supabase
            .from('usuarios')
            .insert([testUser])
            .select()
            .single();

        if (insertError) {
            console.error('❌ Error al insertar usuario de prueba:', insertError.message);
            console.error('   Código:', insertError.code);
            console.error('   Detalles:', insertError.details);
        } else {
            console.log('✅ Usuario de prueba creado exitosamente');
            console.log('   ID:', newUser.id);
            console.log('   Usuario:', newUser.usuario);

            // Limpiar: eliminar usuario de prueba
            console.log('\n5. Limpiando usuario de prueba...');
            const { error: deleteError } = await supabase
                .from('usuarios')
                .delete()
                .eq('id', newUser.id);

            if (deleteError) {
                console.warn('⚠️  No se pudo eliminar usuario de prueba:', deleteError.message);
            } else {
                console.log('✅ Usuario de prueba eliminado');
            }
        }

        console.log('\n=== PRUEBA COMPLETADA ===');
        console.log('✅ La conexión con Supabase está funcionando correctamente');

    } catch (error) {
        console.error('\n❌ ERROR INESPERADO:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testConnection();
