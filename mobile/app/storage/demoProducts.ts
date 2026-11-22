// Примеры добавляются один раз при создании демо-базы. Даты считаются от первого запуска.
export const demoProducts = `
  WITH samples(id, name, expires_in_days, archived_days_ago) AS (
    VALUES
      (1, 'Сыворотка с витамином C', 10, NULL),
      (2, 'Увлажняющий крем для лица', 0, NULL),
      (3, 'Бальзам для губ', 2, NULL),
      (4, 'Тушь для ресниц', 5, NULL),
      (5, 'Солнцезащитный флюид SPF 50', 14, NULL),
      (6, 'Пенка для умывания', 22, NULL),
      (7, 'Успокаивающая маска', 30, NULL),
      (8, 'Крем для рук', 31, NULL),
      (9, 'Гель для душа', 60, NULL),
      (10, 'Мицеллярная вода', 75, NULL),
      (11, 'Тональный крем', 120, NULL),
      (12, 'Масло для волос', 365, NULL),
      (13, 'Крем для кожи вокруг глаз', -3, NULL),
      (14, 'Пилинг для лица', -18, NULL),
      (15, 'Карандаш для бровей', NULL, NULL),
      (16, 'Шампунь для объёма', 90, 3),
      (17, 'Матовая помада', -20, 18),
      (18, 'Молочко для тела', 5, 7),
      (19, 'Тоник для лица', -35, 30),
      (20, 'Маска для волос', NULL, 45)
  )
  INSERT INTO products (id, name, note, expiry_kind, expires_on, archived_at)
  SELECT
    printf('bd32e7fd-c23d-4824-9cd5-%012d', id),
    name,
    '',
    CASE WHEN expires_in_days IS NOT NULL THEN 'date' END,
    CASE WHEN expires_in_days IS NOT NULL THEN date('now', 'localtime', printf('%+d days', expires_in_days)) END,
    CASE WHEN archived_days_ago IS NOT NULL THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now', printf('-%d days', archived_days_ago)) END
  FROM samples;
`
