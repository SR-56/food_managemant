# ADR-0005: バックエンド接続・LP追加前のコード構造整理方針

## Status

Accepted

## Context

Supabase接続とLP（ランディングページ）追加を控え、現状のコード構造を調査した結果、以下の問題が確認された。

- 型定義とモックデータが同一ファイル（`lib/mock-data.ts`）に混在しており、Supabase移行時に型のみの参照ができない
- 各スクリーンが`mock-data.ts`を直接importしており、API接続への切り替え時に全画面ファイルの修正が必要になる
- `app/page.tsx`がSPAとして全体を管理しており、LPとアプリで認証・レイアウトを分けられない
- `recipe-screen.tsx`(672行)がリスト・詳細・編集ビューとパースロジックを単一ファイルに持っており、Claude API接続時の影響範囲が広い
- カテゴリ定義が複数スクリーンに重複しており、変更時に漏れが生じやすい

これらを放置したままバックエンド接続を進めると、回収コストが大きくなると判断し、事前に整理方針を決定する。

## Decision Drivers

- Supabase接続時の改修範囲を最小化する
- LP追加時にルーティング・認証の大規模な書き換えが不要であること
- モックデータからAPI呼び出しへの切り替えを画面コンポーネントに影響させない

## Considered Options

**型定義の管理**
- `lib/mock-data.ts`に型定義とモックデータを共存させる（現状維持）
- `lib/types.ts`に型定義を分離し、`mock-data.ts`はデータのみにする

**データ取得の抽象化**
- 各スクリーンが直接`mock-data.ts`をimportする（現状維持）
- `lib/api`にエンティティごとのAPI関数を置き、スクリーンにはそこ経由でデータを取得する
- カスタムフック(`hooks/use-recipes.ts`など)にデータ取得ロジックをまとめる

**ルーティング構造**
- `app/page.tsx`が全画面管理するSPA（現状維持）
- 画面ごとにURLを持つページベースルーティングに移行する
- 画面ごとのURLに加えてルートグループ(`(marketing)` / `app`)でレイアウトを分離する

**`recipe-screen.tsx`の分離**
- 672行を単一ファイルで維持する（現状維持）
- パースロジックのみ分離し、ビュー分割は見送る
- パースロジックとビューをすべてファイル分割する

## Decision

### 型定義の分離

**`lib/types.ts`を新設し、型定義を`mock-data.ts`から分離する。**

Supabase接続後、DBスキーマから生成される型と照合・統合しやすくなる。

```
lib/
├── types.ts        <- 型定義のみ（新規）
├── mock-data.ts    <- データのみ（tyeps.tsからimport）
└── utils.ts
```

型を参照している6ファイルのimport先を`mock-data.ts`から`types.ts`に置き換える。
`mock-data.ts`からの再エクスポートは行わない。

### APIへの抽象化レイヤーの導入

**`lib/api/`にエンティティごとのAPI関数を配置し、スクリーンはそこ経由でデータを取得する。**

スクリーンコンポーネントがデータ取得の詳細（モックか実APIか）を知らなくても済む構造にする。
Supabase接続時は`lib/api/`内の実装を差し替えるだけで済み、スクリーン側の改修を不要にする。

```
lib/
└── api/
    ├── clients.ts          <- Supabaseクライアント（接続時に実装）
    ├── ingredients.ts      <- 食材のCRUD関数
    ├── recipes.ts          <- レシピのCRUD関数
    ├── meal-plans.ts       <- 献立のCRUD関数
    └── shopping.ts         <- 買い物リストのCRUD関数
```

カスタムフック（`hooks/use-ingredients.ts`など）は`lib/api/`と同時に整備する。
フックの中身は`lib/api/`を呼んで状態に入れる処理になるため、`lib/api/`がない状態で先行で作っても意味が薄い。

### ルーティング構造の整備

**画面ごとにURLを持つページベースルーティングに移行し、ルートグループでレイアウトを分離する。**

現状はSPAとして`app/page.tsx`が全画面を管理しているため、ＵＲＬが変わらず画面遷移もブラウザバック不可。
各画面を独立したページに分離することで、URLの共有・ブラウザバックが自然に機能する。

ルートグループの`()`はURLに影響しない。`(app)/layout.tsx`1か所にヘッダー・BottomNav・認証チェックを集約することで、各ページへの重複記述を防ぐ。

```
app/
├── (marketing)/
│   ├── layout.tsx          <- LP用レイアウト（マーケティング向けヘッダー等）
│   ├── page.tsx            <- URL: / (ランディングページ)
│   └── login/
│       └── page.tsx        <- URL: /login
├── (app)/
│   ├── layout.tsx          <- アプリ共通レイアウト（ヘッダー・BottomNav・認証チェック）
│   ├── home/
│   │   └── page.tsx        <- URL: /home
│   ├── shopping-list/
│   │   └── page.tsx        <- URL: /shopping-list
│   ├── meal-plan/
│   │   └── page.tsx        <- URL: /meal-plan
│   ├── recipe/
│   │   └── page.tsx        <- URL: /recipe
│   ├── inventory/
│   │   └── page.tsx        <- URL: /inventory
│   └── settings/
│       └── page.tsx        <- URL: /settings
├── auth/
│   └── callback/
│       └── route.ts        <- Google OAuthコールバック（認証完了後にGoogleからリダイレクトされるエンドポイント。Supabaseのセッション確立後に/homeへリダイレクト）
├── api/
│   ├── recipes/
│   │   └── route.ts        <- URL: /api/recipes
└── layout.tsx              <- ルートレイアウト（フォント・メタデータ）
```

現在の`app/page.tsx`（SPA管理）は移行完了後に削除する。

### `recipe-screen.tsx`の分割

**パースロジックとビューをファイル分割する。**

672行の単一ファイルにリスト・詳細・編集の3ビューとパースロジックが混在しており、Claude API接続時の影響範囲が広い。
以下の校正に分割する。

```
lib/
└── recipe-parser.ts            <- テキストから食材を抽出するロジック

components/
└── screens/
    ├── recipe-screen.tsx       <- コンテナ（ビュー切り替えのみ）
    ├── recipe-list-view.tsx    <- レシピ一覧ビュー
    ├── recipe-detail-view.tsx  <- レシピ詳細ビュー
    └── recipe-edit-view.tsx    <- レシピ編集・登録ビュー
```

実装優先順位：
1. `lib/recipe-parser.ts`の分離（Claude API接続前に必須）
2. ビューのファイル分割（可読性向上・任意のタイミングで実施）

### カテゴリ定義の集約

**`lib/constants.ts`にカテゴリ定義を集約し、各スクリーンでの重複を除去する。**

現状、`shopping-list-screen.tsx:24`と`inventory-screen.tsx:53`に以下の同一配列が重複定義されている。

```ts
const categoryOrder: IngredientCategory[] = ["野菜", "肉類", "魚類", "調味料", "その他"]
```

カテゴリを追加・変更する際に複数ファイルを修正する必要があり、変更漏れが生じやすい。
`lib/constants.ts`に1箇所だけ定義し、各スクリーンがそこからimportする構成にする。

### その他

- `userMenu`を`components/user-menu.tsx`に分離する（`app/page.tsx`からの切り出し）
- `styles.globals.css`（未使用）を削除する

## Consequences

**Positive:**
- Supabase接続時の改修範囲を`lib/api/`内に限定できる
- LP追加時にルーティング・認証の大規模な書き換えが不要になる
- カテゴリ定義・型定義の変更漏れが低減する

**Negative:**
- バックエンド接続に一定の整理コストが発生する
- ルートグループへの移行時にVercelのリダイレクト設定が必要になる場合がある
