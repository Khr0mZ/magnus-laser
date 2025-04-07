# Storage Improvements in Magnus Laser

## Storage Strategy

The application now uses IndexedDB for data storage through localForage, providing several advantages over the previous localStorage implementation:

### Benefits of IndexedDB via localForage

1. **Higher Storage Limits**: Unlike localStorage's 5-10MB limit, IndexedDB can store substantially more data (typically 50-100MB or more depending on the browser), which is especially helpful for storing images.

2. **Better Performance**: IndexedDB is optimized for storing and retrieving larger amounts of data and complex objects.

3. **Asynchronous API**: Unlike localStorage's synchronous nature which can block the main thread, IndexedDB operations are asynchronous, improving application responsiveness.

4. **Structured Storage**: IndexedDB provides a more robust database-like structure compared to the simple key-value pairs of localStorage.

5. **Simplified API**: The localForage library provides a simple, Promise-based API similar to localStorage while leveraging IndexedDB's advantages under the hood.

### Implementation Details

-   The migration from localStorage to IndexedDB happens automatically when the app starts.
-   A data context (`DataContext`) manages the centralized loading and storing of application data.
-   Synchronous fallback functions are provided to ensure a smooth transition from localStorage.
-   All storage operations are Promise-based and properly handled with try/catch blocks.

### Future Improvements

-   Implement proper versioning and schema upgrades for IndexedDB
-   Add compression for image data to further optimize storage usage
-   Consider adding offline synchronization capabilities

## Usage

The storage API is designed to be simple to use, mimicking the previous localStorage API but with Promise-based async functions:

```typescript
// Saving data
await saveBuildings(buildings)

// Loading data
const buildings = await loadBuildings()

// Clearing data
await clearBuildings()
```

For components that need access to the centralized data store, use the DataContext:

```typescript
// In a component
const { buildings, setBuildings, isLoading } = useData()
```
