-- ============================================================
-- Initial Schema Migration
-- Based on docs/DB_SCHEMA.md
-- ============================================================

-- ============================================================
-- ユーザー関連テーブル
-- ============================================================

CREATE TABLE users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id  TEXT NOT NULL UNIQUE,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
COMMENT ON COLUMN users.google_id IS 'Google OAuth の sub クレーム';
COMMENT ON COLUMN users.deleted_at IS 'NULL: 有効';

CREATE TABLE households (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  shopping_day SMALLINT NOT NULL DEFAULT 6 CHECK (shopping_day BETWEEN 0 AND 6),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);
COMMENT ON COLUMN households.shopping_day IS '0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土';
COMMENT ON COLUMN households.deleted_at IS 'NULL: 有効';

CREATE TABLE household_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id),
  household_id UUID NOT NULL REFERENCES households(id),
  role         TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);
COMMENT ON COLUMN household_members.deleted_at IS 'NULL: 在籍中';

-- ============================================================
-- 食材・在庫関連テーブル
-- ============================================================

CREATE TABLE ingredients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id),  -- NULL: グローバルマスタ
  name         TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('野菜', '肉類', '魚類', '調味料', 'その他')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON COLUMN ingredients.household_id IS 'NULL: グローバルマスタ（全家庭共有）, 値あり: 家庭専用食材';

CREATE TABLE inventory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  in_stock      BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, ingredient_id)
);

-- ============================================================
-- レシピ関連テーブル
-- ============================================================

CREATE TABLE recipes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  name         TEXT NOT NULL,
  url          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);
COMMENT ON COLUMN recipes.deleted_at IS 'NULL: 有効';

CREATE TABLE recipe_ingredients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  UNIQUE (recipe_id, ingredient_id)
);

-- ============================================================
-- 献立関連テーブル
-- ============================================================

CREATE TABLE meal_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  recipe_id    UUID REFERENCES recipes(id),  -- NULL許容: 献立未設定
  date         DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  UNIQUE (household_id, date)
);
COMMENT ON COLUMN meal_plans.recipe_id IS 'NULL: 献立未設定';
COMMENT ON COLUMN meal_plans.deleted_at IS 'NULL: 有効';

-- ============================================================
-- ログ関連テーブル
-- ============================================================

CREATE TABLE activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  user_id      UUID NOT NULL REFERENCES users(id),
  event_type   TEXT NOT NULL,
  payload      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON COLUMN activity_logs.event_type IS 'inventory_updated | recipe_created | recipe_updated | recipe_deleted | meal_plan_updated | meal_completed | shopping_completed';

-- ============================================================
-- RLS（Row Level Security）
-- ============================================================

-- 全テーブルで RLS を有効化
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE households          ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs       ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数: 現在のユーザーが所属する household_id 一覧を返す
CREATE OR REPLACE FUNCTION get_my_household_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid()
    AND deleted_at IS NULL
$$;

-- users: 自分のレコードのみ参照・更新可能
CREATE POLICY "users: 自分のみ参照" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users: 自分のみ更新" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users: 登録" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- households: 所属する家庭のみ参照・更新可能
CREATE POLICY "households: 所属家庭のみ参照" ON households
  FOR SELECT USING (id IN (SELECT get_my_household_ids()));

CREATE POLICY "households: 所属家庭のみ更新" ON households
  FOR UPDATE USING (id IN (SELECT get_my_household_ids()));

CREATE POLICY "households: 作成" ON households
  FOR INSERT WITH CHECK (TRUE);

-- household_members: 同じ家庭のメンバーのみ参照可能
CREATE POLICY "household_members: 同家庭のみ参照" ON household_members
  FOR SELECT USING (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "household_members: 追加" ON household_members
  FOR INSERT WITH CHECK (household_id IN (SELECT get_my_household_ids()));

-- ingredients: グローバルマスタは全員参照可。家庭専用は自家庭のみ
CREATE POLICY "ingredients: グローバルマスタ参照" ON ingredients
  FOR SELECT USING (
    household_id IS NULL
    OR household_id IN (SELECT get_my_household_ids())
  );

CREATE POLICY "ingredients: 家庭専用食材の追加" ON ingredients
  FOR INSERT WITH CHECK (
    household_id IN (SELECT get_my_household_ids())
  );

-- inventory: 自家庭のみ
CREATE POLICY "inventory: 自家庭のみ参照" ON inventory
  FOR SELECT USING (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "inventory: 自家庭のみ追加" ON inventory
  FOR INSERT WITH CHECK (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "inventory: 自家庭のみ更新" ON inventory
  FOR UPDATE USING (household_id IN (SELECT get_my_household_ids()));

-- recipes: 自家庭のみ
CREATE POLICY "recipes: 自家庭のみ参照" ON recipes
  FOR SELECT USING (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "recipes: 自家庭のみ追加" ON recipes
  FOR INSERT WITH CHECK (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "recipes: 自家庭のみ更新" ON recipes
  FOR UPDATE USING (household_id IN (SELECT get_my_household_ids()));

-- recipe_ingredients: レシピ経由で自家庭のみ
CREATE POLICY "recipe_ingredients: 自家庭のみ参照" ON recipe_ingredients
  FOR SELECT USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE household_id IN (SELECT get_my_household_ids())
    )
  );

CREATE POLICY "recipe_ingredients: 自家庭のみ追加" ON recipe_ingredients
  FOR INSERT WITH CHECK (
    recipe_id IN (
      SELECT id FROM recipes WHERE household_id IN (SELECT get_my_household_ids())
    )
  );

CREATE POLICY "recipe_ingredients: 自家庭のみ削除" ON recipe_ingredients
  FOR DELETE USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE household_id IN (SELECT get_my_household_ids())
    )
  );

-- meal_plans: 自家庭のみ
CREATE POLICY "meal_plans: 自家庭のみ参照" ON meal_plans
  FOR SELECT USING (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "meal_plans: 自家庭のみ追加" ON meal_plans
  FOR INSERT WITH CHECK (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "meal_plans: 自家庭のみ更新" ON meal_plans
  FOR UPDATE USING (household_id IN (SELECT get_my_household_ids()));

-- activity_logs: 自家庭のみ参照・追加
CREATE POLICY "activity_logs: 自家庭のみ参照" ON activity_logs
  FOR SELECT USING (household_id IN (SELECT get_my_household_ids()));

CREATE POLICY "activity_logs: 自家庭のみ追加" ON activity_logs
  FOR INSERT WITH CHECK (
    household_id IN (SELECT get_my_household_ids())
    AND user_id = auth.uid()
  );
