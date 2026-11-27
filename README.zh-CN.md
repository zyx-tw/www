<!-- 翻译自 README.md。只翻 "For AI agents" 以上的章节，英文版更新时一起改。 -->

<div align="center">

<h1>www</h1>

<p><strong>zyx.tw：3D 首页、作品、笔记星图和履历。</strong></p>

[![CI](https://img.shields.io/github/actions/workflow/status/zyx-tw/www/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/zyx-tw/www/actions)
[![Live](https://img.shields.io/badge/live-zyx.tw-000000?style=flat-square)](https://zyx.tw)
[![License](https://img.shields.io/github/license/zyx-tw/www?style=flat-square)](LICENSE)

[English](README.md) | [繁體中文](README.zh-TW.md) | **简体中文**

</div>

## 功能

- **3D 首页**：zyx 标志，用 Plump 场景算出来。
- **作品和笔记**：作品、笔记星图，还有 Info 上的履历，也有 PDF 版。
- **也给 agent 读**：每一页都有 Markdown 版本，另外有 `/llms.txt`、`/agent-instructions.md` 和 JSON-LD。
- **只用设计 token**：页面用了 [ui.zyx.tw](https://ui.zyx.tw) token 以外的值，CI 就会失败。

## 快速开始

```sh
git clone https://github.com/zyx-tw/www && cd www
bun install
cp .env.example .env.local
bun run dev
```

打开 http://localhost:3000，会看到 zyx.tw 首页。

## 设置

设置在 `.env.example`。`GITHUB_TOKEN` 可以不填：没有它，Info 不显示贡献热图，事件列表照常显示。

## 运作方式

| 层 | 选择 |
|----|------|
| 框架 | Next.js 16(App Router、Turbopack) |
| 界面 | React 19、Tailwind CSS 4、Base UI、[ui.zyx.tw](https://ui.zyx.tw) 组件 |
| 语言 | TypeScript，strict，开 `noUncheckedIndexedAccess` |
| 3D | three.js 和 React Three Fiber，Plump 的渲染程序在 `lib/3d` |
| 遥测 | `lib/otel` 把 trace 和 log 送到 [sensorium](https://github.com/zyx-tw/sensorium) |

`components/`、`lib/` 和 `styles/` 里的组件复制自 [zyx-tw/ui](https://github.com/zyx-tw/ui) 的 registry 源码，`lib/3d` 复制自 [zyx-tw/plump](https://github.com/zyx-tw/plump)。要改请先改那边。

## License

[MIT](LICENSE)
