
-- Сначала удаляем существующие таблицы в правильном порядке
DROP TABLE IF EXISTS media_persons;
DROP TABLE IF EXISTS persons;

-- Теперь создаем таблицы заново
CREATE TABLE public.persons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    photo_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.media_persons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id uuid REFERENCES media_items(id) ON DELETE CASCADE,
    person_id uuid REFERENCES persons(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('actor', 'director')),
    character_name text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(media_id, person_id, role)
);

-- Настраиваем права доступа
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_persons ENABLE ROW LEVEL SECURITY;

-- Добавляем политики доступа
CREATE POLICY "Enable read access for all" ON public.persons
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.persons
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all" ON public.media_persons
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.media_persons
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Выдаем права
GRANT ALL ON public.persons TO authenticated;
GRANT ALL ON public.media_persons TO authenticated;
