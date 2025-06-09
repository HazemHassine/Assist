import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileExplorer } from '../file-explorer'; // Adjust path as needed

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const originalModule = jest.requireActual('lucide-react');
  return {
    ...originalModule,
    ChevronRight: () => <svg data-testid="chevron-right-icon" />,
    ChevronDown: () => <svg data-testid="chevron-down-icon" />,
    File: () => <svg data-testid="file-icon" />,
    Folder: () => <svg data-testid="folder-icon" />,
    FolderOpen: () => <svg data-testid="folder-open-icon" />,
    FilePlus: () => <svg data-testid="file-plus-icon" />,
    FolderPlus: () => <svg data-testid="folder-plus-icon" />,
    Edit3: () => <svg data-testid="edit3-icon" />,
    Trash2: () => <svg data-testid="trash2-icon" />,
  };
});

// Mock Shadcn UI ContextMenu components as they are not easily testable without a real browser context for positioning
// We are interested in whether the trigger works and items call functions.
jest.mock('@/components/ui/context-menu', () => ({
  ContextMenu: ({ children }) => <div data-testid="context-menu">{children}</div>,
  ContextMenuTrigger: ({ children, asChild }) => asChild ? React.cloneElement(children, {'data-testid': 'context-menu-trigger'}) : <div data-testid="context-menu-trigger">{children}</div>,
  ContextMenuContent: ({ children }) => <div data-testid="context-menu-content">{children}</div>,
  ContextMenuItem: ({ children, onClick, className }) => <button onClick={onClick} className={className} data-testid="context-menu-item">{children}</button>,
  ContextMenuSeparator: () => <hr data-testid="context-menu-separator" />,
}));


const mockFiles = [
  { name: 'file1.txt', type: 'file' },
  {
    name: 'folder1',
    type: 'directory',
    children: [
      { name: 'file2.txt', type: 'file' }
    ]
  },
];

describe('FileExplorer', () => {
  let mockOnCreate;
  let mockOnRename;
  let mockOnDelete;
  let mockOnMove;
  let mockOnFileSelect;

  beforeEach(() => {
    mockOnCreate = jest.fn();
    mockOnRename = jest.fn();
    mockOnDelete = jest.fn();
    mockOnMove = jest.fn();
    mockOnFileSelect = jest.fn();

    // Mock global prompt and confirm
    global.prompt = jest.fn();
    global.confirm = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Clean up mocks
  });

  test('renders files and folders', () => {
    render(
      <FileExplorer
        files={mockFiles}
        onFileSelect={mockOnFileSelect}
        onCreate={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        onMove={mockOnMove}
      />
    );
    expect(screen.getByText('file1.txt')).toBeInTheDocument();
    expect(screen.getByText('folder1')).toBeInTheDocument();
  });

  test('clicking a file calls onFileSelect', () => {
    render(<FileExplorer files={mockFiles} onFileSelect={mockOnFileSelect} />);
    fireEvent.click(screen.getByText('file1.txt'));
    expect(mockOnFileSelect).toHaveBeenCalledWith('file1.txt');
  });

  test('expanding a folder shows its children', () => {
    render(<FileExplorer files={mockFiles} onFileSelect={mockOnFileSelect} />);
    // Click folder1 to expand it. The button itself is the trigger.
    fireEvent.click(screen.getByText('folder1'));
    expect(screen.getByText('file2.txt')).toBeInTheDocument();
    // Click again to collapse
    fireEvent.click(screen.getByText('folder1'));
    expect(screen.queryByText('file2.txt')).not.toBeInTheDocument();
  });

  describe('Context Menu Actions', () => {
    test('Rename action on a file calls onRename after prompt', () => {
      global.prompt.mockReturnValue('renamed_file.txt');
      render(
        <FileExplorer
          files={mockFiles}
          onFileSelect={mockOnFileSelect}
          onCreate={mockOnCreate}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      // Find the button for "file1.txt" which is the ContextMenuTrigger
      const file1Button = screen.getByText('file1.txt').closest('button');
      expect(file1Button).toHaveAttribute('data-testid', 'context-menu-trigger');

      // Right click is not directly possible on the button due to asChild.
      // Instead, we find the ContextMenuItem for "Rename" within its conceptual menu.
      // Since ContextMenuContent is mocked to render its children, items will be in document.
      // We need to simulate the structure where items are conceptually tied to a trigger.
      // This test is limited by the ContextMenu mock. Let's assume the menu appears for file1.txt.

      // To test the handler directly:
      // We need to get the TreeNode instance or simulate its internal context menu handlers.
      // This is where testing gets tricky with complex UI components and mocks.

      // A more direct approach given the mocks:
      // The ContextMenuItems are rendered by our mock. We can find them.
      // This doesn't test that right-clicking file1.txt *shows* these specific items,
      // but that if a "Rename" menu item (associated with file1.txt) is clicked, it works.

      // Let's find the specific rename button associated with 'file1.txt'.
      // The way TreeNode is structured, each node has its own ContextMenu.
      // We need to find the "Rename" button that would be part of file1.txt's context menu.
      // Since all menu items are rendered due to the mock, we need a way to scope.

      // For simplicity, find the first "Rename" item and assume it's for the first file.
      // This is not ideal but a limitation of not having full context menu behavior.
      const renameButtons = screen.getAllByText('Rename'); // This will get all rename menu items

      // Let's assume the first file node 'file1.txt'
      // The button for "file1.txt" is the trigger.
      // The ContextMenuContent and its items are siblings in the mock structure.
      // We need to find the rename item that is a sibling to the trigger for file1.txt if the menu were open.
      // This is still tricky.

      // Alternative: Test the handleRename function passed to the specific TreeNode for file1.txt
      // This requires a different approach to rendering or accessing TreeNode's internal handlers.

      // Given the current setup, let's assume the first rename button corresponds to the first item.
      fireEvent.click(renameButtons[0]); // Click the first "Rename" menu item rendered.

      expect(global.prompt).toHaveBeenCalledWith('Enter new name for file1.txt:', 'file1.txt');
      expect(mockOnRename).toHaveBeenCalledWith('file1.txt', 'renamed_file.txt');
    });

    test('Delete action on a folder calls onDelete after confirm', () => {
      global.confirm.mockReturnValue(true); // User confirms deletion
      render(
        <FileExplorer
          files={mockFiles}
          onFileSelect={mockOnFileSelect}
          onCreate={mockOnCreate}
          onRename={mockOnRename}
          onDelete={mockOnDelete}
          onMove={mockOnMove}
        />
      );

      // Assuming the second item "folder1" has its context menu.
      // Find all "Delete" menu items.
      const deleteButtons = screen.getAllByText('Delete');
      // This assumes the second "Delete" button corresponds to "folder1"
      fireEvent.click(deleteButtons[1]);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete "folder1"? This action cannot be undone.');
      expect(mockOnDelete).toHaveBeenCalledWith('folder1');
    });

    test('New File action on a folder calls onCreate', () => {
        global.prompt.mockReturnValue('new_child.txt');
        render(
          <FileExplorer
            files={mockFiles}
            onFileSelect={mockOnFileSelect}
            onCreate={mockOnCreate}
            onRename={mockOnRename}
            onDelete={mockOnDelete}
            onMove={mockOnMove}
          />
        );

        // Assuming the context menu for "folder1" (the second item)
        // Find all "New File" menu items.
        const newFileButtons = screen.getAllByText('New File');
        fireEvent.click(newFileButtons[1]); // Assuming this is for folder1

        expect(global.prompt).toHaveBeenCalledWith('Enter name for the new file (e.g., newfile.txt):');
        expect(mockOnCreate).toHaveBeenCalledWith('folder1/new_child.txt', 'file');
    });
  });

  // DnD testing is complex with RTL alone.
  // We can test if the draggable attribute is set.
  // And we could try to test the logic of onDrop if we can simulate DataTransfer.
  test('TreeNode items are draggable', () => {
    render(<FileExplorer files={mockFiles} onFileSelect={mockOnFileSelect} onMove={mockOnMove} />);
    const file1Button = screen.getByText('file1.txt').closest('button');
    expect(file1Button).toHaveAttribute('draggable', 'true');
  });

  // More detailed DnD tests would require more setup or specific DnD testing libraries.
  // For now, this covers the setup and a few key component interactions.
});
