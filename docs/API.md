# API Documentation - Canvasgrid Transit

This document provides technical information about Canvasgrid Transit's internal APIs and extension points for developers.

## 🏗️ Plugin Architecture

### Core Components

**CanvasGridPlugin**
- Main plugin class extending Obsidian's Plugin
- Manages plugin lifecycle and initialization
- Coordinates between different managers

**Managers**
- `UIComponentManager`: Handles UI rendering and interactions
- `SearchAndFilterManager`: Manages search and filtering functionality
- `DragDropManager`: Handles drag and drop operations
- `CanvasAPIManager`: Interfaces with Obsidian's Canvas API
- `AnkiSyncManager`: Manages Anki integration
- `FileSystemManager`: Handles file operations

**Renderers**
- `CardRenderer`: Renders individual cards in grid view
- `GridRenderer`: Manages the overall grid layout
- `ModalRenderer`: Handles modal dialogs and popups

## 📡 Public APIs

### Plugin Instance Access

```typescript
// Access the plugin instance
const plugin = this.app.plugins.plugins['canvasgrid-transit'];
if (plugin) {
    // Plugin is available and enabled
}
```

### Canvas Grid View

```typescript
// Open a Canvas file in grid view
await plugin.openCanvasInGridView(canvasFile: TFile);

// Switch existing Canvas to grid view
await plugin.switchToGridView(canvasLeaf: WorkspaceLeaf);

// Get current grid view state
const isGridView = plugin.isCurrentViewGridView();
```

### Search and Filtering

```typescript
// Perform search
const results = await plugin.searchManager.search({
    query: "search term",
    includeContent: true,
    includeFilenames: true,
    includeUrls: true
});

// Apply filters
await plugin.searchManager.applyFilters({
    colors: ['1', '4'], // Red and Green
    types: ['text', 'file'],
    dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
    }
});
```

### Card Operations

```typescript
// Get all cards in current view
const cards = plugin.getCurrentCards();

// Update card content
await plugin.updateCard(cardId: string, newContent: string);

// Delete cards
await plugin.deleteCards(cardIds: string[]);

// Move cards
await plugin.moveCards(cardIds: string[], targetPosition: Position);
```

## 🔌 Extension Points

### Custom Card Renderers

```typescript
// Register a custom card renderer
plugin.registerCardRenderer('custom-type', {
    render: (card: CanvasNode, container: HTMLElement) => {
        // Custom rendering logic
    },
    update: (card: CanvasNode, container: HTMLElement) => {
        // Update logic
    }
});
```

### Search Providers

```typescript
// Register a custom search provider
plugin.registerSearchProvider('custom-search', {
    search: async (query: string, options: SearchOptions) => {
        // Custom search logic
        return searchResults;
    },
    priority: 10 // Higher priority = searched first
});
```

### Filter Providers

```typescript
// Register a custom filter
plugin.registerFilter('custom-filter', {
    name: 'Custom Filter',
    apply: (cards: CanvasNode[], filterValue: any) => {
        // Filter logic
        return filteredCards;
    },
    renderUI: (container: HTMLElement, onChange: (value: any) => void) => {
        // Render filter UI
    }
});
```

## 📊 Data Structures

### CanvasNode (Extended)

```typescript
interface CanvasNode {
    id: string;
    type: 'text' | 'file' | 'link' | 'group';
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    text?: string;
    file?: string;
    url?: string;
    
    // Extended properties
    metadata?: {
        created: number;
        modified: number;
        tags: string[];
        backlinks: string[];
    };
}
```

### SearchResult

```typescript
interface SearchResult {
    card: CanvasNode;
    matches: SearchMatch[];
    score: number;
}

interface SearchMatch {
    field: 'content' | 'filename' | 'url';
    text: string;
    start: number;
    end: number;
}
```

### GridViewState

```typescript
interface GridViewState {
    canvasFile: TFile;
    cards: CanvasNode[];
    searchQuery: string;
    activeFilters: FilterState[];
    sortOrder: SortOrder;
    selectedCards: string[];
}
```

## 🎣 Event System

### Plugin Events

```typescript
// Listen for grid view events
plugin.on('grid-view-opened', (canvasFile: TFile) => {
    // Handle grid view opened
});

plugin.on('grid-view-closed', (canvasFile: TFile) => {
    // Handle grid view closed
});

plugin.on('cards-updated', (cards: CanvasNode[]) => {
    // Handle card updates
});
```

### Search Events

```typescript
// Listen for search events
plugin.searchManager.on('search-started', (query: string) => {
    // Handle search start
});

plugin.searchManager.on('search-completed', (results: SearchResult[]) => {
    // Handle search completion
});
```

### Drag and Drop Events

```typescript
// Listen for drag and drop events
plugin.dragDropManager.on('drag-started', (cardIds: string[]) => {
    // Handle drag start
});

plugin.dragDropManager.on('drop-completed', (result: DropResult) => {
    // Handle drop completion
});
```

## 🔧 Configuration API

### Settings Management

```typescript
// Get current settings
const settings = plugin.settings;

// Update settings
await plugin.updateSettings({
    language: 'en',
    gridColumns: 4,
    cardSpacing: 16
});

// Reset to defaults
await plugin.resetSettings();
```

### Color Configuration

```typescript
// Get color configuration
const colorConfig = plugin.getColorConfiguration();

// Update color meanings
await plugin.updateColorConfiguration({
    '1': { name: 'Important', description: 'High priority items' },
    '2': { name: 'Tasks', description: 'Action items' }
});
```

## 🧪 Testing APIs

### Mock Data Generation

```typescript
// Generate test Canvas data
const testCanvas = plugin.generateTestCanvas({
    cardCount: 20,
    colors: ['1', '2', '3'],
    types: ['text', 'file']
});

// Create test environment
await plugin.setupTestEnvironment();
```

### Performance Monitoring

```typescript
// Start performance monitoring
plugin.startPerformanceMonitoring();

// Get performance metrics
const metrics = plugin.getPerformanceMetrics();

// Stop monitoring
plugin.stopPerformanceMonitoring();
```

## 🔒 Security Considerations

### Data Validation

All API inputs are validated to prevent:
- XSS attacks through malicious content
- Path traversal attacks in file operations
- SQL injection in search queries
- Buffer overflow in large data operations

### Permission Checks

APIs verify:
- File access permissions
- Plugin enable status
- User interaction context
- Canvas file ownership

## 📈 Performance Guidelines

### Best Practices

**Batch Operations**
```typescript
// Good: Batch multiple updates
await plugin.updateCards([
    { id: 'card1', content: 'new content 1' },
    { id: 'card2', content: 'new content 2' }
]);

// Avoid: Individual updates
await plugin.updateCard('card1', 'new content 1');
await plugin.updateCard('card2', 'new content 2');
```

**Lazy Loading**
```typescript
// Use lazy loading for large datasets
const cards = await plugin.getCards({
    limit: 50,
    offset: 0,
    lazy: true
});
```

**Memory Management**
```typescript
// Clean up event listeners
plugin.off('cards-updated', handler);

// Dispose of large objects
plugin.disposeResources();
```

## 🐛 Debugging

### Debug Mode

```typescript
// Enable debug mode
plugin.enableDebugMode();

// Log debug information
plugin.debug('Operation completed', { data: result });

// Get debug logs
const logs = plugin.getDebugLogs();
```

### Error Handling

```typescript
try {
    await plugin.performOperation();
} catch (error) {
    if (error instanceof CanvasGridError) {
        // Handle plugin-specific errors
        console.error('Plugin error:', error.message);
    } else {
        // Handle general errors
        console.error('Unexpected error:', error);
    }
}
```

---

For more technical information, see the source code documentation and TypeScript definitions in the `src/` directory.
