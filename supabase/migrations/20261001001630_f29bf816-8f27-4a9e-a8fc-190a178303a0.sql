UPDATE public.book_chapters
SET total_verses = 31,
    updated_at = now()
WHERE id = '48085352-6fd8-4b10-a0f1-b5664f92f4e0'
  AND chapter_number = 1;

WITH ordered AS (
  SELECT id,
         row_number() OVER (
           ORDER BY
             CASE WHEN chapter_id = '48085352-6fd8-4b10-a0f1-b5664f92f4e0' THEN 0 ELSE 1 END,
             order_index,
             created_at,
             id
         ) AS new_order
  FROM public.lessons
  WHERE module_id = '718bae70-f0ca-410b-b778-c3204d76e9d6'
)
UPDATE public.lessons AS lesson
SET order_index = ordered.new_order,
    updated_at = now()
FROM ordered
WHERE lesson.id = ordered.id
  AND lesson.order_index IS DISTINCT FROM ordered.new_order;