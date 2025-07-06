# Contributing to Canvasgrid Transit

Thank you for your interest in contributing to Canvasgrid Transit! We welcome contributions from the community and are grateful for any help you can provide.

## 🤝 Ways to Contribute

### 🐛 Bug Reports
Help us improve by reporting bugs:
- Use the [Bug Report Template](https://github.com/zhuzhige123/Canvasgrid-Transit/issues/new?template=bug_report.md)
- Include steps to reproduce the issue
- Provide your Obsidian version and plugin version
- Include screenshots if applicable

### 💡 Feature Requests
Suggest new features or improvements:
- Use the [Feature Request Template](https://github.com/zhuzhige123/Canvasgrid-Transit/issues/new?template=feature_request.md)
- Explain the use case and benefits
- Provide mockups or examples if possible

### 📖 Documentation
Improve documentation:
- Fix typos or unclear instructions
- Add usage examples
- Improve README or other docs
- Create tutorials or guides

### 💻 Code Contributions
Contribute code improvements:
- Fix bugs
- Add new features
- Improve performance
- Write tests

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git
- Obsidian (for testing)

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Canvasgrid-Transit.git
   cd Canvasgrid-Transit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up development environment**
   ```bash
   # Build for development (with watch mode)
   npm run dev
   
   # Or build once
   npm run build
   ```

4. **Link to Obsidian**
   ```bash
   # Copy files to your Obsidian plugins folder
   # Example path: /path/to/vault/.obsidian/plugins/canvasgrid-transit/
   ```

### Development Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   - Test in Obsidian
   - Verify all existing features still work
   - Test edge cases

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve bug description"
   ```

5. **Push and create PR**
   ```bash
   git push origin your-branch-name
   # Then create a Pull Request on GitHub
   ```

## 📝 Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for type safety
- Follow existing naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for public methods

### Code Organization
- Keep functions focused and small
- Separate concerns into different methods
- Use consistent indentation (tabs)
- Follow existing file structure

### Comments
- Explain complex logic
- Use TODO comments for future improvements
- Keep comments up to date with code changes

## 🧪 Testing

### Manual Testing
- Test in different Obsidian versions
- Test with various Canvas configurations
- Verify time capsule functionality
- Test bookmark parsing with different URLs
- Check multi-language support

### Test Cases to Cover
- Basic grid view functionality
- Search and filtering
- Time capsule creation and collection
- Bookmark parsing and display
- Group management
- Settings changes
- Language switching

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Code follows the style guidelines
- [ ] Changes have been tested thoroughly
- [ ] Documentation has been updated if needed
- [ ] Commit messages are clear and descriptive

### PR Description
Include in your PR description:
- What changes were made
- Why the changes were necessary
- How to test the changes
- Screenshots if UI changes were made
- Any breaking changes

### Review Process
1. Automated checks will run
2. Maintainers will review the code
3. Address any feedback
4. Once approved, changes will be merged

## 🏗️ Project Structure

```
Canvasgrid-Transit/
├── main.ts              # Main plugin file
├── styles.css           # Plugin styles
├── manifest.json        # Plugin manifest
├── package.json         # Dependencies
├── esbuild.config.mjs   # Build configuration
├── versions.json        # Version compatibility
├── README.md            # Project documentation
├── CONTRIBUTING.md      # This file
├── SUPPORT.md           # Support information
└── LICENSE              # MIT License
```

### Key Files
- **main.ts**: Core plugin logic, UI components, and functionality
- **styles.css**: All CSS styles for the plugin interface
- **manifest.json**: Plugin metadata and configuration
- **package.json**: Node.js dependencies and build scripts

## 🎯 Development Focus Areas

### High Priority
- Performance improvements
- Bug fixes
- User experience enhancements
- Documentation improvements

### Medium Priority
- New features
- Code refactoring
- Test coverage
- Accessibility improvements

### Future Considerations
- Mobile support
- Plugin integrations
- Advanced features
- Internationalization

## 📞 Getting Help

### Questions?
- Check existing [Issues](https://github.com/zhuzhige123/Canvasgrid-Transit/issues)
- Start a [Discussion](https://github.com/zhuzhige123/Canvasgrid-Transit/discussions)
- Contact the developer: tutaoyuan8@outlook.com

### Stuck?
- Review the codebase for similar implementations
- Check Obsidian's plugin development documentation
- Ask for help in the discussions

## 🙏 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Recognized in the plugin's about section

## 📄 License

By contributing to Canvasgrid Transit, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Canvasgrid Transit!** 

Your contributions help make this plugin better for the entire Obsidian community.
