import { App, TFile } from 'obsidian';

// 数据版本信息
export interface DataVersion {
	version: string;
	timestamp: number;
	description: string;
	migrationRequired: boolean;
}

// 迁移规则
export interface MigrationRule {
	fromVersion: string;
	toVersion: string;
	migrationFunction: (data: any) => Promise<any>;
	description: string;
	isReversible: boolean;
}

// 版本管理配置
export interface VersionManagerConfig {
	currentVersion: string;
	metadataFileName: string;
	enableBackup: boolean;
	maxBackupCount: number;
	autoMigration: boolean;
}

/**
 * 数据版本管理器
 * 负责Canvas数据的版本控制和迁移
 */
export class DataVersionManager {
	private app: App;
	private config: VersionManagerConfig;
	private migrationRules: Map<string, MigrationRule[]> = new Map();
	
	// 版本历史
	private versionHistory: DataVersion[] = [];
	
	// 当前支持的版本
	private readonly SUPPORTED_VERSIONS = ['1.0.0', '1.1.0', '1.2.0', '1.3.0'];
	private readonly CURRENT_VERSION = '1.3.0';

	constructor(app: App, config?: Partial<VersionManagerConfig>) {
		this.app = app;
		this.config = {
			currentVersion: this.CURRENT_VERSION,
			metadataFileName: 'canvas-version.json',
			enableBackup: true,
			maxBackupCount: 5,
			autoMigration: true,
			...config
		};
		
		this.initializeMigrationRules();
	}

	/**
	 * 初始化迁移规则
	 */
	private initializeMigrationRules(): void {
		// 1.0.0 -> 1.1.0: 添加时间线数据结构
		this.addMigrationRule({
			fromVersion: '1.0.0',
			toVersion: '1.1.0',
			migrationFunction: this.migrateV1_0_to_V1_1.bind(this),
			description: '添加基础时间线数据结构',
			isReversible: false
		});
		
		// 1.1.0 -> 1.2.0: 扩展时间线数据字段
		this.addMigrationRule({
			fromVersion: '1.1.0',
			toVersion: '1.2.0',
			migrationFunction: this.migrateV1_1_to_V1_2.bind(this),
			description: '扩展时间线数据字段（优先级、类别等）',
			isReversible: true
		});
		
		// 1.2.0 -> 1.3.0: 添加计划时间和全天事件支持
		this.addMigrationRule({
			fromVersion: '1.2.0',
			toVersion: '1.3.0',
			migrationFunction: this.migrateV1_2_to_V1_3.bind(this),
			description: '添加计划时间和全天事件支持',
			isReversible: true
		});
	}

	/**
	 * 添加迁移规则
	 */
	private addMigrationRule(rule: MigrationRule): void {
		if (!this.migrationRules.has(rule.fromVersion)) {
			this.migrationRules.set(rule.fromVersion, []);
		}
		this.migrationRules.get(rule.fromVersion)!.push(rule);
	}

	/**
	 * 检查数据版本
	 */
	async checkDataVersion(canvasFile: TFile): Promise<{
		currentVersion: string;
		targetVersion: string;
		needsMigration: boolean;
		migrationPath: MigrationRule[];
	}> {
		try {
			// 读取版本信息
			const versionInfo = await this.loadVersionInfo(canvasFile);
			const currentVersion = versionInfo?.version || '1.0.0';
			const targetVersion = this.config.currentVersion;
			
			// 检查是否需要迁移
			const needsMigration = currentVersion !== targetVersion;
			
			// 计算迁移路径
			const migrationPath = needsMigration ? 
				this.calculateMigrationPath(currentVersion, targetVersion) : [];
			
			return {
				currentVersion,
				targetVersion,
				needsMigration,
				migrationPath
			};
			
		} catch (error) {
			console.error('❌ Failed to check data version:', error);
			
			// 默认返回需要从1.0.0迁移
			return {
				currentVersion: '1.0.0',
				targetVersion: this.config.currentVersion,
				needsMigration: true,
				migrationPath: this.calculateMigrationPath('1.0.0', this.config.currentVersion)
			};
		}
	}

	/**
	 * 执行数据迁移
	 */
	async migrateData(canvasFile: TFile, canvasData: any): Promise<any> {
		const versionCheck = await this.checkDataVersion(canvasFile);
		
		if (!versionCheck.needsMigration) {
			console.log('ℹ️ No migration needed, data is up to date');
			return canvasData;
		}
		
		console.log(`🔄 Starting migration from ${versionCheck.currentVersion} to ${versionCheck.targetVersion}`);
		
		// 创建备份
		if (this.config.enableBackup) {
			await this.createBackup(canvasFile, canvasData, versionCheck.currentVersion);
		}
		
		// 执行迁移链
		let migratedData = canvasData;
		
		for (const rule of versionCheck.migrationPath) {
			console.log(`📦 Applying migration: ${rule.fromVersion} -> ${rule.toVersion}`);
			console.log(`   Description: ${rule.description}`);
			
			try {
				migratedData = await rule.migrationFunction(migratedData);
				console.log(`✅ Migration completed: ${rule.fromVersion} -> ${rule.toVersion}`);
			} catch (error) {
				console.error(`❌ Migration failed: ${rule.fromVersion} -> ${rule.toVersion}`, error);
				throw new Error(`Migration failed at ${rule.fromVersion} -> ${rule.toVersion}: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
		
		// 更新版本信息
		await this.updateVersionInfo(canvasFile, versionCheck.targetVersion);
		
		console.log(`🎉 Migration completed successfully to version ${versionCheck.targetVersion}`);
		
		return migratedData;
	}

	/**
	 * 计算迁移路径
	 */
	private calculateMigrationPath(fromVersion: string, toVersion: string): MigrationRule[] {
		const path: MigrationRule[] = [];
		let currentVersion = fromVersion;
		
		// 简单的线性迁移路径计算
		while (currentVersion !== toVersion) {
			const rules = this.migrationRules.get(currentVersion);
			if (!rules || rules.length === 0) {
				throw new Error(`No migration rule found for version ${currentVersion}`);
			}
			
			// 选择第一个可用的迁移规则
			const rule = rules[0];
			path.push(rule);
			currentVersion = rule.toVersion;
			
			// 防止无限循环
			if (path.length > 10) {
				throw new Error('Migration path too long, possible circular dependency');
			}
		}
		
		return path;
	}

	/**
	 * 加载版本信息
	 */
	private async loadVersionInfo(canvasFile: TFile): Promise<DataVersion | null> {
		try {
			const versionFilePath = this.getVersionFilePath(canvasFile);
			const versionFile = this.app.vault.getAbstractFileByPath(versionFilePath);
			
			if (versionFile instanceof TFile) {
				const content = await this.app.vault.read(versionFile);
				return JSON.parse(content);
			}
			
			return null;
		} catch (error) {
			console.warn('⚠️ Could not load version info:', error);
			return null;
		}
	}

	/**
	 * 更新版本信息
	 */
	private async updateVersionInfo(canvasFile: TFile, version: string): Promise<void> {
		try {
			const versionInfo: DataVersion = {
				version,
				timestamp: Date.now(),
				description: `Updated to version ${version}`,
				migrationRequired: false
			};
			
			const versionFilePath = this.getVersionFilePath(canvasFile);
			const content = JSON.stringify(versionInfo, null, 2);
			
			// 确保目录存在
			const dir = versionFilePath.substring(0, versionFilePath.lastIndexOf('/'));
			if (!(await this.app.vault.adapter.exists(dir))) {
				await this.app.vault.adapter.mkdir(dir);
			}
			
			// 写入版本文件
			await this.app.vault.adapter.write(versionFilePath, content);
			
			// 更新版本历史
			this.versionHistory.push(versionInfo);
			
		} catch (error) {
			console.error('❌ Failed to update version info:', error);
		}
	}

	/**
	 * 创建数据备份
	 */
	private async createBackup(canvasFile: TFile, data: any, version: string): Promise<void> {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const backupFileName = `${canvasFile.basename}-backup-${version}-${timestamp}.json`;
			const backupPath = `${canvasFile.parent?.path || ''}/.timeline-backups/${backupFileName}`;
			
			// 确保备份目录存在
			const backupDir = backupPath.substring(0, backupPath.lastIndexOf('/'));
			if (!(await this.app.vault.adapter.exists(backupDir))) {
				await this.app.vault.adapter.mkdir(backupDir);
			}
			
			// 创建备份
			const backupContent = JSON.stringify(data, null, 2);
			await this.app.vault.adapter.write(backupPath, backupContent);
			
			console.log(`💾 Backup created: ${backupPath}`);
			
			// 清理旧备份
			await this.cleanupOldBackups(canvasFile);
			
		} catch (error) {
			console.error('❌ Failed to create backup:', error);
		}
	}

	/**
	 * 清理旧备份
	 */
	private async cleanupOldBackups(canvasFile: TFile): Promise<void> {
		try {
			const backupDir = `${canvasFile.parent?.path || ''}/.timeline-backups`;
			const files = await this.app.vault.adapter.list(backupDir);
			
			if (files.files.length > this.config.maxBackupCount) {
				// 按时间排序，删除最旧的备份
				const backupFiles = files.files
					.filter(f => f.startsWith(`${canvasFile.basename}-backup-`))
					.sort();
				
				const filesToDelete = backupFiles.slice(0, backupFiles.length - this.config.maxBackupCount);
				
				for (const file of filesToDelete) {
					await this.app.vault.adapter.remove(`${backupDir}/${file}`);
					console.log(`🗑️ Removed old backup: ${file}`);
				}
			}
		} catch (error) {
			console.warn('⚠️ Failed to cleanup old backups:', error);
		}
	}

	/**
	 * 获取版本文件路径
	 */
	private getVersionFilePath(canvasFile: TFile): string {
		const dir = canvasFile.parent?.path || '';
		return `${dir}/.timeline-metadata/${canvasFile.basename}-${this.config.metadataFileName}`;
	}

	/**
	 * 迁移函数：1.0.0 -> 1.1.0
	 */
	private async migrateV1_0_to_V1_1(data: any): Promise<any> {
		console.log('🔄 Migrating from 1.0.0 to 1.1.0: Adding timeline data structure');
		
		if (data.nodes) {
			for (const node of data.nodes) {
				if (!node.timelineData) {
					// 从节点ID提取时间戳
					const timestamp = this.extractTimestampFromId(node.id);
					
					node.timelineData = {
						createdAt: timestamp,
						category: 'default'
					};
				}
			}
		}
		
		return data;
	}

	/**
	 * 迁移函数：1.1.0 -> 1.2.0
	 */
	private async migrateV1_1_to_V1_2(data: any): Promise<any> {
		console.log('🔄 Migrating from 1.1.0 to 1.2.0: Extending timeline data fields');
		
		if (data.nodes) {
			for (const node of data.nodes) {
				if (node.timelineData) {
					// 添加新字段
					if (!node.timelineData.priority) {
						node.timelineData.priority = 'medium';
					}
					
					if (!node.timelineData.modifiedAt) {
						node.timelineData.modifiedAt = node.timelineData.createdAt;
					}
				}
			}
		}
		
		return data;
	}

	/**
	 * 迁移函数：1.2.0 -> 1.3.0
	 */
	private async migrateV1_2_to_V1_3(data: any): Promise<any> {
		console.log('🔄 Migrating from 1.2.0 to 1.3.0: Adding scheduled time and all-day event support');
		
		if (data.nodes) {
			for (const node of data.nodes) {
				if (node.timelineData) {
					// 添加计划时间支持
					if (!node.timelineData.scheduledAt) {
						node.timelineData.scheduledAt = null;
					}
					
					// 添加全天事件支持
					if (node.timelineData.isAllDay === undefined) {
						node.timelineData.isAllDay = false;
					}
					
					// 添加持续时间支持
					if (!node.timelineData.duration) {
						node.timelineData.duration = null;
					}
				}
			}
		}
		
		return data;
	}

	/**
	 * 从节点ID提取时间戳
	 */
	private extractTimestampFromId(nodeId: string): number {
		// 尝试从节点ID中提取时间戳
		const timestampMatch = nodeId.match(/(\d{13})/);
		if (timestampMatch) {
			return parseInt(timestampMatch[1]);
		}
		
		// 如果无法提取，返回当前时间
		return Date.now();
	}

	/**
	 * 获取版本历史
	 */
	getVersionHistory(): DataVersion[] {
		return [...this.versionHistory];
	}

	/**
	 * 获取支持的版本列表
	 */
	getSupportedVersions(): string[] {
		return [...this.SUPPORTED_VERSIONS];
	}

	/**
	 * 检查版本兼容性
	 */
	isVersionSupported(version: string): boolean {
		return this.SUPPORTED_VERSIONS.includes(version);
	}
}
