#!/usr/bin/env node

/**
 * Release Preparation Script for Canvasgrid Transit
 * 
 * This script prepares the plugin for release by:
 * 1. Validating all required files are present
 * 2. Checking version consistency
 * 3. Building the plugin
 * 4. Creating a release package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REQUIRED_FILES = [
    'manifest.json',
    'main.ts',
    'styles.css',
    'versions.json',
    'package.json',
    'README.md',
    'LICENSE',
    'CHANGELOG.md'
];

const REQUIRED_DIRS = [
    'src',
    'docs'
];

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

function validateFiles() {
    log('Validating required files...');
    
    const missingFiles = REQUIRED_FILES.filter(file => !fs.existsSync(file));
    const missingDirs = REQUIRED_DIRS.filter(dir => !fs.existsSync(dir));
    
    if (missingFiles.length > 0) {
        log(`Missing required files: ${missingFiles.join(', ')}`, 'error');
        process.exit(1);
    }
    
    if (missingDirs.length > 0) {
        log(`Missing required directories: ${missingDirs.join(', ')}`, 'error');
        process.exit(1);
    }
    
    log('All required files and directories present', 'success');
}

function validateVersions() {
    log('Validating version consistency...');
    
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (manifest.version !== packageJson.version) {
        log(`Version mismatch: manifest.json (${manifest.version}) vs package.json (${packageJson.version})`, 'error');
        process.exit(1);
    }
    
    log(`Version consistency validated: ${manifest.version}`, 'success');
    return manifest.version;
}

function buildPlugin() {
    log('Building plugin...');
    
    try {
        execSync('npm run build', { stdio: 'inherit' });
        log('Plugin built successfully', 'success');
    } catch (error) {
        log('Build failed', 'error');
        process.exit(1);
    }
}

function validateBuildOutput() {
    log('Validating build output...');
    
    const requiredBuildFiles = ['main.js'];
    const missingBuildFiles = requiredBuildFiles.filter(file => !fs.existsSync(file));
    
    if (missingBuildFiles.length > 0) {
        log(`Missing build files: ${missingBuildFiles.join(', ')}`, 'error');
        process.exit(1);
    }
    
    log('Build output validated', 'success');
}

function createReleasePackage(version) {
    log('Creating release package...');
    
    const releaseDir = `release-${version}`;
    
    // Clean up existing release directory
    if (fs.existsSync(releaseDir)) {
        fs.rmSync(releaseDir, { recursive: true });
    }
    
    // Create release directory
    fs.mkdirSync(releaseDir);
    
    // Copy required files for release
    const releaseFiles = [
        'main.js',
        'manifest.json',
        'styles.css',
        'versions.json'
    ];
    
    releaseFiles.forEach(file => {
        fs.copyFileSync(file, path.join(releaseDir, file));
        log(`Copied ${file} to release package`);
    });
    
    log(`Release package created in ${releaseDir}/`, 'success');
    return releaseDir;
}

function generateReleaseNotes(version) {
    log('Generating release notes...');
    
    try {
        const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
        const versionSection = changelog.match(new RegExp(`## \\[${version}\\][\\s\\S]*?(?=## \\[|$)`, 'i'));
        
        if (versionSection) {
            const releaseNotes = versionSection[0].trim();
            fs.writeFileSync('RELEASE_NOTES.md', releaseNotes);
            log('Release notes generated', 'success');
        } else {
            log(`No changelog entry found for version ${version}`, 'warning');
        }
    } catch (error) {
        log('Failed to generate release notes', 'warning');
    }
}

function printSummary(version, releaseDir) {
    log('\n🎉 Release preparation completed successfully!', 'success');
    console.log('\n📋 Release Summary:');
    console.log(`   Version: ${version}`);
    console.log(`   Release Package: ${releaseDir}/`);
    console.log(`   Files: main.js, manifest.json, styles.css, versions.json`);
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Review the release package contents');
    console.log('   2. Test the plugin in a clean Obsidian environment');
    console.log('   3. Create a GitHub release with the package files');
    console.log('   4. Submit to Obsidian community plugins (if applicable)');
    
    console.log('\n🔗 Useful Commands:');
    console.log(`   zip -r canvasgrid-transit-${version}.zip ${releaseDir}/`);
    console.log('   git tag v' + version);
    console.log('   git push origin v' + version);
}

function main() {
    log('Starting release preparation for Canvasgrid Transit...');
    
    try {
        validateFiles();
        const version = validateVersions();
        buildPlugin();
        validateBuildOutput();
        const releaseDir = createReleasePackage(version);
        generateReleaseNotes(version);
        printSummary(version, releaseDir);
    } catch (error) {
        log(`Release preparation failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    validateFiles,
    validateVersions,
    buildPlugin,
    validateBuildOutput,
    createReleasePackage,
    generateReleaseNotes
};
