# Changelog

All notable changes to Canvasgrid Transit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2025-01-14

### Fixed
- **CSS Style Leakage**: Resolved critical issue where plugin styles were affecting Obsidian's startup loading interface
- **Animation Conflicts**: Fixed global animation keyframe conflicts by adding `cgt-` prefix to all animations
- **Namespace Isolation**: Properly scoped all CSS selectors to prevent global style pollution
- **Modal Button Styles**: Limited modal button styles to plugin containers only

### Changed
- **Version Consistency**: Updated all version references to 0.5.1 across manifest, package.json, and UI
- **CSS Architecture**: Implemented comprehensive CSS namespace isolation strategy
- **Animation Naming**: Standardized all animation names with plugin-specific prefixes

### Technical
- **Build Process**: Enhanced build validation and file copying
- **Style Management**: Improved CSS organization and scoping
- **Performance**: Reduced style conflicts and improved loading performance

## [0.5.0] - 2025-01-13

### Added
- **Anki Connect Integration**: Full integration with Anki for spaced repetition learning
- **Color-based Sync**: Selective synchronization based on Canvas color categories
- **Batch Processing**: Efficient handling of large card collections for Anki sync
- **Progress Tracking**: Visual progress indicators for sync operations

### Enhanced
- **Time Capsule Feature**: Improved content collection with better positioning
- **Search Functionality**: Enhanced full-text search with better performance
- **Drag & Drop**: Refined drag and drop operations with visual feedback
- **User Interface**: Polished UI elements and improved user experience

### Fixed
- **Backlink Creation**: Resolved issues with automatic backlink generation
- **Canvas Synchronization**: Improved bidirectional sync reliability
- **Group Management**: Fixed group expansion and navigation issues

## [0.4.0] - 2025-01-10

### Added
- **Time Capsule System**: Revolutionary content collection feature with timer functionality
- **Smart Positioning**: Automatic group placement to avoid overlaps
- **Block Reference Integration**: Seamless Obsidian block reference creation
- **Content Locating**: Intelligent search for cards without backlinks

### Improved
- **Grid Layout**: Enhanced responsive design with better card sizing
- **Color Management**: Refined color system with custom labels
- **Search Performance**: Optimized search algorithms for better speed
- **Mobile Support**: Improved mobile device compatibility

### Fixed
- **Memory Leaks**: Resolved resource cleanup issues
- **Theme Compatibility**: Fixed dark/light theme switching problems
- **Canvas Loading**: Improved Canvas file loading reliability

## [0.3.0] - 2025-01-05

### Added
- **Advanced Search**: Full-text search across content, filenames, and URLs
- **Color Filtering**: One-click filtering by Canvas color categories
- **Group Management**: Special handling for Canvas groups with expandable views
- **Real-time Editing**: Direct card content editing in grid view

### Enhanced
- **Drag & Drop**: Improved drag and drop with better visual feedback
- **Responsive Design**: Better adaptation to different screen sizes
- **Performance**: Optimized rendering for large Canvas files
- **Accessibility**: Improved keyboard navigation support

### Fixed
- **Sync Issues**: Resolved bidirectional synchronization problems
- **UI Glitches**: Fixed various interface rendering issues
- **Error Handling**: Improved error messages and recovery

## [0.2.0] - 2024-12-28

### Added
- **Grid View Display**: Transform Canvas files into organized card layouts
- **Canvas Integration**: Seamless conversion of Canvas nodes to cards
- **Multi-Canvas Support**: Switch between different Canvas files
- **Basic Search**: Simple content search functionality

### Enhanced
- **User Interface**: Clean and intuitive design following Obsidian conventions
- **Theme Integration**: Automatic theme adaptation (light/dark)
- **Navigation**: Easy switching between Canvas and grid views

### Fixed
- **Initial Bugs**: Resolved early stability issues
- **Performance**: Optimized initial rendering performance

## [0.1.0] - 2024-12-20

### Added
- **Initial Release**: Basic grid view functionality for Canvas files
- **Card Display**: Simple card-based representation of Canvas nodes
- **Basic Navigation**: Switch between Canvas and grid views
- **Foundation**: Core architecture and plugin structure

### Technical
- **Plugin Architecture**: Established modular plugin structure
- **TypeScript**: Full TypeScript implementation
- **Obsidian API**: Integration with Obsidian plugin API
- **Build System**: Set up development and build processes

---

## Upcoming Features

### Planned for v0.6.0
- **Enhanced Mobile Support**: Improved mobile user experience
- **Performance Optimizations**: Better handling of large Canvas files
- **Additional Export Formats**: More options for exporting content
- **Improved Accessibility**: Enhanced keyboard navigation and screen reader support

### Future Considerations
- **Plugin Integrations**: Compatibility with other popular Obsidian plugins
- **Advanced Analytics**: Usage insights and productivity metrics
- **Cloud Synchronization**: Optional cloud sync capabilities
- **Custom Themes**: User-customizable card themes and layouts

---


changechangechange
change2change2change2


For detailed information about each release, visit our [GitHub Releases](https://github.com/zhuzhige123/Canvasgrid-Transit/releases) page.
