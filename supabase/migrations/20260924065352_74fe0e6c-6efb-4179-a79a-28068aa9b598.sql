CREATE OR REPLACE FUNCTION public.match_productos_fragma(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 4)
 RETURNS TABLE(id bigint, nombre text, categoria text, descripcion text, precio_desde numeric, precio_hasta numeric, caracteristicas text, tiempos_entrega text, similarity double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT
    id,
    nombre,
    categoria,
    descripcion,
    precio_desde,
    precio_hasta,
    caracteristicas,
    tiempos_entrega,
    1 - (embedding <=> query_embedding) AS similarity
  FROM productos_fragma
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$function$;