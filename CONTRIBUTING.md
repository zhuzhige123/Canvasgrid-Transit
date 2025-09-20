# Contributing to Canvasgrid Transit

Thank you for your interest in contributing to Canvasgrid Transit! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- **Bug Reports**: Use the [GitHub Issues](https://github.com/zhuzhige123/Canvasgrid-Transit/issues) to report bugs
- **Feature Requests**: Submit feature requests through GitHub Issues with the "enhancement" label
- **Questions**: Use [GitHub Discussions](https://github.com/zhuzhige123/Canvasgrid-Transit/discussions) for questions

### Development Workflow

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/Canvasgrid-Transit.git
   cd Canvasgrid-Transit
   ```

2. **Set Up Development Environment**
   ```bash
   cd canvas-grid-plugin
   npm install
   npm run dev
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes and Test**
   ```bash
   npm run build
   npm test
   ```

5. **Submit a Pull Request**
   - Ensure all tests pass
   - Include clear description of changes
   - Reference related issues

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting and naming conventions
- Add JSDoc comments for public APIs
- Maintain consistent indentation (tabs)

### Testing
- Write unit tests for new features
- Ensure existing tests continue to pass
- Test with different Obsidian themes and configurations

### Documentation
- Update README.md for user-facing changes
- Add inline code comments for complex logic
- Update CHANGELOG.md for notable changes

## 🏗️ Project Structure

```
canvas-grid-plugin/
├── src/                    # Source code
│   ├── managers/          # Core managers
│   ├── renderers/         # UI renderers
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── tests/                 # Test files
├── docs/                  # Documentation
├── main.ts               # Main plugin file
├── styles.css            # Plugin styles
└── manifest.json         # Plugin manifest
```

## 🎯 Areas for Contribution

### High Priority
- **Performance Optimization**: Improve rendering speed for large Canvas files
- **Mobile Support**: Enhance mobile user experience
- **Accessibility**: Improve keyboard navigation and screen reader support

### Medium Priority
- **New Features**: Time capsule enhancements, additional export formats
- **UI/UX Improvements**: Better visual feedback, smoother animations
- **Integration**: Support for additional Obsidian plugins

### Low Priority
- **Documentation**: Improve user guides and developer documentation
- **Testing**: Expand test coverage
- **Localization**: Add support for additional languages

## 🔧 Technical Requirements

### Development Environment
- **Node.js**: Version 16 or higher
- **npm**: Latest stable version
- **Obsidian**: Latest version for testing
- **TypeScript**: Version 5.0 or higher

### Dependencies
- **Obsidian API**: Latest version
- **esbuild**: For building and bundling
- **Jest**: For testing

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes
- **refactor**: Code refactoring
- **test**: Test additions or modifications
- **chore**: Build process or auxiliary tool changes

### Examples
```
feat(search): add fuzzy search functionality
fix(drag): resolve drag and drop positioning issue
docs(readme): update installation instructions
```

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] Update version in `manifest.json`, `package.json`, and `versions.json`
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
- [ ] Build and test in clean Obsidian environment
- [ ] Create GitHub release with release notes

## 🎨 Design Principles

### User Experience
- **Intuitive**: Features should be discoverable and easy to use
- **Consistent**: Follow Obsidian's design language and conventions
- **Responsive**: Work well on different screen sizes
- **Accessible**: Support keyboard navigation and screen readers

### Code Quality
- **Maintainable**: Write clean, readable code
- **Testable**: Design for easy testing
- **Performant**: Optimize for speed and memory usage
- **Secure**: Follow security best practices

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: For private inquiries

### Resources
- [Obsidian Plugin Developer Documentation](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

## 📄 License

By contributing to Canvasgrid Transit, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Canvasgrid Transit! 🎉
