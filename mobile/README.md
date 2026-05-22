# スマホ版 生活矯正

スマホのホーム画面に置くためのPWA版です。

## 狙い

PCを開く前に負ける問題に対応して、スマホを開いたタイミングで「まず1個だけ捕まえる」入口を作ります。

## 使い方

この `mobile` フォルダを静的サイトとして公開し、スマホのブラウザで開いてホーム画面に追加します。

候補:

- GitHub Pages
- Netlify
- Cloudflare Pages
- 自宅Wi-Fi内で一時的に `python -m http.server`

## Androidで試す

PCとAndroidを同じWi-Fiにつなぎます。

PCでリポジトリ直下の `start_mobile_server.bat` を起動します。

PowerShellでPCのIPv4アドレスを確認します。

```powershell
ipconfig
```

AndroidのChromeで次を開きます。

```text
http://PCのIPv4アドレス:8765/
```

Chromeのメニューから「ホーム画面に追加」を選びます。

この方法は一時テスト用です。HTTP配信なので、端末やChromeの状態によっては通知やPWAインストールが制限されることがあります。

## Androidで本運用する

GitHub Pages、Netlify、Cloudflare Pagesなどに `mobile` フォルダをHTTPSで公開します。  
AndroidのChromeで公開URLを開き、「アプリをインストール」または「ホーム画面に追加」を選びます。

PWAとして入れると、ホーム画面から単独アプリのように開けます。

## 無料で自宅外から試す

リポジトリ直下の `start_public_mobile.bat` を起動します。  
表示された `https://...trycloudflare.com` のURLをAndroidのChromeで開き、「ホーム画面に追加」を選びます。

この方式は無料でアカウント不要ですが、PCとこのウィンドウを開いている間だけ使えます。  
URLは起動するたびに変わることがあります。

## 制限

Webアプリなので、スマホOS全体や他アプリを完全にロックすることはできません。  
ただし、ホーム画面に置いて毎日開く運用にすると、タスクゼロ時の入口ロックと期限超過ブロックが働きます。
