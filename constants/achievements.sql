-- SQL code to create and populate the achievements table in Supabase

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_hebrew VARCHAR(255) NOT NULL,
  icon TEXT NOT NULL,
  description VARCHAR(500),
  description_hebrew VARCHAR(500) NOT NULL,
  task_requirement INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 0,
  task_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Insert achievements data
INSERT INTO achievements (name, name_hebrew, icon, description, description_hebrew, task_requirement, points, task_type, created_at, is_active)
VALUES
  ('All with 56kg', 'כולה 56 קילו', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179887/21_zwkcef.png', 'Challenges', 'אימון שלם רק עם ה-56 ק"ג', 1, 100, 'total_weight', '2025-09-29T21:39:10.789Z', true),
  ('Wait, what now?', 'רגע, אז מה עכשיו?', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179892/7_hgw4f6.png', 'Challenges', 'אימון ה-1000 חזרות | לסיים בפחות מ30 דקות', 1, 2000, 'challenge', '2025-09-29T21:34:48.781Z', true),
  ('Commendable, but can do less', 'ראוי לשבח, אבל אפשר בפחות.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179891/6_iaip5g.png', 'Challenges', 'אימון ה-1000 חזרות | לסיים בפחות מ40 דקות', 1, 1000, 'challenge', '2025-09-29T21:34:04.835Z', true),
  ('On the edge, but not bad', 'על הקשקש, אבל לא רע', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179893/9_lzwaiz.png', 'Challenges', 'אימון ה-1000 חזרות | לסיים בפחות מ60 דקות', 1, 300, 'challenge', '2025-09-29T21:32:56.817Z', true),
  ('I''m in with you on rent', 'אני נכנס איתך בשכירות', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179902/12_dqwyuf.png', 'Discipline', '5 אימונים בשבוע - למשך שלושה חודשים.', 1, 2000, 'disapline', '2025-09-29T21:29:48.135Z', true),
  ('It was hard, but worth it', 'זה היה קשה, אבל שווה את זה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179894/10_afrvsw.png', 'Challenges', 'להרשים את איוון.', 1, 2000, 'challenge', '2025-09-29T21:28:29.000Z', true),
  ('We are here for the experience?', 'אנחנו כאן בשביל החוויה?', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179896/8_aw5q0o.png', 'Challenges', 'לחוות את אימון ה-"1000 חזרות"', 1, 100, 'challenge', '2025-09-29T21:27:31.798Z', true),
  ('1000? Wow, impressed', '1000? וואלה טיפה התרשמתי', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179900/14_lyehgm.png', 'Attendance', 'השתתפות ב-1000 אימונים.', 1000, 1000, 'classes_attended', '2025-09-29T21:25:59.147Z', true),
  ('800 is nice, but not 1000', '800 זה יפה, אבל זה לא 1000.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179901/15_unscwa.png', 'Attendance', 'השתתפות ב-800 אימונים.', 800, 800, 'classes_attended', '2025-09-29T21:24:52.159Z', true),
  ('Boom, boom, crash', 'בום, בום, טראח', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179882/20_vpgvfo.png', 'Challenges', 'ביצוע 50 הטחות - בדקה.', 1, 200, 'challenge', '2025-09-29T21:21:45.417Z', true),
  ('Didn''t make it? You''re late', 'לא הקדמת? איחרת.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179889/5_v4cxzb.png', 'Discipline', '0 איחורים', 1, 1000, 'disapline', '2025-09-29T21:20:57.502Z', true),
  ('My dad did 600 in a month', 'אבא שלי עשה 600 בחודש.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179903/16_y1vflh.png', 'Attendance', 'השתתפות ב-600 אימונים.', 600, 600, 'classes_attended', '2025-09-29T21:19:00.657Z', true),
  ('400 is good, but not enough', '400 זה טוב, אבל לא מספיק.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179881/18_y5acwv.png', 'Attendance', 'השתתפות ב-400 אימונים.', 400, 400, 'classes_attended', '2025-09-29T21:17:21.260Z', true),
  ('That''s it? Only 200?', 'זהו? רק 200?', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179905/17_kz7sh4.png', 'Attendance', 'השתתפות ב-200 אימונים.', 200, 200, 'classes_attended', '2025-09-29T21:15:38.370Z', true),
  ('Just 100 workouts', 'כולה 100 אימונים', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179882/19_olyugl.png', 'Attendance', 'השתתפות ב- 100 אימונים', 100, 100, 'classes_attended', '2025-09-29T21:14:26.846Z', true),
  ('I''ll just sleep here', 'אני כבר אשאר לישון פה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179899/13_zoq3sd.png', 'Discipline', '5 אימונים בשבוע - למשך חודש.', 1, 600, 'disapline', '2025-09-28T23:25:21.635Z', true),
  ('Rest day? Don''t know it', 'יום מנוחה? לא מכיר.', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1759179897/11_pddakv.png', 'Discipline', '5 אימונים בשבוע - למשך שבועיים.', 1, 250, 'disapline', '2025-09-28T23:19:22.664Z', true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_achievements_task_type ON achievements(task_type);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_achievements_points ON achievements(points);

-- Optional: Create user_achievements junction table to track user progress
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);
