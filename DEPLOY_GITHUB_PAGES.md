# GitHub Pagesで恒久公開する手順

無料でAndroidから自宅外でも使えるようにする手順です。

## 必要なもの

- GitHubアカウント
- 公開用リポジトリ

## こちらで続きまでやる場合

GitHubアカウントを作ったあと、GitHub上で空のリポジトリを1つ作ってください。

おすすめ設定:

- Repository name: `life-correction-app`
- Visibility: `Public`
- README: 作らない

作成後、表示されるリポジトリURLを教えてください。

例:

```text
https://github.com/your-name/life-correction-app.git
```

そのURLがあれば、こちらでこのフォルダをGitHubへpushできる形にします。

## GitHub Pagesの設定

GitHubでリポジトリを開きます。

1. `Settings`
2. `Pages`
3. `Build and deployment`
4. `Source` を `Deploy from a branch`
5. `Branch` を `main`、フォルダを `/ (root)`
6. `Save`

数十秒から数分後に次の形式のURLで開けます。

```text
https://your-name.github.io/life-correction-app/
```

AndroidのChromeで開いて、「アプリをインストール」または「ホーム画面に追加」を選びます。

## 注意

タスクデータはスマホ内のローカル保存です。GitHubにタスク内容は送られません。
