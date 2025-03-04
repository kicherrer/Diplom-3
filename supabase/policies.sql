-- Сначала удаляем существующие политики
DROP POLICY IF EXISTS "Enable read access for all users" ON media_persons;
DROP POLICY IF EXISTS "Enable insert for admins" ON media_persons;
DROP POLICY IF EXISTS "Enable delete for admins" ON media_persons;
DROP POLICY IF EXISTS "Enable read access for all users" ON genres;
DROP POLICY IF EXISTS "Enable insert for admins" ON genres;
DROP POLICY IF EXISTS "Enable update for admins" ON genres;
DROP POLICY IF EXISTS "Enable delete for admins" ON genres;

-- Проверяем и создаем таблицу genres если её нет
CREATE TABLE IF NOT EXISTS genres (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    name_ru text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Включаем RLS для таблиц
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_persons ENABLE ROW LEVEL SECURITY;

-- Создаем новые политики для genres
CREATE POLICY "Enable read access for all users" ON genres
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for admins" ON genres
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Enable update for admins" ON genres
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Enable delete for admins" ON genres
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Создаем новые политики для media_persons
CREATE POLICY "Enable read access for all users" ON media_persons
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for admins" ON media_persons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Enable delete for admins" ON media_persons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );
