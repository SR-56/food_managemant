# 認証ガイド

## 概要

FooCo は **Supabase Auth + Google OAuth** を認証基盤として採用している。
NextAuth.js などの追加ライブラリは使用せず、`@supabase/ssr` のみで実装している。

採用理由の詳細は [ADR-0007](./adr/0007-authentication.md) を参照。

---

## 認証フロー

```
1. ユーザーが「Google でログイン」をクリック
         ↓
2. Supabase が Google の認証ページへリダイレクト
         ↓
3. Google ログイン完了 → Supabase の /auth/v1/callback へ戻る
         ↓
4. Supabase が auth.users にレコードを INSERT（初回のみ）
         ↓
5. DBトリガー on_auth_user_created が発火し public.users に INSERT
         ↓
6. アプリの /auth/callback でコード交換（PKCE）→ Cookie にセッションをセット
         ↓
7. /home へリダイレクト
```

### PKCE（認証コードフロー）

Google からのコールバックには一時的な `code` パラメータが含まれる。
`supabase.auth.exchangeCodeForSession(code)` を呼ぶことで、Supabase サーバーが
Google のトークンエンドポイントと通信し、セッション（JWT）を発行してブラウザの Cookie にセットする。

`code` を直接使わずサーバー経由で交換するのは、URL が漏洩してもトークンに変換できないようにするためのセキュリティ上の措置。

---

## ルート保護

`middleware.ts` が全リクエストをインターセプトし、未ログイン時は `/login` へリダイレクトする。

```
公開ルート（認証不要）
  /
  /login
  /auth/*

保護ルート（要ログイン）
  /home
  /inventory
  /meal-plan
  /recipe
  /shopping-list
  /settings
  その他すべて
```

---

## ユーザーデータの二層構造

| テーブル | 管理者 | 用途 |
|----------|--------|------|
| `auth.users` | Supabase（内部） | 認証情報（メール、プロバイダー情報） |
| `public.users` | アプリ | アプリ固有のユーザー情報（家庭との紐付け等） |

`auth.users` は Supabase が管理する内部テーブルのため、アプリから直接編集しない。
アプリが必要な情報は `public.users` に持つ。

### 同期の仕組み

初回ログイン時に `auth.users` への INSERT をトリガー（`on_auth_user_created`）が検知し、
`public.users` へ自動的にレコードを作成する。トリガーは `SECURITY DEFINER` で実行されるため RLS をバイパスする。

---

## Google Cloud Console の設定

### テストモード（開発環境）

現在はテストモードで動作しており、テストユーザーとして登録したGoogleアカウントのみログイン可能。

テストユーザーの追加：
1. [Google Cloud Console](https://console.cloud.google.com) → 対象プロジェクトを選択
2. **Google Auth Platform → 対象 → Add users**
3. 追加したいGoogleアカウントのメールアドレスを入力して保存

### 本番公開時

本番リリース時は Google の審査を経てアプリを公開する必要がある。
審査通過後は任意のGoogleアカウントでログイン可能になる。

審査に必要なもの：
- プライバシーポリシーの URL
- アプリのホームページ URL
- アプリの説明・スクリーンショット

---

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の公開キー |

Google OAuth の Client ID / Client Secret は Supabase Dashboard で管理するため、
アプリの環境変数には不要。

---

## 関連ファイル

| ファイル | 役割 |
|----------|------|
| `middleware.ts` | セッション検証・未認証リダイレクト |
| `app/auth/callback/route.ts` | PKCE コード交換 |
| `components/screens/login-screen.tsx` | ログイン UI・OAuth 開始 |
| `lib/supabase/client.ts` | ブラウザ用 Supabase クライアント |
| `lib/supabase/server.ts` | サーバー用 Supabase クライアント |
| `supabase/migrations/20260417000000_add_user_sync_trigger.sql` | ユーザー同期トリガー |
