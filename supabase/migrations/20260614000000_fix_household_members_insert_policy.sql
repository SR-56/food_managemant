-- household_members INSERT ポリシーを単純化
-- NOT EXISTS でhousehold_membersを直接参照すると再帰的RLS評価が発生するため削除
-- 初回家庭作成・メンバー追加はサーバーサイドでadminクライアントを使用し、RLSをバイパスする
DROP POLICY "household_members: 追加" ON household_members;
CREATE POLICY "household_members: 追加" ON household_members
  FOR INSERT WITH CHECK (
    household_id IN (SELECT get_my_household_ids())
  );
