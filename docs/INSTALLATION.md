# Installation Guide - Canvasgrid Transit

This guide provides detailed instructions for installing Canvasgrid Transit in Obsidian.

## 📋 Prerequisites

### System Requirements
- **Obsidian Version**: 1.0.0 or higher
- **Operating System**: Windows, macOS, or Linux
- **Memory**: At least 4GB RAM recommended
- **Storage**: 50MB free space for plugin and dependencies

### Optional Requirements
- **Anki**: For spaced repetition features (with AnkiConnect plugin)
- **Internet Connection**: For initial download and updates

## 📦 Installation Methods

### Method 1: Obsidian Community Plugins (Recommended)

This is the easiest and most secure way to install Canvasgrid Transit.

**Steps:**
1. **Open Obsidian Settings**
   - Click the Settings icon (⚙️) in the bottom-left corner
   - Or use the keyboard shortcut `Ctrl+,` (Windows/Linux) or `Cmd+,` (macOS)

2. **Navigate to Community Plugins**
   - In the left sidebar, click on "Community plugins"
   - If this is your first time using community plugins, you'll need to turn off "Safe mode"

3. **Search for the Plugin**
   - Click "Browse" to open the community plugins browser
   - Search for "Canvasgrid Transit"
   - Look for the plugin by "Canvasgrid Transit Team"

4. **Install and Enable**
   - Click "Install" on the plugin page
   - After installation, click "Enable" to activate the plugin
   - The plugin will appear in your installed plugins list

### Method 2: Manual Installation

For users who prefer manual installation or need to install a specific version.

**Steps:**
1. **Download the Plugin**
   - Go to the [GitHub Releases page](https://github.com/zhuzhige123/Canvasgrid-Transit/releases)
   - Download the latest release (usually a `.zip` file)
   - Extract the downloaded file

2. **Locate Your Vault's Plugin Folder**
   - Open your Obsidian vault folder
   - Navigate to `.obsidian/plugins/` (create the folders if they don't exist)
   - The full path should be: `YourVault/.obsidian/plugins/`

3. **Install the Plugin Files**
   - Create a new folder named `canvasgrid-transit` in the plugins directory
   - Copy the following files from the extracted download:
     - `main.js`
     - `manifest.json`
     - `styles.css`
   - Your folder structure should look like:
     ```
     YourVault/
     └── .obsidian/
         └── plugins/
             └── canvasgrid-transit/
                 ├── main.js
                 ├── manifest.json
                 └── styles.css
     ```

4. **Enable the Plugin**
   - Restart Obsidian or reload the app
   - Go to Settings > Community plugins
   - Find "Canvasgrid Transit" in the installed plugins list
   - Toggle it on to enable

### Method 3: BRAT Plugin (Beta Testing)

For users who want to test the latest development versions.

**Prerequisites:**
- Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) first

**Steps:**
1. **Install BRAT**
   - Follow Method 1 above to install the BRAT plugin
   - Enable BRAT in your community plugins

2. **Add Canvasgrid Transit Repository**
   - Open BRAT settings
   - Click "Add Beta plugin"
   - Enter the repository URL: `zhuzhige123/Canvasgrid-Transit`
   - Click "Add Plugin"

3. **Enable the Plugin**
   - Go to Settings > Community plugins
   - Find "Canvasgrid Transit" and enable it

## ✅ Verification

### Check Installation Success
After installation, verify that the plugin is working correctly:

1. **Plugin Appears in Settings**
   - Go to Settings > Community plugins
   - "Canvasgrid Transit" should appear in the installed plugins list
   - The toggle should be enabled (blue)

2. **Canvas Toolbar Button**
   - Open or create a Canvas file
   - Look for a grid view button in the Canvas toolbar
   - The button should appear as a grid icon

3. **Plugin Settings**
   - Go to Settings > Canvasgrid Transit
   - You should see the plugin's configuration options

### Test Basic Functionality
1. **Create a Test Canvas**
   - Create a new Canvas file
   - Add a few text cards with different colors

2. **Switch to Grid View**
   - Click the grid view button in the Canvas toolbar
   - Your Canvas content should appear as organized cards

3. **Test Search**
   - Use the search box at the top of the grid view
   - Search for content in your cards

## 🔧 Configuration

### Initial Setup
After successful installation, configure the plugin for optimal use:

1. **Language Settings**
   - Go to Settings > Canvasgrid Transit
   - Choose your preferred language (English or Chinese)

2. **Grid Layout**
   - Adjust card size and spacing preferences
   - Set the number of columns or use auto-sizing

3. **Color Categories**
   - Assign meanings to Canvas colors
   - Set up color-based workflows

### Optional: Anki Integration
If you plan to use the Anki integration feature:

1. **Install Anki**
   - Download and install [Anki](https://apps.ankiweb.net/)
   - Install the [AnkiConnect add-on](https://ankiweb.net/shared/info/2055492159)

2. **Configure Connection**
   - In Canvasgrid Transit settings, go to "Anki Integration"
   - Set the AnkiConnect API endpoint (usually `http://localhost:8765`)
   - Test the connection

## 🚨 Troubleshooting

### Common Issues

**Plugin Not Appearing**
- Ensure you've enabled community plugins in Obsidian
- Check that all required files are in the correct folder
- Restart Obsidian completely

**Grid View Button Missing**
- Verify the plugin is enabled in Settings > Community plugins
- Try refreshing the Canvas view
- Check the browser console for error messages

**Performance Issues**
- Reduce the number of cards displayed simultaneously
- Enable lazy loading in plugin settings
- Close other resource-intensive plugins temporarily

**Sync Problems**
- Check that Canvas files are saved properly
- Verify file permissions in your vault folder
- Try disabling and re-enabling the plugin

### Getting Help

**Documentation**
- Check the [README.md](../README.md) for general information
- Review [FEATURES.md](FEATURES.md) for detailed feature descriptions
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for development information

**Community Support**
- [GitHub Issues](https://github.com/zhuzhige123/Canvasgrid-Transit/issues): Report bugs or request features
- [GitHub Discussions](https://github.com/zhuzhige123/Canvasgrid-Transit/discussions): Ask questions and share tips
- Obsidian Community Discord: General Obsidian plugin support

**Reporting Issues**
When reporting issues, please include:
- Obsidian version
- Operating system
- Plugin version
- Steps to reproduce the problem
- Any error messages from the console

## 🔄 Updates

### Automatic Updates (Community Plugins)
- Updates are handled automatically through Obsidian's plugin system
- You'll be notified when updates are available
- Updates can be installed with one click

### Manual Updates
- Download the latest version from GitHub Releases
- Replace the files in your plugin folder
- Restart Obsidian

### Beta Updates (BRAT)
- BRAT automatically checks for updates to beta versions
- Updates are installed automatically or with user confirmation
- You can switch back to stable versions at any time

---

For additional help or questions, please visit our [GitHub repository](https://github.com/zhuzhige123/Canvasgrid-Transit) or contact the development team.
