#!/usr/bin/env node

/**
 * 自动化发布脚本 - Canvasgrid Transit
 * 
 * 这个脚本会：
 * 1. 验证项目状态
 * 2. 构建插件
 * 3. 创建发布包
 * 4. 创建Git标签
 * 5. 推送到GitHub
 */

const fs = require('fs');
const { execSync } = require('child_process');

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        'info': '📋',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function executeCommand(command, description) {
    log(`执行: ${description}`);
    try {
        const result = execSync(command, { stdio: 'inherit' });
        log(`完成: ${description}`, 'success');
        return result;
    } catch (error) {
        log(`失败: ${description} - ${error.message}`, 'error');
        throw error;
    }
}

function getVersion() {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    return manifest.version;
}

function checkGitStatus() {
    log('检查Git状态...');
    
    try {
        // 检查是否在Git仓库中
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        
        // 检查是否有未提交的更改
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
            log('发现未提交的更改，正在提交...', 'warning');
            executeCommand('git add .', '添加所有更改');
            executeCommand(`git commit -m "Release v${getVersion()}"`, '提交更改');
        }
        
        log('Git状态检查完成', 'success');
    } catch (error) {
        log('Git仓库未初始化，正在初始化...', 'warning');
        executeCommand('git init', '初始化Git仓库');
        executeCommand('git add .', '添加所有文件');
        executeCommand(`git commit -m "Initial commit: Canvasgrid Transit v${getVersion()}"`, '初始提交');
    }
}

function createAndPushTag(version) {
    log(`创建版本标签 v${version}...`);
    
    try {
        // 检查标签是否已存在
        execSync(`git rev-parse v${version}`, { stdio: 'ignore' });
        log(`标签 v${version} 已存在，正在删除...`, 'warning');
        executeCommand(`git tag -d v${version}`, '删除本地标签');
        executeCommand(`git push origin :refs/tags/v${version}`, '删除远程标签');
    } catch (error) {
        // 标签不存在，这是正常的
    }
    
    executeCommand(`git tag v${version}`, '创建版本标签');
    
    // 检查是否有远程仓库
    try {
        execSync('git remote get-url origin', { stdio: 'ignore' });
        executeCommand(`git push origin v${version}`, '推送标签到远程仓库');
    } catch (error) {
        log('未配置远程仓库，跳过推送', 'warning');
        log('请手动添加远程仓库：git remote add origin <repository-url>', 'info');
    }
}

function pushToGitHub() {
    log('推送到GitHub...');
    
    try {
        // 检查是否有远程仓库
        execSync('git remote get-url origin', { stdio: 'ignore' });
        
        // 推送主分支
        executeCommand('git push -u origin main', '推送主分支');
        
    } catch (error) {
        log('远程仓库未配置或推送失败', 'warning');
        log('请确保已配置远程仓库：', 'info');
        log('git remote add origin https://github.com/zhuzhige123/Canvasgrid-Transit.git', 'info');
    }
}

function generateReleaseInstructions(version) {
    const instructions = `
🎉 发布准备完成！

📋 版本信息:
   版本: ${version}
   标签: v${version}
   发布包: release-${version}/

📝 下一步操作:

1. 创建GitHub Release:
   - 访问: https://github.com/zhuzhige123/Canvasgrid-Transit/releases
   - 点击 "Create a new release"
   - 选择标签: v${version}
   - 标题: Canvasgrid Transit v${version}
   - 上传文件: release-${version}/ 目录中的所有文件

2. 发布说明:
   - 复制 RELEASE_NOTES.md 的内容作为发布说明

3. 提交到Obsidian社区插件:
   - 确保GitHub Release已创建
   - 提交插件到Obsidian官方审核

🔗 有用的链接:
   - GitHub仓库: https://github.com/zhuzhige123/Canvasgrid-Transit
   - 发布页面: https://github.com/zhuzhige123/Canvasgrid-Transit/releases
   - Obsidian插件提交: https://github.com/obsidianmd/obsidian-releases
`;

    console.log(instructions);
    
    // 保存说明到文件
    fs.writeFileSync('RELEASE_INSTRUCTIONS.md', instructions.trim());
    log('发布说明已保存到 RELEASE_INSTRUCTIONS.md', 'success');
}

function main() {
    log('开始自动化发布流程...');
    
    try {
        // 获取版本信息
        const version = getVersion();
        log(`当前版本: ${version}`);
        
        // 运行发布准备脚本
        executeCommand('node scripts/prepare-release.js', '运行发布准备');
        
        // 检查Git状态
        checkGitStatus();
        
        // 创建和推送标签
        createAndPushTag(version);
        
        // 推送到GitHub
        pushToGitHub();
        
        // 生成发布说明
        generateReleaseInstructions(version);
        
        log('🎉 自动化发布流程完成！', 'success');
        
    } catch (error) {
        log(`发布流程失败: ${error.message}`, 'error');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
