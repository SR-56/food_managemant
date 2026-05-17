# ADR-0007: 認証方式の選定

## Status

Accepted

## Context

FooCoはGoogle OAuthによるソーシャルログインを仕様として採用している。
認証ライブラリの選定にあたり、NextAuth.js（Auth.js）とSupabase Auth（組み込み）の2つを比較検討した。
インフラとしてSupabaseをすでに採用しているため、認証基盤の統合度が重要な判断軸となった。

## Decision Drivers

- Supabaseをデータベース・バックエンドとしてすでに採用している
- セッション管理をSupabaseのJWT・RLSと連携させたい
- 追加ライブラリを最小限に抑えたい
- `@supabase/ssr` によるサーバーサイドセッション管理が利用可能

## Considered Options

- **A. Supabase Auth（採用）**: Supabase組み込みの認証機能。`@supabase/ssr`でSSR対応。
- **B. NextAuth.js（Auth.js）**: Next.js向け汎用認証ライブラリ。多プロバイダー対応が強み。

## Decision

**Supabase Auth** を採用する。

実装方針：
- `supabase.auth.signInWithOAuth({ provider: "google" })` でGoogleログインを開始
- `/auth/callback` ルートでコード交換（PKCE）を処理し、`public.users` へupsert
- `middleware.ts` でセッション検証・リフレッシュおよび未認証時の `/login` リダイレクトを実装
- ログアウトは `supabase.auth.signOut()` で処理

## Consequences

**Positive:**
- Supabase RLSの `auth.uid()` がそのまま使えるため、認証とデータアクセス制御が一体化する
- 追加ライブラリ不要（`@supabase/ssr` は既導入済み）
- セッションクッキーの管理がSupabase SSRで自動化される

**Negative:**
- Supabase以外の認証プロバイダーへの切り替えコストが高くなる
- NextAuth.jsに比べてコールバック処理（PKCEフロー）を自前で実装する必要がある
