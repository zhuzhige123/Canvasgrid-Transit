# Canvasgrid Transit
hello

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md/)
[![Version](https://img.shields.io/badge/version-0.5.1-blue.svg)](https://github.com/zhuzhige123/Canvasgrid-Transit/releases)

A powerful grid-based plugin for Obsidian Canvas that transforms your Canvas files into organized, searchable card layouts with advanced features like drag-and-drop, time capsule, Anki integration, and intelligent content management.

## ✨ Key Features

### 🎯 **Grid View Display**
- **Responsive Grid Layout**: Automatically adapts to screen width with customizable card sizes
- **Canvas Integration**: Seamlessly converts Canvas nodes into organized card layouts
- **Real-time Sync**: Bidirectional synchronization between grid view and Canvas whiteboard
- **Multi-Canvas Support**: Switch between different Canvas files through integrated sidebar

### 🔍 **Smart Search & Filtering**
- **Full-text Search**: Search across content, filenames, and URLs with instant results
- **Color-based Filtering**: Filter cards by Canvas colors with one-click color dots
- **Advanced Sorting**: Sort by creation time, modification time, or title
- **Group Management**: Special handling for Canvas groups with expandable card views

### 🎨 **Color Management System**
- **Official Canvas Colors**: Full support for all 7 Canvas color categories
- **Custom Color Labels**: Configurable color meanings (Important, Todo, Notes, etc.)
- **Visual Indicators**: Clear color dots and borders for easy identification
- **Batch Color Operations**: Apply colors to multiple cards simultaneously

### 🚀 **Drag & Drop Operations**
- **Intuitive Reordering**: Drag cards to rearrange positions in Canvas
- **Cross-Canvas Movement**: Move cards between different Canvas files
- **Smart Backlink Creation**: Automatically creates backlinks when dragging from editor
- **Visual Feedback**: Real-time visual indicators during drag operations

### ⏰ **Time Capsule Feature**
- **Content Collection**: Set timers to collect and organize content within specific timeframes
- **Smart Positioning**: Automatically positions time capsule groups to avoid overlaps
- **Progress Tracking**: Visual countdown and collection progress indicators
- **Flexible Duration**: Customizable time periods from minutes to hours

### 🔗 **Block Reference Integration**
- **Automatic Backlinks**: Creates Obsidian block references for seamless navigation
- **Source Tracking**: Maintains connections to original document locations
- **Quick Navigation**: One-click jump to source content in original files
- **Content Locating**: Intelligent content search for cards without backlinks

### 🃏 **Anki Connect Integration**
- **Spaced Repetition**: Sync Canvas cards to Anki for efficient learning
- **Color-based Sync**: Selectively sync cards based on color categories
- **Incremental Updates**: Smart detection of changed content to avoid duplicates
- **Batch Processing**: Efficient handling of large card collections

### 📱 **User Experience**
- **Responsive Design**: Optimized for different screen sizes and devices
- **Theme Compatibility**: Seamless integration with Obsidian themes (light/dark)
- **Multilingual Support**: Full support for English and Chinese interfaces
- **Keyboard Shortcuts**: Efficient keyboard navigation and operations

## 📦 Installation

### Method 1: Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Navigate to Community Plugins
3. Search for "Canvasgrid Transit"
4. Click Install and Enable

### Method 2: Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/zhuzhige123/Canvasgrid-Transit/releases)
2. Extract files to your vault's plugins folder: `VaultFolder/.obsidian/plugins/canvasgrid-transit/`
3. Reload Obsidian and enable the plugin in Settings > Community Plugins

### Method 3: BRAT Plugin (Beta Testing)
1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. Add this repository: `zhuzhige123/Canvasgrid-Transit`
3. Enable the plugin in Settings > Community Plugins

## 🚀 Quick Start

### Basic Usage
1. **Open or create a Canvas file** in Obsidian
2. **Click the grid view button** in the Canvas toolbar to switch to grid layout
3. **Use the search box** at the top to find specific content
4. **Click color dots** below the search box to filter by colors
5. **Double-click any card** to edit its content directly
6. **Right-click cards** for additional options and actions

### Advanced Features
- **Time Capsule**: Click the hourglass button to start collecting content with a timer
- **Anki Sync**: Access through the export panel to sync cards for spaced repetition
- **Backlink Navigation**: Right-click cards and select "Backlink" to jump to source content
- **Group Expansion**: Click group cards to view and manage group members
- **Cross-Canvas Operations**: Use the sidebar to switch between different Canvas files

## ⚙️ Configuration

Access plugin settings through **Settings > Canvasgrid Transit**:

### Basic Settings
- **Language**: Switch between English and Chinese interfaces
- **Grid Layout**: Customize card sizes and spacing
- **Search Behavior**: Configure search sensitivity and filters

### Color Categories
- **Color Meanings**: Assign semantic meanings to Canvas colors
- **Filter Presets**: Create quick-access color filter combinations
- **Visual Indicators**: Customize color display preferences

### Anki Integration
- **Connection Settings**: Configure Anki Connect API endpoint
- **Sync Options**: Set up deck names, card templates, and sync preferences
- **Color Filtering**: Choose which colors to sync to Anki

### Time Capsule
- **Default Duration**: Set standard time periods for content collection
- **Auto-positioning**: Configure smart group placement behavior
- **Collection Behavior**: Customize how content is gathered and organized

## 🔧 Technical Requirements

- **Obsidian Version**: 1.0.0 or higher
- **Platform**: Desktop (Windows, macOS, Linux) and Mobile
- **Dependencies**: No external dependencies required
- **Optional**: Anki with AnkiConnect plugin for spaced repetition features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/zhuzhige123/Canvasgrid-Transit.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building
```bash
# Build for production
npm run build

# Run tests
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to the Obsidian team for creating an amazing platform
- Special thanks to the Canvas API and plugin development community
- Inspired by various grid layout and card management solutions

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/zhuzhige123/Canvasgrid-Transit/issues)
- **Discussions**: [Community discussions and Q&A](https://github.com/zhuzhige123/Canvasgrid-Transit/discussions)
- **Email**: For private inquiries and support

---

**Made with ❤️ for the Obsidian community**
