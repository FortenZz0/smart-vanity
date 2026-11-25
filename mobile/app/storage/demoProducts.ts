// Сроки считаются от даты установки демоданных.
export const demoProducts = [
  `INSERT OR IGNORE INTO products (id, name, note, icon_id, expiry_kind, expires_on, archived_at)
  WITH samples(id, name, icon_id, expires_in_days, archived_days_ago) AS (
    VALUES
      (1, 'Сыворотка с витамином C', 'eyedropper', 10, NULL),
      (2, 'Увлажняющий крем для лица', 'lotion-outline', 0, NULL),
      (3, 'Бальзам для губ', 'lipstick', 2, NULL),
      (4, 'Тушь для ресниц', NULL, 5, NULL),
      (5, 'Солнцезащитный флюид SPF 50', 'lotion-outline', 14, NULL),
      (6, 'Пенка для умывания', 'pump', 22, NULL),
      (7, 'Успокаивающая маска', NULL, 30, NULL),
      (8, 'Крем для рук', 'lotion-outline', 31, NULL),
      (9, 'Гель для душа', 'pump', 60, NULL),
      (10, 'Мицеллярная вода', 'bottle', 75, NULL),
      (11, 'Тональный крем', 'pump', 120, NULL),
      (12, 'Масло для волос', 'eyedropper', 365, NULL),
      (13, 'Крем для кожи вокруг глаз', NULL, -3, NULL),
      (14, 'Пилинг для лица', NULL, -18, NULL),
      (15, 'Карандаш для бровей', NULL, NULL, NULL),
      (16, 'Шампунь для объёма', 'bottle', 90, 3),
      (17, 'Матовая помада', 'lipstick', -20, 18),
      (18, 'Молочко для тела', 'lotion-outline', 5, 7),
      (19, 'Тоник для лица', 'bottle-tonic-outline', -35, 30),
      (20, 'Маска для волос', NULL, NULL, 45)
  )
  SELECT
    printf('bd32e7fd-c23d-4824-9cd5-%012d', id),
    name,
    '',
    icon_id,
    CASE WHEN expires_in_days IS NOT NULL THEN 'date' END,
    CASE WHEN expires_in_days IS NOT NULL THEN date('now', 'localtime', printf('%+d days', expires_in_days)) END,
    CASE WHEN archived_days_ago IS NOT NULL THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now', printf('-%d days', archived_days_ago)) END
  FROM samples;`,
  `INSERT OR IGNORE INTO products (
    id, name, note, icon_id, opened_on, pao_months, expiry_kind, expires_on,
    manufactured_on, shelf_duration, shelf_unit, archived_at, finished
  )
  WITH samples(
    id, name, note, icon_id, opened_days_ago, pao_months, expires_in_days,
    manufactured_days_ago, shelf_duration, shelf_unit, archived_days_ago, finished
  ) AS (
    VALUES
      (21, 'Масло для кутикулы', 'Срок считается от вскрытия.', 'eyedropper', 10, 6, NULL, NULL, NULL, NULL, NULL, 0),
      (22, 'Сыворотка с ретинолом', 'Срок после вскрытия истёк раньше срока на упаковке.', 'eyedropper', 120, 3, 180, NULL, NULL, NULL, NULL, 0),
      (23, 'Свежая маска для лица', '', NULL, NULL, NULL, NULL, 10, 14, 'days', NULL, 0),
      (24, 'Гидролат розы', '', 'spray-bottle', NULL, NULL, NULL, 45, 3, 'months', NULL, 0),
      (25, 'Парфюмерная вода', '', 'perfume', NULL, NULL, NULL, 180, 2, 'years', NULL, 0),
      (26, 'Термальная вода', 'Вскрыта, срок после вскрытия не указан.', 'spray', 7, NULL, 150, NULL, NULL, NULL, NULL, 0),
      (27, 'Очищающий гель', '', 'pump', 45, 6, 120, NULL, NULL, NULL, NULL, 1),
      (28, 'Увлажняющая помада', '', 'lipstick', 120, 12, 365, NULL, NULL, NULL, 5, 1),
      (29, 'Сыворотка с ниацинамидом', 'Ещё запечатана. После вскрытия использовать в течение 6 месяцев.', 'eyedropper', NULL, 6, NULL, NULL, NULL, NULL, NULL, 0),
      (30, 'Крем для ног', 'Срок на упаковке истекает раньше срока после вскрытия.', 'lotion-outline', 7, 12, 15, NULL, NULL, NULL, NULL, 0)
  )
  SELECT
    printf('bd32e7fd-c23d-4824-9cd5-%012d', id), name, note, icon_id,
    CASE WHEN opened_days_ago IS NOT NULL THEN date('now', 'localtime', printf('-%d days', opened_days_ago)) END,
    pao_months,
    CASE WHEN expires_in_days IS NOT NULL THEN 'date' WHEN shelf_duration IS NOT NULL THEN 'shelfLife' END,
    CASE WHEN expires_in_days IS NOT NULL THEN date('now', 'localtime', printf('%+d days', expires_in_days)) END,
    CASE WHEN manufactured_days_ago IS NOT NULL THEN date('now', 'localtime', printf('-%d days', manufactured_days_ago)) END,
    shelf_duration, shelf_unit,
    CASE WHEN archived_days_ago IS NOT NULL THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now', printf('-%d days', archived_days_ago)) END,
    finished
  FROM samples;`,
]
