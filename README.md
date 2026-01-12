# LogMagnifier

A powerful log analysis tool for Visual Studio Code, featuring advanced log filtering and diverse highlighting options.

## Features

- **Filter Groups**: Organize your analysis with named groups of filters.
- **Include/Exclude Logic**:
  - **Include**: Keep and highlight lines containing specific keywords.
  - **Exclude**: Remove lines containing specific keywords (highest priority) and display matches with a strike-through or hide them completely.
- **Match Counts**: Real-time count of keyword occurrences displayed in the sidebar.
- **Search Navigation**: Quickly navigate between matches using Previous/Next buttons in the sidebar.
- **Highlighting**: Automatically highlights include type keywords in the filtered view.
- **3-Stage Highlighting**: Toggle between Word, Line, and Full Line highlight modes.
- **Expanded Colors**: 16 distinct, high-visibility colors with standardized configuration.
- **Context Lines**: View matching lines with surrounding context (±3, ±5, ±9 lines).
- **Focus Mode**: Generates a new editor tab with filtered results, enabling multi-stage filtering.
- **Regex Support**: Advanced filtering using regular expressions.
- **Expand/Collapse**: Quickly expand or collapse all filter groups in the sidebar.
- **Improved Drag & Drop**: Move filters between groups and reorder groups themselves with ease.
- **Rename**: Easily rename filter groups and individual filter keywords/nicknames.
- **Organized Context Menus**: Intuitive submenus for managing filter types, case sensitivity, and highlight modes.
- **Selection to Filter**: Quickly add selected text as a new filter via the editor context menu.
- **Persistence**: Filters are automatically saved and restored when VS Code restarts.
- **Import/Export**: Share and backup your filter configurations via JSON files.
- **Quick Access**: Toggle Word Wrap (active tab), Minimap, Sticky Scroll, and view real-time File Size (Bytes/KB/MB) from the sidebar.

## Usage

1. **Open** "LogMagnifier" from the Activity Bar (LogMagnifier icon).
2. **Open Log File**: Open the log file you wish to analyze in the editor.
3. **Manage Filters**:
    - **Add Group**: Click the folder icon to create a new Filter Group (e.g., "AuthFlow").
    - **Expand/Collapse All**: Use the **Expand/Collapse** icons in the view title to manage all groups at once.
    - **Rename**: Right-click a group or a filter item to **Rename** its keyword.
    - **Bulk Actions**: Right-click a group to **Enable All Items** or **Disable All Items**.
    - **Copy**: Right-click a group to **Copy Enabled Items** as a list or tag format.
    - **Import/Export**: Use the Export and Import icons in the view title bar to backup or share your filters.
4. **Add Filters**: Activate the group, then click the **Plus** (`+`) icon to add a keyword.
    - *Tip*: Select text in the editor, right-click, and choose **Add Selection to LogMagnifier** to instantly create a filter.
    - *Tip*: Right-click items to access organized options like **Filter Type**, **Case Sensitivity**, **Highlight Mode**, and **Context Lines**.
    - *Tip*: Click the **Arrow Up/Down** icons on a filter item to navigate to the previous or next match in the editor.
5. **Apply**: Click the **Play** icon in the view title to generate filtered results.
    - *Tip*: Toggle the **List Icon** in the view title to include original line numbers in the output.
6. **Quick Access**: Use the **Quick Access** view to toggle editor settings (Word Wrap, Minimap, Sticky Scroll) or check the current file size.
    - *Tip*: Click the **File Size** item to cycle through units (Bytes, KB, MB).

## Requirements

- VS Code 1.104.0 or higher.


## Extension Settings

This extension contributes the following settings:

* `logmagnifier.regex.enableHighlight`: Enable highlighting for Regex filters in the editor. (Default: `false`)
* `logmagnifier.regex.highlightColor`: Background color for Regex highlight. Can be a color string, a preset name, or an object with `light`/`dark` values.
* `logmagnifier.highlightColors.color01` ... `color16`: Customizable light/dark mode colors for each highlight preset.
* `logmagnifier.tempFilePrefix`: Prefix for the filtered temp files. (Default: `filtered_`)
* `logmagnifier.statusBarTimeout`: Duration for status bar messages in milliseconds. (Default: 5000)

## Known Limitations

### Large File Support & Highlighting

LogMagnifier depends on VS Code's extension capabilities to provide highlighting and navigation. There are two levels of limitations for large files:

1.  **Restricted Mode (`editor.largeFileOptimizations`)**:
    *   VS Code defaults to "restricted mode" for large files to allow them to open quickly. In this mode, extensions are disabled.
    *   To enable Highlighting, Previous Match, and Next Match commands for these files, you must disable this optimization in your VS Code settings:
        ```json
        "editor.largeFileOptimizations": false
        ```
    *   *Warning*: This may cause VS Code to freeze or perform slowly when opening very large files.

2.  **Extension Host Hard Limit (50MB)**:
    *   Even with optimizations disabled, VS Code's extension host has a hard limit. Files larger than **50MB** are **not synchronized** to extensions ([reference](https://github.com/microsoft/vscode/issues/31078)).
    *   For files > 50MB, **highlighting will not work** regardless of your settings because the text content is completely invisible to the plugin.
    *   **Workaround**: Use the **Apply Filter** (Play button) feature. This streams the file content (bypassing the editor limit) and generates a smaller filtered log file where highlighting and navigation will work perfectly.

## Credits

This project was built with **Google Antigravity**.
