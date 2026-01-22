/**
 * Centralized constants for the extension.
 * These values MUST match the definitions in package.json.
 */

export const Constants = {
    ExtensionId: 'logmagnifier',

    Commands: {
        AddFilterGroup: 'logmagnifier.addFilterGroup',
        AddRegexFilterGroup: 'logmagnifier.addRegexFilterGroup',
        AddFilter: 'logmagnifier.addFilter',
        AddRegexFilter: 'logmagnifier.addRegexFilter',
        ApplyWordFilter: 'logmagnifier.applyWordFilter',
        ApplyRegexFilter: 'logmagnifier.applyRegexFilter',
        DeleteFilter: 'logmagnifier.deleteFilter',
        EnableGroup: 'logmagnifier.enableGroup',
        DisableGroup: 'logmagnifier.disableGroup',
        EnableFilter: 'logmagnifier.enableFilter',
        DisableFilter: 'logmagnifier.disableFilter',
        ToggleFilter: 'logmagnifier.toggleFilter',
        ToggleGroup: 'logmagnifier.toggleGroup',

        ChangeFilterColor: {
            Prefix: 'logmagnifier.changeFilterColor',
            Color01: 'logmagnifier.changeFilterColor.color01',
            Color02: 'logmagnifier.changeFilterColor.color02',
            Color03: 'logmagnifier.changeFilterColor.color03',
            Color04: 'logmagnifier.changeFilterColor.color04',
            Color05: 'logmagnifier.changeFilterColor.color05',
            Color06: 'logmagnifier.changeFilterColor.color06',
            Color07: 'logmagnifier.changeFilterColor.color07',
            Color08: 'logmagnifier.changeFilterColor.color08',
            Color09: 'logmagnifier.changeFilterColor.color09',
            Color10: 'logmagnifier.changeFilterColor.color10',
            Color11: 'logmagnifier.changeFilterColor.color11',
            Color12: 'logmagnifier.changeFilterColor.color12',
            Color13: 'logmagnifier.changeFilterColor.color13',
            Color14: 'logmagnifier.changeFilterColor.color14',
            Color15: 'logmagnifier.changeFilterColor.color15',
            Color16: 'logmagnifier.changeFilterColor.color16',
        },

        ToggleFilterHighlightMode: {
            Word: 'logmagnifier.toggleFilterHighlightMode.word',
            Line: 'logmagnifier.toggleFilterHighlightMode.line',
            Full: 'logmagnifier.toggleFilterHighlightMode.full',
        },

        ToggleFilterCaseSensitivity: {
            On: 'logmagnifier.toggleFilterCaseSensitivity.on',
            Off: 'logmagnifier.toggleFilterCaseSensitivity.off',
        },

        ToggleFilterType: {
            Include: 'logmagnifier.toggleFilterType.include',
            Exclude: 'logmagnifier.toggleFilterType.exclude',
        },

        NextMatch: 'logmagnifier.nextMatch',
        PreviousMatch: 'logmagnifier.previousMatch',

        ToggleFilterContextLine: {
            None: 'logmagnifier.toggleFilterContextLine_cl0',
            PlusMinus3: 'logmagnifier.toggleFilterContextLine_cl3',
            PlusMinus5: 'logmagnifier.toggleFilterContextLine_cl5',
            PlusMinus9: 'logmagnifier.toggleFilterContextLine_cl9',
        },

        SetFilterType: {
            Include: 'logmagnifier.setFilterType.include',
            Exclude: 'logmagnifier.setFilterType.exclude',
        },

        SetFilterCaseSensitivity: {
            On: 'logmagnifier.setFilterCaseSensitivity.on',
            Off: 'logmagnifier.setFilterCaseSensitivity.off',
        },

        SetFilterHighlightMode: {
            Word: 'logmagnifier.setFilterHighlightMode.word',
            Line: 'logmagnifier.setFilterHighlightMode.line',
            Full: 'logmagnifier.setFilterHighlightMode.full',
        },

        SetFilterContextLine: {
            None: 'logmagnifier.setFilterContextLine.none', // cl0
            PlusMinus3: 'logmagnifier.setFilterContextLine.cl3',
            PlusMinus5: 'logmagnifier.setFilterContextLine.cl5',
            PlusMinus9: 'logmagnifier.setFilterContextLine.cl9',
        },

        TogglePrependLineNumbers: {
            Enable: 'logmagnifier.togglePrependLineNumbers.enable',
            Disable: 'logmagnifier.togglePrependLineNumbers.disable',
        },

        ToggleWordWrap: 'logmagnifier.toggleWordWrap',
        ToggleMinimap: 'logmagnifier.toggleMinimap',
        ToggleStickyScroll: 'logmagnifier.toggleStickyScroll',
        ToggleNavigationAnimation: 'logmagnifier.toggleNavigationAnimation',
        ToggleOccurrencesHighlight: 'logmagnifier.toggleOccurrencesHighlight',
        ToggleFileSizeUnit: 'logmagnifier.toggleFileSizeUnit',

        ExportWordFilters: 'logmagnifier.exportWordFilters',
        ImportWordFilters: 'logmagnifier.importWordFilters',
        ExportRegexFilters: 'logmagnifier.exportRegexFilters',
        ImportRegexFilters: 'logmagnifier.importRegexFilters',
        ManageProfiles: 'logmagnifier.manageProfiles',

        // ADB Devices
        RefreshDevices: 'logmagnifier.refreshDevices',
        AddLogcatSession: 'logmagnifier.addLogcatSession',
        StartLogcatSession: 'logmagnifier.startLogcatSession',
        StopLogcatSession: 'logmagnifier.stopLogcatSession',
        RemoveLogcatSession: 'logmagnifier.removeLogcatSession',
        SessionEnableTimeFilter: 'logmagnifier.session.enableTimeFilter',
        SessionDisableTimeFilter: 'logmagnifier.session.disableTimeFilter',
        AddLogcatTag: 'logmagnifier.addLogcatTag',
        EditLogcatTag: 'logmagnifier.editLogcatTag',
        RemoveLogcatTag: 'logmagnifier.removeLogcatTag',
        PickTargetApp: 'logmagnifier.pickTargetApp',

        ControlUninstall: 'logmagnifier.control.uninstall',
        ControlClearStorage: 'logmagnifier.control.clearStorage',
        ControlClearCache: 'logmagnifier.control.clearCache',
        ControlDumpsys: 'logmagnifier.control.dumpsys',
        ControlDumpsysMeminfo: 'logmagnifier.control.dumpsysMeminfo',
        ControlDumpsysActivity: 'logmagnifier.control.dumpsysActivity',
        ControlScreenshot: 'logmagnifier.control.screenshot',
        ControlStartScreenRecord: 'logmagnifier.control.startScreenRecord',
        ControlStopScreenRecord: 'logmagnifier.control.stopScreenRecord',
        ControlToggleShowTouches: 'logmagnifier.control.toggleShowTouches',

        // Bookmark
        AddBookmark: 'logmagnifier.addBookmark',
        AddMatchListToBookmark: 'logmagnifier.addMatchListToBookmark',
        AddSelectionMatchesToBookmark: 'logmagnifier.addSelectionMatchesToBookmark',
        RemoveBookmark: 'logmagnifier.removeBookmark',
        JumpToBookmark: 'logmagnifier.jumpToBookmark',
        JumpToSource: 'logmagnifier.jumpToSource',

        // Other shortcuts / Context menu
        CopyGroupEnabledItems: 'logmagnifier.copyGroupEnabledItems',
        CopyGroupEnabledItemsSingleLine: 'logmagnifier.copyGroupEnabledItemsSingleLine',
        CopyGroupEnabledItemsWithTag: 'logmagnifier.copyGroupEnabledItemsWithTag',

        SetExcludeStyle: {
            LineThrough: 'logmagnifier.setExcludeStyle.lineThrough',
            Hidden: 'logmagnifier.setExcludeStyle.hidden',
        },

        // Aliases / Shortcuts
        CreateFilter: 'logmagnifier.createFilter',
        CreateRegexFilter: 'logmagnifier.createRegexFilter',
        DeleteGroup: 'logmagnifier.deleteGroup',
        RenameFilterGroup: 'logmagnifier.renameFilterGroup',
        ExportGroup: 'logmagnifier.exportGroup',
        EditFilterItem: 'logmagnifier.editFilterItem',
        AddSelectionToFilter: 'logmagnifier.addSelectionToFilter',
        RemoveMatchesWithSelection: 'logmagnifier.removeMatchesWithSelection',
        ExpandAllWordGroups: 'logmagnifier.expandAllWordGroups',
        CollapseAllWordGroups: 'logmagnifier.collapseAllWordGroups',
        ExpandAllRegexGroups: 'logmagnifier.expandAllRegexGroups',
        CollapseAllRegexGroups: 'logmagnifier.collapseAllRegexGroups',
        EnableAllItemsInGroup: 'logmagnifier.enableAllItemsInGroup',
        DisableAllItemsInGroup: 'logmagnifier.disableAllItemsInGroup',

        // ... (existing commands)
    },

    Views: {
        Container: 'logmagnifier-container',
        QuickAccess: 'logmagnifier-quick-access',
        Filters: 'logmagnifier-filters',
        RegexFilters: 'logmagnifier-regex-filters',
        ADBDevices: 'logmagnifier-adb-devices',
        Bookmark: 'logmagnifier-bookmark',
    },

    Configuration: {
        Section: 'logmagnifier',
        TempFilePrefix: 'tempFilePrefix', // relative to section
        StatusBarTimeout: 'statusBarTimeout',
        HighlightColors: {
            Section: 'logmagnifier.highlightColors',
            // Individual colors are constructed dynamically or accessed via loop, but base is here
        },
        Regex: {
            Section: 'regex',
            EnableHighlight: 'regex.enableHighlight',
            HighlightColor: 'regex.highlightColor',
            DefaultHighlightColor: 'rgba(255, 255, 0, 0.3)',
        },
        Bookmark: {
            Section: 'bookmark',
            HighlightColor: 'rgba(255, 0, 0, 0.5)', // Red like the icon
            MaxMatches: 'bookmark.maxMatches',
        },
        Editor: {
            Section: 'editor',
            WordWrap: 'wordWrap',
            MinimapEnabled: 'minimap.enabled',
            StickyScrollEnabled: 'stickyScroll.enabled',
            NavigationAnimation: 'editor.navigationAnimation',
            RemoveMatchesMaxLines: 'removeMatches.maxLines',
        },
    },

    Prompts: {
        EnterFilterKeyword: 'Enter Filter Keyword',
        EnterFilterNickname: 'Enter Filter Nickname (e.g. ADB Logcat)',
        EnterRegexPattern: 'Enter Regex Pattern',
        SelectColor: 'Select a highlight color',
        EnterFilterGroupName: 'Enter Word Filter Group Name',
        EnterRegexFilterGroupName: 'Enter Regex Filter Group Name',
        SelectImportMode: 'Select import mode',
        EnterProfileName: 'Enter Profile Name',
        SelectProfileFromList: 'Select a Profile',
        EnterSessionName: 'Enter Session Name',
        EnterTagTimestamp: 'Enter Tag and Priority (e.g. MyApp:D)',
        EditTag: 'Edit Tag',
        UninstallConfirm: 'Are you sure you want to uninstall {0}?',
        ClearStorageConfirm: 'Are you sure you want to clear storage for {0}?',
        EnterNewGroupName: 'Enter new group name',
        EnterNickname: 'Enter Name (Nickname)',
        EnterNewKeyword: 'Enter new keyword',
        EnterNewProfileName: 'Enter name for new profile',
        EnterDuplicateProfileName: 'Enter name for duplicated profile',
        SelectOccurrencesHighlightMode: 'Select Occurrences Highlight Mode (Current: {0})',
        ConfirmDeleteProfile: 'Are you sure you want to delete profile \'{0}\'?',
        ExportWordFilters: 'Export Word Filters',
        ExportRegexFilters: 'Export Regex Filters',
        ExportGroup: 'Export Group: {0}',
        ImportWordFilters: 'Import Word Filters',
        ImportRegexFilters: 'Import Regex Filters',
    },

    PlaceHolders: {
        SessionName: 'My App Debug',
        TagFormat: 'Tag:Priority',
        SelectTargetApp: 'Select Target Application (filters by PID)',
    },

    FilterTypes: {
        Include: 'include' as const,
        Exclude: 'exclude' as const,
    },

    ContextKeys: {
        PrependLineNumbersEnabled: 'logmagnifier.prependLineNumbersEnabled',
    },

    GlobalState: {
        FilterGroups: 'logmagnifier.filterGroups',
        FilterProfiles: 'logmagnifier.filterProfiles',
        ActiveProfile: 'logmagnifier.activeProfile',
        Bookmarks: 'logmagnifier.bookmarks',
    },

    Labels: {
        WordWrap: 'Word Wrap',
        Minimap: 'Minimap',
        StickyScroll: 'Sticky Scroll',
        NavigationAnimation: 'Navigation Animation',
        OccurrencesHighlight: 'Occurrences Highlight',
        FileSize: 'File Size',
        Bytes: 'Bytes',
        KB: 'KB',
        MB: 'MB',
        NA: 'N/A',
        DefaultProfile: 'Default',
        All: 'all',
        ShowAllLogs: 'Show all logs',
        Running: '(running)',
        UserApps: 'User Apps (3rd-Party)',
        SystemApps: 'System Apps',
        Off: 'Off',
        SingleFile: 'Single File',
        MultiFile: 'Multi File',
        NewProfile: 'New Profile...',
        DuplicateProfile: 'Duplicate Profile...',
    },

    Descriptions: {
        OccurrencesOff: 'Disable occurrences highlight',
        OccurrencesSingle: 'Highlight occurrences in the current file only',
        OccurrencesMulti: 'Highlight occurrences across all open files',
        CreateNewProfile: 'Create a new empty profile',
        DuplicateProfile: 'Make a copy of the current profile',
        SwitchProfile: 'Switch to this profile',
    },

    ImportModes: {
        Merge: 'Merge (Add to existing)',
        Overwrite: 'Overwrite (Replace existing)',
    },

    ExtensionDisplayName: 'LogMagnifier',

    // Add other constants as needed
} as const;

export type FilterType = typeof Constants.FilterTypes.Include | typeof Constants.FilterTypes.Exclude;
