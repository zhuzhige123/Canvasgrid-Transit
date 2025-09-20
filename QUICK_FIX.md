# 🚀 GitHub Actions错误快速修复

## 问题描述
GitHub Actions报错：找不到标记"0.5.1"的版本

## ⚡ 快速解决方案

### 方法1: 使用自动化脚本（推荐）
```bash
cd canvasgrid-transit
npm run release
```

### 方法2: 手动执行命令
```bash
# 1. 初始化Git（如果还没有）
git init
git add .
git commit -m "Initial commit: Canvasgrid Transit v0.5.1"

# 2. 添加远程仓库
git remote add origin https://github.com/zhuzhige123/Canvasgrid-Transit.git

# 3. 推送主分支
git branch -M main
git push -u origin main

# 4. 创建版本标签
git tag v0.5.1
git push origin v0.5.1
```

### 方法3: 如果标签已存在但有问题
```bash
# 删除现有标签
git tag -d v0.5.1
git push origin :refs/tags/v0.5.1

# 重新创建标签
git tag v0.5.1
git push origin v0.5.1
```

## 📋 验证修复
执行以下命令验证标签是否正确创建：
```bash
git tag -l
git show v0.5.1
```

## 🎯 完成后续步骤
1. 访问 GitHub 仓库的 Releases 页面
2. 创建新的 Release，选择 v0.5.1 标签
3. 上传 release-0.5.1/ 目录中的文件
4. 发布 Release

现在 GitHub Actions 验证应该能够通过了！
