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