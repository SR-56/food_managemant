# ADR-0010: レシピ管理の設計方針

## Status

Accepted

## Context

レシピ管理APIの実装にあたり、以下の設計を決定する必要があった。

- レシピ削除の方式（物理削除 vs ソフトデリート）
- レシピ編集時の食材選択ソース（`inventory` vs `ingredients`）
- `recipe_ingredients` の更新方式

## Decision Drivers

- 過去の献立データ（`meal_plans`）が壊れないこと
- レシピ編集時の食材選択が直感的であること
- 実装がシンプルで保守しやすいこと

## Considered Options

**レシピ削除の方式：**
- A. 物理削除（`DELETE FROM recipes`）
- **B. ソフトデリート（`deleted_at` をセット）（採用）**

**食材選択ソース：**
- A. `inventory`（家庭が在庫管理している食材のみ）
- **B. `ingredients`（グローバルマスタ＋家庭専用食材の全件）（採用）**

**`recipe_ingredients` の更新方式：**
- A. 差分更新（追加分INSERTと削除分DELETEを個別に計算）
- **B. 全削除→再INSERT（採用）**

## Decision

### レシピ削除：ソフトデリート

`meal_plans.recipe_id` が `recipes.id` を参照しているため、物理削除すると過去の献立データが壊れる。
`deleted_at` に日時をセットするソフトデリートを採用し、レシピ一覧取得時は `deleted_at IS NULL` で絞り込む。

### 食材選択ソース：`ingredients` テーブル

レシピに「使う食材」を登録する際、在庫の有無は関係ない。
むしろ「在庫にない食材を使うレシピ」を登録することで、買い物リスト生成（Issue #27）の入力として機能する。

`inventory` を使うと「在庫に追加していない食材はレシピに入れられない」という制約が生まれ、ユーザー体験を損なう。

`GET /api/ingredients` は `ingredients` テーブルから全件取得し、`inventory` とのLEFT JOINで在庫状態（`inStock`）を付加して返す。これによりレシピ詳細画面で各食材の在庫状態も表示できる。

### `recipe_ingredients` の更新：全削除→再INSERT

差分更新は実装が複雑で、バグが入り込みやすい。`recipe_ingredients` は軽量なレコード（recipe_id + ingredient_id のみ）のため、全削除→再INSERTのコストは無視できる。

## Consequences

**Positive:**
- 過去の献立データが削除されたレシピを参照しても整合性が保たれる
- レシピ編集時に在庫に関係なく任意の食材を選択できる
- `recipe_ingredients` の更新ロジックがシンプル

**Negative:**
- ソフトデリートのため `recipes` テーブルにデータが残り続ける（将来的に物理削除のバッチが必要になる可能性）
- `GET /api/ingredients` は admin クライアントを使用（Issue #82 の対象）
- 現在の食材コピペ解析（`recipe-parser.ts`）は文字列一致のみで表記揺れ（ひらがな・カタカナ等）に対応していない。Issue #73（Claude API連携）で意味的な解析・マスタ照合に置き換える予定
