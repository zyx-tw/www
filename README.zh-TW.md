<!-- 翻譯自 README.md。只翻 "For AI agents" 以上的章節，英文版更新時一起改。 -->

<div align="center">

<h1>www</h1>

<p><strong>zyx.tw：3D 首頁、作品、筆記星圖和履歷。</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx-tw/www/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx-tw/www/actions)
[![Live](https://img.shields.io/badge/live-zyx.tw-000000?style=flat-square)](https://zyx.tw)
[![License](https://img.shields.io/github/license/zyx-tw/www?style=flat-square)](LICENSE)

[English](README.md) | **繁體中文** | [简体中文](README.zh-CN.md)

</div>

## 功能

- **3D 首頁**：zyx 標誌，用 Plump 場景算出來。
- **作品和筆記**：作品、筆記星圖，還有 Info 上的履歷，也有 PDF 版。
- **也給 agent 讀**：每一頁都有 Markdown 版本，另外有 `/llms.txt`、`/agent-instructions.md` 和 JSON-LD。
- **只用設計 token**：頁面用了 [ui.zyx.tw](https://ui.zyx.tw) token 以外的值，CI 就會失敗。

## 快速開始

```sh
git clone https://github.com/zyx-tw/www && cd www
bun install
cp .env.example .env.local
bun run dev
```

打開 http://localhost:3000，會看到 zyx.tw 首頁。

## 設定

設定在 `.env.example`。`GITHUB_TOKEN` 可以不填：沒有它，Info 不顯示貢獻熱圖，事件列表照常顯示。

## 運作方式

| 層 | 選擇 |
|----|------|
| 框架 | Next.js 16(App Router、Turbopack) |
| 介面 | React 19、Tailwind CSS 4、Base UI、[ui.zyx.tw](https://ui.zyx.tw) 元件 |
| 語言 | TypeScript，strict，開 `noUncheckedIndexedAccess` |
| 3D | three.js 和 React Three Fiber，Plump 的算圖程式在 `lib/3d` |
| 遙測 | `lib/otel` 把 trace 和 log 送到 [sensorium](https://github.com/zyx-tw/sensorium) |

`components/`、`lib/` 和 `styles/` 裡的元件複製自 [zyx-tw/ui](https://github.com/zyx-tw/ui) 的 registry 原始碼，`lib/3d` 複製自 [zyx-tw/plump](https://github.com/zyx-tw/plump)。要改請先改那邊。

## License

[MIT](LICENSE)
