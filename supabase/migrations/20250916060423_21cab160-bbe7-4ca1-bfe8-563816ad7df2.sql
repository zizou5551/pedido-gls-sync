-- Vaciar todas las tablas para pruebas
-- Eliminar todos los envíos GLS
DELETE FROM envios_gls;

-- Eliminar todos los pedidos
DELETE FROM pedidos;

-- Reiniciar secuencias si las hubiera (no aplica aquí porque usamos text como ID)
-- Mostrar confirmación
SELECT 'Tablas vaciadas correctamente - Listo para nuevas pruebas' as mensaje;