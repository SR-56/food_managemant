---
name: issue-view
description: ユーザーがGitHub IssueのURL（例: https://github.com/owner/repo/issues/123）を共有してIssueを読んだり作業したりする場合に使用する。WebFetchではなくgh CLIでIssueを取得する。
version: 0.1.0
---

# GitHub Issue ビューアー

ユーザーがGitHub IssueのURLを提示したら、`gh` CLIを使ってIssueの内容を確実に取得する。

## Issueの取得方法

URLから `owner/repo` と `issue_number` を抽出し、以下を実行する：

```bash
gh issue view <issue_number> --repo <owner>/<repo> --json title,body,state,comments,labels,assignees
```

### 例

URL: `https://github.com/SR-56/food_managemant/issues/29`
- repo: `SR-56/food_managemant`
- number: `29`

```bash
gh issue view 29 --repo SR-56/food_managemant --json title,body,state,comments,labels,assignees
```

## `--json` フラグが必須な理由

`--json` なしで `gh issue view` を実行すると、廃止予定の GitHub Projects (classic) APIに起因するエラーが発生する。
必ず `--json` に `title,body,state,comments` 以上のフィールドを指定して実行すること。

## 取得後の対応

Issueの内容をユーザーに読みやすい形式で提示し、ユーザーが求めるタスク（評価・実装・ADR作成など）を進める。
