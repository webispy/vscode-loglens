# Change Log

All notable changes to the "LogMagnifier" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.9.0]

### Added
- **Filter Types**: Added toggle for include/exclude filter types.
- **Context Menu**: Added "Add Selection to LogMagnifier" context menu command.
- **Export**: Included version in exported JSON.

### Changed
- **UI**: Enabled cross-group filter movement.
- **UX**: Simplified word filter creation workflow.

### Fixed
- **Filters**: Removed background color for exclude filters.

### Refactored
- **Codebase**: Centralized configuration keys.
- **Performance**: Optimized LogProcessor and fixed highlight sync.

## [0.8.0]

### Added
- **Quick Access View**: Added new Quick Access view for utility toggles and file size display.
- **Import/Export**: Added support for importing and exporting Word and Regex filters.
- **File Size Display**: Display file size in Quick Access view with improved formatting.

### Fixed
- **Regex Filters**: Fixed issue where regex keyword was not displayed in filter items.
- **Line Numbers**: Corrected behavior of line number toggle and fixed potential format issues.
- **UI**: Standardized helper text and tooltips.

### Refactored
- **Color Presets**: Centralized and standardized color presets configuration.
- **Settings**: Grouped Regex settings for better usability.

## [0.7.0]

### Added
- **Line Numbers**: Added toggle to prepend original line numbers to filtered output.
- **Exclude Filters**: Enhanced exclude filter behavior with navigation (prev/next match) and strike-through styling.
- **UI**: Added color code to "Change color" tooltip and updated filter group creation icons.
- **Large Files**: Improved large file handling with status messages.

### Refactored
- **Performance**: Optimized highlighting logic, fixed recursion loops, and improved internal structure.

## [0.6.0]

### Added
- **Debug Logger**: Implemented internal debug logger for better diagnostics.

### Fixed
- **Large File Handling**: Improved stability by disabling highlights and clearing counts for large parsed files.
- **Icon**: Fixed extension icon transparent background.

### Refactored
- **Color Presets**: Refined color presets for better distinction and optimized color usage.
- **Configuration**: Renamed `logmagnifier.highlightColor` to `logmagnifier.regexHighlightColor` and added support for theme-specific colors.
- **UI**: Enhanced inline action buttons for filters.

## [0.5.0]

### Added
- **Context Line Feature**: View surrounding log lines for better context.
- **License**: Added Apache 2.0 LICENSE file.

### Fixed
- **Icon Visibility**: Resolved transparent background and dark mode visibility issues for icons.
- **Documentation**: Synced README with current features and removed unused files.
- **Naming**: Consistent extension renaming to "LogMagnifier".

## [0.4.0]

### Added
- **3-Stage Highlight Mode**: Supports cycling through Word, Line, and Whole Line highlight modes for better visibility.
- **Search Navigation**: Added Previous/Next match buttons to each filter item in the Word/Regex filters side panel.
- **Match Counts**: Display the number of keyword occurrences directly in the TreeView for easier analysis.

### Fixed
- **Stability**: Prevented creation of duplicate filter groups and items.
- **Filtering Logic**: Improved separation between Word and Regex filtering for a more predictable experience.

## [0.3.0]

### Added
- **Drag and Drop**: Reorder filters easily within the list using drag and drop.
- **Improved Filter Context Menu**: Reordered actions for better accessibility (Color > Highlight > Case > Delete > Toggle).
- **Refined UI**: Updated word filter icons to be more distinct and highlight icon to be a rounded box.
- **Expanded Colors**: Added 8 more color presets (total 16) and improved color selection dialog with previews.
- **Temp File Naming**: Updated temporary file timestamp format to `YYMMDD_HHMMSS` for better sorting.

## [0.2.0]

### Added
- **Regex Filtering**: Use regular expressions to filter logs with a dedicated side panel view.
- **Default Filters**: Included standard presets for "Logcat" and "Process Info".
- **Large File Support**: Improved handling for large filtered files with configurable size thresholds (`logmagnifier.maxFileSizeMB`).
- **Configuration**: Added user settings for highlight colors, temp file prefixes, and status bar timeouts.

### Fixed
- **Icon Rendering**: Resolved issues with LogMagnifier icon not appearing correctly in the Activity Bar.
- **Performance**: Disabled keyword highlighting for regex-based filters to improve performance.

## [0.1.0]
- Initial release.
- Stream-based large file processing.
- Persistent filter groups per session.
- Inline UX for managing filters.