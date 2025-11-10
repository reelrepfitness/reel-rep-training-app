-- SQL code to populate the achievements table in Supabase
-- This matches the new table schema with catagory field

-- Clear existing data (optional - remove if you want to keep existing data)
-- DELETE FROM public.achievements;

-- Insert achievements data
INSERT INTO public.achievements (name, name_hebrew, catagory, description_hebrew, icon, task_requirement, points, task_type, is_active)
VALUES
  ('All with 56kg', 'כולה 56 קילו', 'Challenges', 'אימון שלם רק עם ה-56 ק"ג', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179887/21_zwkcef.png', 1, 100, 'total_weight', true),
  ('Wait, what now?', 'רגע, אז מה עכשיו?', 'Challenges', 'אימון ה-1000 חזרות | לסיים בפחות מ30 דקות', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179892/7_hgw4f6.png', 1, 2000, 'challenge', true),
  ('Commendable, but can do less', 'ראוי לשבח, אבל אפשר בפחות.', 'Challenges', 'אימון ה-1000 חזרות | לסיים בפחות מ40 דקות', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179891/6_iaip5g.png', 1, 1000, 'challenge', true),
  ('On the edge, but not bad', 'על הקשקש, אבל לא רע', 'Challenges', 'אימון ה-1000 חזרות | לסיים בפחות מ60 דקות', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179893/9_lzwaiz.png', 1, 300, 'challenge', true),
  ('I''m in with you on rent', 'אני נכנס איתך בשכירות', 'Discipline', '5 אימונים בשבוע - למשך שלושה חודשים.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179902/12_dqwyuf.png', 1, 2000, 'disapline', true),
  ('It was hard, but worth it', 'זה היה קשה, אבל שווה את זה', 'Challenges', 'להרשים את איוון.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179894/10_afrvsw.png', 1, 2000, 'challenge', true),
  ('We are here for the experience?', 'אנחנו כאן בשביל החוויה?', 'Challenges', 'לחוות את אימון ה-"1000 חזרות"', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179896/8_aw5q0o.png', 1, 100, 'challenge', true),
  ('1000? Wow, impressed', '1000? וואלה טיפה התרשמתי', 'Attendance', 'השתתפות ב-1000 אימונים.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179900/14_lyehgm.png', 1000, 1000, 'classes_attended', true),
  ('800 is nice, but not 1000', '800 זה יפה, אבל זה לא 1000.', 'Attendance', 'השתתפות ב-800 אימונים.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179901/15_unscwa.png', 800, 800, 'classes_attended', true),
  ('Boom, boom, crash', 'בום, בום, טראח', 'Challenges', 'ביצוע 50 הטחות - בדקה.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179882/20_vpgvfo.png', 1, 200, 'challenge', true),
  ('Didn''t make it? You''re late', 'לא הקדמת? איחרת.', 'Discipline', '0 איחורים', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179889/5_v4cxzb.png', 1, 1000, 'disapline', true),
  ('My dad did 600 in a month', 'אבא שלי עשה 600 בחודש.', 'Attendance', 'השתתפות ב-600 אימונים.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179903/16_y1vflh.png', 600, 600, 'classes_attended', true),
  ('400 is good, but not enough', '400 זה טוב, אבל לא מספיק.', 'Attendance', 'השתתפות ב-400 אימונים.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179881/18_y5acwv.png', 400, 400, 'classes_attended', true),
  ('That''s it? Only 200?', 'זהו? רק 200?', 'Attendance', 'השתתפות ב-200 אימונים.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179905/17_kz7sh4.png', 200, 200, 'classes_attended', true),
  ('Just 100 workouts', 'כולה 100 אימונים', 'Attendance', 'השתתפות ב- 100 אימונים', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179882/19_olyugl.png', 100, 100, 'classes_attended', true),
  ('I''ll just sleep here', 'אני כבר אשאר לישון פה', 'Discipline', '5 אימונים בשבוע - למשך חודש.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179899/13_zoq3sd.png', 1, 600, 'disapline', true),
  ('Rest day? Don''t know it', 'יום מנוחה? לא מכיר.', 'Discipline', '5 אימונים בשבוע - למשך שבועיים.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179897/11_pddakv.png', 1, 250, 'disapline', true);

-- Create indexes for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_achievements_task_type ON public.achievements(task_type);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON public.achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_achievements_points ON public.achievements(points);
