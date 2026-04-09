# ADR-0003: ホスティング・環境構成の設計

## Status
Accepted

## Context

MVPリリースに向けて、Next.jsアプリのデプロイ先と環境ごとのDB接続先を決定する必要があった。

また、ローカル・Preview・Productの3環境が必要になる一方、Supabase無料枠は2プロジェクトまでという制約がある。

## Decision Drivers

- MVPフェーズは無料枠・低コストで運用できること
- next.js / Supabase との親和性が高いこと
- PRごとにPreview環境で動作確認できること
- Supabase無料枠(2プロジェクトまで)の制約内に収めること

## Considered Options

**ホスティング**
- Vercel (Next.js開発元。ゼロコンフィグ・無料枠あり)
- Render (シンプルなPaaS。無料枠あるがスリープあり)
- Fly.io (コンテナベース)
- AWS Amplify (AWSエコシステム。初期設定が複雑)

**Supabase環境の分離**
- ローカル・Preview・Productionそれぞれにクラウドプロジェクトを用意 (3プロジェクト必要。無料枠オーバー)
- ローカルはSupabase CLIのローカル環境を使い、クラウドプロジェクトはPreview用・Production用の2つのみ

## Decision

### ホスティング

**Vercelを採用する。**

Next.jsとの親和性が最も高く、PRごとのPreview環境自動生成・Supabaseとの連携実績・無料枠の充実度において他候補よりも優位。

### Supabase環境の分離

**ローカルはSupabase CLIのローカル環境を使い、クラウドプロジェクトはPreview用・Production用の2つのみとする。**

Supabase無料枠(2プロジェクトまで)の制約内に収めるため、ローカル開発にはSupabase CLI(内部でDockerを使用)を使用する。

```
ローカル開発 -> Supabase CLI (localhost:54321 / Dockerで起動)
Preview(PR時) -> Supabase プロジェクトA (開発/検証用)
Production -> Supabase プロジェクトB (本番用)
```

| 環境 | 接続先 | 環境変数の管理 |
|------|-------|---------------|
| ローカル | `localhost:54321`(CLI起動) | `.env.local` |
| Preview | Supabase プロジェクトA | Vercel環境変数 (Preview) |
| Produciton | Supabase プロジェクトB | Vercel環境変数 (Production) |

主な環境変数:

| 変数名 | 用途 | 備考 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase接続URL | 環境ごとに切り替え |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | 環境ごとに切り替え |
| `ANTHROPIC_API_KEY` | Claude API認証キー | サーバーサイドのみ。クライアントに露出させない |

`ANTHROPIC_API_KEY` はNext.jsのAPI Route（サーバーサイド）でのみ参照し、クライアントバンドルには含めない。

## Consequences

**Positive:**
- Vercel + Next.jsの組み合わせにより、デプロイ設定をほぼゼロコストで構築できる
- PRごとにPreview URLが自動生成されるため、本番に影響を与えずレビューと動作確認が可能
- Supabase CLIによるローカル開発により、クラウドプロジェクトを無料枠の範囲内に収められる

**Negative:**
- ローカル開発にSupabase CLIとDockerのセットアップが必要
- Vercel無料プランはサーバーレス関数の実行時間制限が10秒。Claude APIの食材解析リクエストは通常2〜5秒で完了する想定のため、MVPではこの制限を許容する。タイムアウトが頻発する場合はVercel Proへの移行（$20/月）を検討する
- Supabase無料プロジェクトは7日間非アクティブでポーズされるため、本番運用時は有料プランへの移行を検討する必要がある
- Supabase無料枠はDB容量500MB・月間アクティブユーザー50,000・ストレージ1GBの制約があるが、MVP規模では問題ない想定
