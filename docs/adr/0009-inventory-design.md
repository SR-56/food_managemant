# ADR-0009: 在庫管理の設計方針

## Status

Accepted

## Context

在庫管理APIの実装にあたり、以下の設計を決定する必要があった。

- 在庫一覧の表示データソース（`ingredients` vs `inventory`）
- 新規家庭作成時の初期在庫データの扱い
- 食材の追加・削除の挙動
- グローバルマスタ食材と家庭専用食材の使い分け

## Decision Drivers

- ユーザーがログイン直後から食材一覧を操作できること
- データモデルが一貫していること（表示・更新・削除の対象が同じ）
- 将来的に家庭作成の経路が増えても（招待リンク等）、初期化処理が漏れないこと
- adminクライアントの使用範囲を最小化すること

## Considered Options

**在庫一覧の表示方法：**
- A. `ingredients` テーブルとの JOIN で表示（inventoryレコードがない食材も表示）
- **B. 常に `inventory` テーブルから取得（採用）**

**初回在庫セットアップ：**
- A. `auth/callback` でグローバルマスタを `inventory` にINSERT（adminクライアント）
- **B. DBトリガーで自動実行（採用）**

## Decision

### 在庫データモデル

在庫画面は常に `inventory` テーブル（`household_id` で絞り込み）を表示する。

新規家庭作成時（`households` INSERT）に DBトリガーが自動発火し、グローバルマスタ食材（`household_id IS NULL` の `ingredients`）全件を `inventory` にINSERT（`in_stock = false`）する。

これにより、どの経路で家庭が作成されても（auth/callback・将来の招待リンク等）初期化処理が保証される。

### 各操作の挙動

| 操作 | 処理 |
|------|------|
| 在庫一覧表示 | `inventory` を `household_id` で取得 |
| in_stockトグル | `inventory.in_stock` をUPDATE |
| 食材追加 | グローバルマスタを名前検索 → 存在すれば `inventory` にINSERT、存在しなければ家庭専用 `ingredients` を作成してから `inventory` にINSERT |
| 削除 | `inventory` レコードをDELETE。家庭専用食材（`household_id` あり）の場合は `ingredients` も削除 |
| 削除後の再追加 | 追加ダイアログの名前検索でグローバルマスタから再追加可能 |

### 初回セットアップにDBトリガーを採用した理由

| 観点 | auth/callback（不採用） | DBトリガー（採用） |
|------|------------------------|-------------------|
| メンテナンス性 | 家庭作成の経路が増えるたびにコード修正が必要 | 経路に関係なく自動実行 |
| セキュリティ | adminクライアントの使用範囲が広がる | SECURITY DEFINERで実行、adminクライアント不要 |
| 確実性 | コードのバグで失敗する可能性 | DBレベルで保証 |
| ロジックの所在 | アプリコードとDBに分散 | DBに集約 |

## Consequences

**Positive:**
- 在庫画面は常に `inventory` のみを参照するためシンプル
- 家庭作成の経路が増えても初期化処理が自動保証される
- adminクライアントの使用箇所が増えない

**Negative:**
- 新規家庭作成時にグローバルマスタ件数分のINSERTが発生する（現在70件）
- グローバルマスタに食材を追加した場合、既存家庭のinventoryには反映されない（別途対応が必要）
- DBトリガーの実装はSupabase SQL Editorでの手動実行が必要
