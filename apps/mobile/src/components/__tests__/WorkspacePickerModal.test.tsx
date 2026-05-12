import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import renderer, {
  act,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';

import type { FileSystemEntry } from '../../api/types';
import { createAppTheme, AppThemeProvider } from '../../theme';
import { WorkspacePickerModal } from '../WorkspacePickerModal';

type QueryableTestInstance = ReactTestInstance & {
  type: unknown;
  props: Record<string, unknown>;
  children: unknown[];
  findAll(predicate: (node: QueryableTestInstance) => boolean): QueryableTestInstance[];
};

jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

describe('WorkspacePickerModal', () => {
  const theme = createAppTheme('dark');
  const oldSelectionPath =
    '/Users/mohitpatil/Documents/github/serious-projects/clawdex-mobile';
  const githubPath = '/Users/mohitpatil/Documents/github';
  const seriousProjectsPath = '/Users/mohitpatil/Documents/github/serious-projects';

  it('keeps a browsed checkout destination when currentPath refreshes', () => {
    const onBrowsePath = jest.fn();
    const onSelectPath = jest.fn();

    let rendered: ReactTestRenderer | undefined;
    act(() => {
      rendered = renderer.create(
        renderPicker({
          onBrowsePath,
          onSelectPath,
          currentPath: githubPath,
          parentPath: '/Users/mohitpatil/Documents',
          entries: [directoryEntry('serious-projects', seriousProjectsPath)],
        })
      );
    });

    const tree = expectValue(rendered);
    act(() => {
      readOnPress(findPressableContainingText(tree.root, 'serious-projects').props)();
    });

    expect(onBrowsePath).toHaveBeenCalledWith(seriousProjectsPath);

    act(() => {
      tree.update(
        renderPicker({
          onBrowsePath,
          onSelectPath,
          currentPath: seriousProjectsPath,
          parentPath: githubPath,
          entries: [directoryEntry('clawdex-mobile', oldSelectionPath)],
        })
      );
    });

    act(() => {
      readOnPress(findPressableWithExactText(tree.root, 'Use').props)();
    });

    expect(onSelectPath).toHaveBeenCalledWith(seriousProjectsPath);
    expect(onSelectPath).not.toHaveBeenCalledWith(oldSelectionPath);

    act(() => {
      tree.unmount();
    });
  });

  function renderPicker({
    onBrowsePath,
    onSelectPath,
    currentPath,
    parentPath,
    entries,
  }: {
    onBrowsePath: (path: string | null) => void;
    onSelectPath: (path: string | null) => void;
    currentPath: string;
    parentPath: string;
    entries: FileSystemEntry[];
  }) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <AppThemeProvider theme={theme}>
          <WorkspacePickerModal
            visible
            selectedPath={oldSelectionPath}
            bridgeRoot={oldSelectionPath}
            recentWorkspaces={[]}
            currentPath={currentPath}
            parentPath={parentPath}
            entries={entries}
            onBrowsePath={onBrowsePath}
            onSelectPath={onSelectPath}
            onClose={jest.fn()}
          />
        </AppThemeProvider>
      </SafeAreaProvider>
    );
  }
});

function directoryEntry(name: string, path: string): FileSystemEntry {
  return {
    name,
    path,
    kind: 'directory',
    hidden: false,
    selectable: true,
    isGitRepo: false,
  };
}

function expectValue<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error('Expected value to be set');
  }
  return value;
}

function readOnPress(props: Record<string, unknown>): () => void {
  if (typeof props.onPress !== 'function') {
    throw new Error('Expected press handler');
  }
  return props.onPress as () => void;
}

function findPressableContainingText(
  root: ReactTestInstance,
  expectedText: string
): ReactTestInstance {
  const matches = (root as QueryableTestInstance).findAll(
    (node: QueryableTestInstance) =>
      typeof node.props.onPress === 'function' &&
      flattenTreeText(node).includes(expectedText)
  );
  if (matches.length === 0) {
    throw new Error(`Expected press target containing "${expectedText}"`);
  }
  return matches[0];
}

function findPressableWithExactText(
  root: ReactTestInstance,
  expectedText: string
): ReactTestInstance {
  const matches = (root as QueryableTestInstance).findAll(
    (node: QueryableTestInstance) =>
      typeof node.props.onPress === 'function' &&
      flattenTreeText(node) === expectedText
  );
  if (matches.length === 0) {
    throw new Error(`Expected press target with text "${expectedText}"`);
  }
  return matches[0];
}

function flattenRenderedText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(flattenRenderedText).join('');
  }
  return '';
}

function flattenTreeText(node: QueryableTestInstance): string {
  if (node.type === Text) {
    return flattenRenderedText(node.props.children);
  }

  return node.children
    .map((child) =>
      typeof child === 'string' || typeof child === 'number'
        ? String(child)
        : flattenTreeText(child as QueryableTestInstance)
    )
    .join('');
}
