# AGENTS.md

本文件记录本仓库的协作约定，改动相关代码前请先阅读。

## 文档站 Demo 约定

- **样式归属**：Demo 组件样式不要写入 `docs/.vitepress/theme/custom.css`。该文件只保留主题变量等站点级样式。
- **样式位置**：
  - Vue demo 的公共基础样式放在 `docs/demos/components/demo.css`，由 `docs/demos/components/index.ts` 统一引入。
  - React demo 的公共基础样式放在 `docs/demos/react/components/demo.css`，由 `docs/demos/react/components/index.ts` 统一引入。
  - 单个组件的私有样式：Vue 写在 SFC 的 `<style>` 中；React 写在组件同目录的独立 CSS 文件并由组件自身引入。
- **类名前缀**：React demo 一律使用 `dr-` 前缀，Vue demo 一律使用 `dv-` 前缀。两套 demo 组件各自维护，不共用类名。
- **Demo 文件位置**：Vue demo 在 `docs/demos`，React demo 在 `docs/demos/react`；中文 demo 分别位于 `docs/demos/zh` 与 `docs/demos/react/zh`，中文页面引用中文 demo，英文页面引用英文 demo。
- **组件文案**：Demo 组件内置文案使用中文；页面级示例按对应语言维护。

## 工程门禁

命令需使用 Node >= 22.18（仓库约定 `PATH="$HOME/.nvm/versions/node/v22.23.4/bin:$PATH"`）：

```bash
pnpm exec tsc -p docs/tsconfig.json --noEmit  # 文档与 demo 类型检查
pnpm exec oxfmt                               # 格式化
pnpm exec oxlint                              # Lint（不要传 CSS 文件）
pnpm docs:build                               # 文档站构建
pnpm exec vitest run                          # 单元测试（全仓需 LC_ALL=en_US.UTF-8）
```

提交前请确保以上检查全部通过。
