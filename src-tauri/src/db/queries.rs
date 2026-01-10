//! SQL queries for database schema operations

pub const GET_SCHEMAS: &str = r#"
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name
"#;

pub const GET_TABLES: &str = r#"
SELECT table_name
FROM information_schema.tables
WHERE table_schema = $1
  AND table_type = 'BASE TABLE'
ORDER BY table_name
"#;

pub const GET_COLUMNS: &str = r#"
SELECT
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
FROM information_schema.columns c
LEFT JOIN (
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
) pk ON c.column_name = pk.column_name
WHERE c.table_schema = $1
  AND c.table_name = $2
ORDER BY c.ordinal_position
"#;

pub const GET_FOREIGN_KEYS: &str = r#"
SELECT
    tc.constraint_name,
    tc.table_schema as source_schema,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_schema as target_schema,
    ccu.table_name as target_table,
    ccu.column_name as target_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = $1
ORDER BY tc.table_name, tc.constraint_name
"#;

pub const GET_FOREIGN_KEYS_FOR_TABLE: &str = r#"
SELECT
    tc.constraint_name,
    tc.table_schema as source_schema,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_schema as target_schema,
    ccu.table_name as target_table,
    ccu.column_name as target_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = $1
    AND tc.table_name = $2
ORDER BY tc.constraint_name
"#;

pub const GET_INDEXES: &str = r#"
SELECT
    i.relname as index_name,
    array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns,
    ix.indisunique as is_unique,
    ix.indisprimary as is_primary
FROM pg_index ix
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE n.nspname = $1
  AND t.relname = $2
GROUP BY i.relname, ix.indisunique, ix.indisprimary
ORDER BY i.relname
"#;

pub const GET_CONSTRAINTS: &str = r#"
SELECT
    tc.constraint_name,
    tc.constraint_type,
    array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns,
    cc.check_clause as definition
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
    AND tc.constraint_schema = cc.constraint_schema
WHERE tc.table_schema = $1
  AND tc.table_name = $2
GROUP BY tc.constraint_name, tc.constraint_type, cc.check_clause
ORDER BY tc.constraint_type, tc.constraint_name
"#;
