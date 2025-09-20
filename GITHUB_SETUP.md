# GitHub 仓库设置指南

## 🚀 解决GitHub Actions错误

您遇到的错误是因为GitHub Actions脚本在验证版本时找不到对应的Git标签。以下是解决步骤：

### 📋 问题分析

**错误信息**:
```
发现问题：找不到有标记"0.5.1"的版本。请保存储库中manifest.json文件中的版本指向正确的 Github 版本。
```

**根本原因**: 
- manifest.json中的版本是0.5.1
- 但GitHub仓库中没有对应的v0.5.1标签
- GitHub Actions验证脚本需要版本标签来验证发布

### ✅ 解决方案

#### 步骤1: 初始化Git仓库
```bash
cd canvasgrid-transit
git init
git add .
git commit -m "Initial commit: Canvasgrid Transit v0.5.1"
```

#### 步骤2: 添加远程仓库
```bash
git remote add origin https://github.com/zhuzhige123/Canvasgrid-Transit.git
```

#### 步骤3: 推送到GitHub
```bash
git branch -M main
git push -u origin main
```

#### 步骤4: 创建版本标签
```bash
# 创建0.5.1版本标签
git tag v0.5.1
git push origin v0.5.1

# 如果需要，也可以创建之前的版本标签
git tag v0.5.0
git push origin v0.5.0
```

#### 步骤5: 创建GitHub Release
1. 访问 https://github.com/zhuzhige123/Canvasgrid-Transit/releases
2. 点击 "Create a new release"
3. 选择标签 "v0.5.1"
4. 填写发布标题: "Canvasgrid Transit v0.5.1"
5. 复制 RELEASE_NOTES.md 的内容作为发布说明
6. 上传 release-0.5.1/ 目录中的文件：
   - main.js
   - manifest.json
   - styles.css
   - versions.json
7. 点击 "Publish release"

### 🔧 自动化脚本

为了简化流程，我已经创建了一个自动化脚本：

```bash
# 运行发布脚本
npm run release
```

这个脚本会：
1. 验证所有文件
2. 构建插件
3. 创建发布包
4. 创建Git标签
5. 推送到GitHub

### 📝 版本管理最佳实践

#### 版本号规范
- 使用语义化版本 (Semantic Versioning)
- 格式: MAJOR.MINOR.PATCH
- 当前版本: 0.5.1

#### Git标签规范
- 标签格式: v{version}
- 例如: v0.5.1, v1.0.0
- 每个发布版本都应该有对应的标签

#### 发布流程
1. 更新版本号 (manifest.json, package.json)
2. 更新 CHANGELOG.md
3. 构建和测试
4. 创建Git标签
5. 推送到GitHub
6. 创建GitHub Release
7. 提交到Obsidian社区插件

### 🚨 常见问题

#### Q: 为什么需要Git标签？
A: Obsidian的验证脚本需要通过Git标签来验证版本的真实性和一致性。

#### Q: 如果标签已经存在怎么办？
A: 可以删除现有标签后重新创建：
```bash
git tag -d v0.5.1
git push origin :refs/tags/v0.5.1
git tag v0.5.1
git push origin v0.5.1
```

#### Q: 如何验证标签是否正确？
A: 使用以下命令检查：
```bash
git tag -l
git show v0.5.1
```

### 📞 需要帮助？

如果您在设置过程中遇到问题，请：
1. 检查Git配置是否正确
2. 确认GitHub仓库权限
3. 验证网络连接
4. 查看详细的错误信息

---

完成这些步骤后，GitHub Actions验证应该就能通过了！
