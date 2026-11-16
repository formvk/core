# Changesets

用于记录每次改动的发布意图，发版时由 changesets 统一升版本并生成各包 `CHANGELOG.md`。

## 流程

1. 开发完成后运行 `pnpm changeset`，选择受影响的包、bump 类型（patch/minor/major）并填写变更摘要。
2. 把生成的 `.changeset/*.md` 与代码一起提交。
3. 发版时运行 `pnpm version:release`：
   - 消费所有 changeset，按配置的固定组把 9 个包统一升到同一版本；
   - 生成/更新各包 `CHANGELOG.md`；
   - 提交 `chore(release): 😊 publish v<version>`。
4. 推送 `main` 后由 `.github/workflows/release.yml` 发布到 npm。

## 预发布

```bash
pnpm version:alpha    # 进入 alpha 预发布模式并升版本
pnpm version:beta
pnpm version:rc
pnpm version:exit-pre # 退出预发布模式，生成正式版本
pnpm version:release  # 正式版本
```

预发布期间的提交信息形如 `chore(release): 😊 publish v0.2.0-alpha.0`，
CI 会按版本号自动使用对应的 dist-tag（alpha/beta/rc），不会顶掉 `latest`。
