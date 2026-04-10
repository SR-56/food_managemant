# ADR-0006: データベース選定

## Status

Accepted

## Context

本アプリは以下の要件を持つ：

- Google OAuth によるユーザー認証
- household（世帯）単位のデータ分離（マルチテナント）
- リアルタイム同期の将来的な対応
- Next.js / TypeScript によるフロントエンド
- MVP 段階では無料枠内での開発・運用

これらを満たすデータベース／BaaS を選定する必要があった。

## Decision Drivers

- Google OAuth 連携が標準機能として利用できること
- household 単位の RLS（Row Level Security）を DB 層で実現できること
- Next.js / TypeScript との親和性が高く、ローカル開発環境が整備されていること
- MVP 段階で無料枠内に収まること
- 将来のスケールアップ・データ分析基盤への移行パスが確保されていること

## Considered Options

| 評価軸 | Supabase | Firebase Firestore | Neon | PlanetScale | Cloud SQL (GCP) | Aurora Serverless v2 (AWS) |
|--------|----------|--------------------|------|-------------|-----------------|----------------------------|
| **① 機能要件** | Google OAuth を Auth モジュールで標準対応。Realtime サブスクリプションあり | Google 製品のため Google Auth と完全統合。Realtime がネイティブ | Auth・Realtime は非搭載。別途実装が必要 | Auth・Realtime は非搭載。別途実装が必要 | Auth は非搭載。GCP の Identity Platform と組み合わせれば Google Auth 対応可。Realtime は非搭載 | Auth は非搭載。Cognito と組み合わせれば Google Auth 対応可。Realtime は非搭載 |
| **② 運用・スケール** | PostgreSQL ベース。RLS で household 単位のマルチテナントを DB 層で実現 | NoSQL のためスキーマレスで柔軟。Security Rules でテナント分離。スキーマ変更に強い | サーバーレス PostgreSQL。ブランチ機能でステージング環境管理が容易 | MySQL 互換。大規模スケールに強いが MVP 規模では過剰 | フルマネージド PostgreSQL / MySQL。GCP エコシステムとの親和性が高く、大規模運用に実績あり | PostgreSQL 互換のサーバーレス DB。トラフィックに応じて自動スケール。0 スケールも可能 |
| **③ 開発体験** | Next.js 向け SDK あり。CLI でローカル開発環境を構築可能。マイグレーションは SQL または Prisma で管理 | TypeScript SDK あり。NoSQL のためリレーショナルな設計と思想が異なりスキーマ管理が難しい | Vercel / Next.js との統合が優秀。標準 SQL + Prisma が使える | 2024年に無料プラン廃止。DX は良好だがコスト面で選択しにくい | 標準 SQL + Prisma 対応。ただし GCP コンソールの設定が煩雑で初期セットアップのコストが高い | 標準 SQL + Prisma 対応。AWS コンソール・IAM の設定が複雑で、小規模 MVP には過剰な学習コストがかかる |
| **④ コスト** | 無料枠: DB 500MB・2プロジェクト。非アクティブ時は1週間でポーズ | 無料枠: Spark プランで Firestore 1GB・Cloud Functions 一部利用可 | 無料枠: DB 0.5GB・コンピュートはポーズあり | **無料プランなし**（最低 $39/月〜） | **無料枠なし**。新規 GCP アカウントは $300 クレジットあり。最低でも数ドル/月〜 | **無料枠なし**。最低 $0.12/ACU-hour 〜。停止中も最小コストが発生する場合あり |
| **⑤ セキュリティ・RLS** | RLS がコア機能として組み込まれており、SQL ポリシーで household 単位のアクセス制御を DB 層で保証できる | Security Rules で制御可能だが、リレーショナルデータへの適用はアプリ層での補完が必要になる場面がある | PostgreSQL のため RLS を SQL で実装可能だが、管理 UI はなく手動運用 | RLS 非対応。アプリケーション層での制御に依存 | PostgreSQL のため RLS を SQL で実装可能。IAM との連携によるアクセス制御も可能だが設定が複雑 | PostgreSQL 互換のため RLS を SQL で実装可能。IAM・VPC 等との組み合わせで高度なセキュリティ構成が可能だが設定コストが高い |

## Decision

**Supabase を採用する。**

このアプリの要件（Google OAuth・household 単位の RLS・リアルタイム同期・Next.js）をほぼノーコストで満たせる唯一の選択肢。MVP 段階の無料枠内で開発・リリースまで対応できる。

### 採用の根拠

- Google OAuth が Auth モジュールで即利用可能
- RLS が標準機能として備わっており、household 単位のデータ分離を DB 層で保証できる
- Next.js 向け SDK と CLI によるローカル開発環境が整備されており、開発体験が良好
- 無料枠で MVP リリースまで賄える
- PostgreSQL の論理レプリケーションおよび Webhook 経由で BigQuery 等のデータウェアハウスへの ETL が可能なため、将来のデータ分析基盤への移行パスが確保されている

## Consequences

**Positive:**
- 認証・RLS・Realtime が統合されたプラットフォームで、認証・DB・リアルタイムを別々のサービスで管理する必要がない
- household 単位のアクセス制御を DB 層（RLS）で保証でき、アプリケーション層のバグによるデータ漏洩リスクを低減できる
- Supabase CLI によるローカル開発環境が整備されており、Preview / Production との環境差異を小さく保てる

**Negative:**
- 無料プロジェクトは **7日間非アクティブでポーズ**される（本番運用時は有料プランへの移行を検討）
- Realtime はオプション機能として利用可能だが、MVP では必須ではない
- Supabase 固有の機能（RLS・Auth）に依存するため、将来的な DB 乗り換えコストは高い
