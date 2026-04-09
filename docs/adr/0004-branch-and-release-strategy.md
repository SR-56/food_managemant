# ADR-0004: ブランチ戦略・リリース運用の設計

## Status

Accepted

## Context

MVPリリースに向けて、開発フローと本番デプロイの運用方針を決定する必要があった。
また、リリースのバージョン管理と変更履歴の記録方法についても合わせて決定する。

## Decision Drivers
- 小規模チームでも運用コストが低いシンプルな構成であること
- 本番デプロイ前にPreview環境でレビュー・動作確認できること
- リリース履歴と変更内容を追跡できること

## Considered Options

**ブランチ戦略**
- GitHub Flow (`main` = Production。シンプル。)
- GitFlow (`main` / `develop` / `release/vxxx` を分離。複雑。)
- `release`固定ブランチ運用 (`main`を開発環境、`release`を本番環境として分離)

**リリース運用**
- `release/vxxx`ブランチをProduction参照 (リリースのたびにVercel設定変更が必要)
- git tagのみで管理 (VercelはtagをDeployトリガーにできないため記録用途のみ)
- GitHub Releases (tag作成とリリースノート発行を1コマンドで完結)

## Decision

### ブランチ戦略

**GitHub Flowを採用する。**

`main`をProduction branchとしてVercelに設定し、feature branchのPR作成時にVercelがPreview環境を自動生成する。

```
feat/xxx --PR ---> main (= Production)
                    ↑
         VercelがPreview URLを自動生成（レビュー・動作確認）
```

| ブランチ | Vercel環境 | 用途 |
|---------|------------|------|
| `main` | Production | 本番環境 |
| `feat/xxx`, `fix/xxx` | Preview(PR時に自動生成) | 動作確認・レビュー |

GitFlowは小規模チームには過剰な管理コストがかかるため却下。
`release`固定ブランチ運用・`release/vxxx`バージョン付きブランチ運用は、VercelのProduction branch設定が単一固定ブランチしか対応していないため、
リリースの度に設定変更が必要になり却下。

### リリース運用

**GitHub Releasesで管理する。**

GitHub ReleasesはGit tagの上に成り立つ機能であり、`gh release create`1コマンドでtag作成とリリースノート発行が同時に完結する。
VercelはGit tagをDeployトリガーにできないため、デプロイはmainへのマージで行い、GitHub Releasesはバージョン管理・変更履歴の管理用途とする。

PRのマージ方式はMerge commitを使用する。Squash mergeと異なり各コミットがmainに残るため、Conventional Commitsはbranchの各コミットメッセージに適用する。

リリース手順：
1. `feat/xxx`もしくは`fix/xxx` -> `main`へのPRをマージ（Vercelが自動デプロイ）
2. `gh release create vX.Y.Z`でtag作成とリリースノート発行を同時に実施

緊急修正（hotfix）はMVPフェーズでは通常フローと同じ手順（PRマージ）で対応する。緊急度に応じたフロー短縮が必要な場合はその都度判断する。

バージョニングはセマンティックバージョニングに従う(`v0.1.0`からスタート)。

```
v0.1.0  初回MVPリリース
v0.2.0  機能追加(後方互換あり)
v.0.2.1 バグ修正
```

コミットメッセージはConventional Commitsに従い、リリースノートには`feat` / `fix` のみを記録対象とする。
`docs` / `chore`などはリリース対象外のためGitHub Releasesの発行は不要。

```
feat: レシピ登録機能を追加      ->  リリース対象（GitHub Releases発行） 
fix: 買い物リストのバグ修正     ->  リリース対象（GitHub Releases発行）
docs: DB設計ドキュメント更新    ->  リリース対象外 
chore: パッケージ更新           ->  リリース対象外 
```

## Consequences

**Positive:**
- PRマージだけで本番デプロイが完結するシンプルな運用を実現できる
- PRごとにPreview URLが自動生成されるため、本番に影響を与えずにレビューと動作確認が可能
- GitHub Releasesによりリリース履歴と変更内容を一元管理できる

**Negative:**
- `main` = Productionのため、マージ直後に本番へ反映される。PRレビューとPreview確認を必ず経るルールの徹底が必要
- 常時起動のステージング環境がないため、本番データに近い状態での長期検証はできない
