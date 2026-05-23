-- ============================================================
-- RLSポリシー修正
-- ============================================================

-- 1. household_members INSERT: 初回家庭作成時のchicken-and-egg問題を解消
--    既存の家庭に追加する場合 OR 初めてownerとして参加する場合を許可
DROP POLICY "household_members: 追加" ON household_members;
CREATE POLICY "household_members: 追加" ON household_members
  FOR INSERT WITH CHECK (
    household_id IN (SELECT get_my_household_ids())
    OR (
      role = 'owner'
      AND NOT EXISTS (
        SELECT 1 FROM household_members
        WHERE user_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

-- 2. users SELECT: 同じ家庭のメンバー同士でユーザー情報を参照できるよう拡張
DROP POLICY "users: 自分のみ参照" ON users;
CREATE POLICY "users: 自分または同家庭メンバー参照" ON users
  FOR SELECT USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id FROM household_members
      WHERE household_id IN (SELECT get_my_household_ids())
      AND deleted_at IS NULL
    )
  );
