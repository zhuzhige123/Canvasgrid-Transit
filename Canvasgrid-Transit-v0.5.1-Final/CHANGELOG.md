# Changelog

All notable changes to Canvasgrid Transit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2025-01-06

### 🎉 Major Release - Plugin Rebranding and Feature Enhancement

### 🔧 Latest Hotfixes (2025-01-06)

#### 🐛 Critical Bug Fixes
- **Fixed view initialization errors**: Resolved "Cannot read properties of undefined (reading 'settings')" error
- **Fixed multi-language system**: Resolved "ReferenceError: zh is not defined" error
- **Fixed sorting functionality**: Restored sorting feature that was not working properly
- **Fixed return button icon size**: Optimized return button icon display size and positioning

#### 🎨 UI/UX Improvements
- **Return button optimization**: Improved icon size (16px → 14px) and perfect centering in 28px circular button
- **Hover effects**: Enhanced hover animations with more natural scaling (1.1 → 1.05)
- **CSS cleanup**: Removed duplicate styles and improved code quality
- **Visual consistency**: Better alignment with overall UI design system

#### ✨ Added
- **Time Capsule Feature**: Revolutionary content collection system inspired by Smartisan's time capsule
  - Countdown timer (5-60 minutes configurable)
  - Automatic group creation for collected content
  - Smart positioning to avoid overlapping with existing groups
  - Visual countdown display and collection status
  - Hotkey-based content capture during active collection

- **Fast Bookmarks**: Lightning-fast web link parsing and display
  - Instant basic bookmark display (<100ms response time)
  - Smart title extraction from URLs
  - Asynchronous detailed metadata enhancement
  - Google favicon service integration
  - Fallback mechanisms for reliability

- **Enhanced Group Management**: Improved Canvas group handling
  - Groups display as cards in grid view
  - Click to enter detailed group interface
  - Drag-and-drop content management within groups
  - Right-click group name editing with Canvas sync
  - Return button for easy navigation

- **Smart Color System**: Configurable color categories
  - Red = Important, Yellow = Todo, Blue = Notes, Purple = Inspiration, Cyan = Collected
  - One-click color filtering (non-additive)
  - Color tooltips with category names
  - Unified color settings interface

- **Multi-language Support**: Complete internationalization
  - Chinese and English interface switching
  - All UI elements and messages translated
  - Language preference persistence

#### 🔄 Changed
- **Plugin Name**: Canvas Grid View → **Canvasgrid Transit**
- **Version Reset**: Starting fresh with v0.5.1 for new branding
- **Repository**: Moved to https://github.com/zhuzhige123/Canvasgrid-Transit
- **Interface Design**: Modernized UI with responsive layout
- **Search System**: Enhanced full-text search for content, filenames, and URLs
- **Settings Organization**: Streamlined settings interface with logical grouping

#### 🛠️ Improved
- **Performance**: Optimized rendering and search algorithms
- **Responsive Design**: Better adaptation to different screen sizes
- **User Experience**: Simplified workflows and intuitive interactions
- **Code Quality**: Comprehensive refactoring and type safety improvements
- **Documentation**: Complete README rewrite with detailed feature descriptions

#### 🐛 Fixed
- Grid layout issues on narrow screens
- Search performance with large Canvas files
- Color filter synchronization problems
- Group editing conflicts with Canvas
- Memory leaks in bookmark parsing

#### 🗑️ Removed
- Manual card size adjustment options (replaced with responsive design)
- Background frames from color dots
- Bottom horizontal scrollbar
- Quick start guide from settings (simplified interface)

### 🙏 Acknowledgments
- Special thanks to the Obsidian team for the excellent platform
- Time capsule design inspiration from Smartisan/Hammer Technology
- Community feedback that shaped this major update

---

## [0.4.0] - 2024-12-15

### Added
- Canvas group support with expandable cards
- Web bookmark preview functionality
- Real-time synchronization with Canvas
- Color-based filtering system

### Improved
- Search performance and accuracy
- Grid layout responsiveness
- User interface design

### Fixed
- Canvas data loading issues
- Grid view refresh problems

---

## [0.3.0] - 2024-11-20

### Added
- Direct card editing in grid view
- Advanced search capabilities
- Node focus functionality
- Settings panel

### Changed
- Improved grid layout algorithm
- Enhanced visual design

---

## [0.2.0] - 2024-10-25

### Added
- Basic grid view functionality
- Search and filter capabilities
- Canvas integration

### Fixed
- Initial stability issues

---

## [0.1.0] - 2024-10-01

### Added
- Initial release
- Basic Canvas to grid conversion
- Simple card display

---

## 🔮 Upcoming Features

### v0.6.0 (Planned)
- [ ] Advanced time capsule analytics
- [ ] Bookmark collections and tagging
- [ ] Enhanced drag-and-drop between Canvas and grid
- [ ] Plugin API for third-party integrations

### v0.7.0 (Planned)
- [ ] AI-powered content organization
- [ ] Advanced search with filters
- [ ] Team collaboration features
- [ ] Mobile optimization

### v1.0.0 (Future)
- [ ] Stable API
- [ ] Complete feature set
- [ ] Performance optimizations
- [ ] Comprehensive documentation

---

## 📝 Notes

### Version Numbering
- **Major** (x.0.0): Breaking changes or major feature additions
- **Minor** (0.x.0): New features, backward compatible
- **Patch** (0.0.x): Bug fixes and small improvements

### Support
- **Current Version**: v0.5.1 (actively supported)
- **Previous Versions**: Limited support for critical bugs only
- **Minimum Obsidian**: v0.15.0

### Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

### Support
See [SUPPORT.md](SUPPORT.md) for information on getting help and supporting the project.
