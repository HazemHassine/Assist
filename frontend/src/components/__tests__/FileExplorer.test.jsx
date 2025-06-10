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

// No longer mocking ContextMenu, will use the actual component.
// If tests fail due to JSDOM limitations with context menus (e.g., portal issues, focus management),
// we might need to add specific workarounds or more targeted mocks for Radix UI primitives if used by Shadcn.
// For now, let's assume @testing-library/react can handle it.

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
    test('Rename action on a file calls onRename after prompt', async () => {
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
      // const file1Button = screen.getByText('file1.txt').closest('button'); // This was the duplicate
      expect(file1Button).toBeInTheDocument(); // Ensure the trigger element is found

      // Simulate right-click (context menu event) on the trigger
      fireEvent.contextMenu(file1Button);

      // Now the context menu should be open. Find the "Rename" item.
      // Radix UI (used by Shadcn) often renders items with role="menuitem"
      // and the text might be within that.
      const renameMenuItem = await screen.findByText('Rename'); // findByText for potential async rendering of menu
      expect(renameMenuItem).toBeInTheDocument();

      fireEvent.click(renameMenuItem);

      expect(global.prompt).toHaveBeenCalledWith('Enter new name for file1.txt:', 'file1.txt');
      expect(mockOnRename).toHaveBeenCalledWith('file1.txt', 'renamed_file.txt');
    });

    test('Delete action on a folder calls onDelete after confirm', async () => {
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

      const folder1Button = screen.getByText('folder1').closest('button');
      expect(folder1Button).toBeInTheDocument();

      fireEvent.contextMenu(folder1Button);

      const deleteMenuItem = await screen.findByText('Delete');
      expect(deleteMenuItem).toBeInTheDocument();

      fireEvent.click(deleteMenuItem);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete "folder1"? This action cannot be undone.');
      expect(mockOnDelete).toHaveBeenCalledWith('folder1');
    });

    test('New File action on a folder calls onCreate', async () => {
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

        const folder1Button = screen.getByText('folder1').closest('button');
        expect(folder1Button).toBeInTheDocument();

        fireEvent.contextMenu(folder1Button);

        const newFileMenuItem = await screen.findByText('New File');
        expect(newFileMenuItem).toBeInTheDocument();

        fireEvent.click(newFileMenuItem);

        expect(global.prompt).toHaveBeenCalledWith('Enter name for the new file (e.g., newfile.txt):');
        expect(mockOnCreate).toHaveBeenCalledWith('folder1/new_child.txt', 'file');
    });

    test('New Folder action on a file calls onCreate (as sibling)', async () => {
      global.prompt.mockReturnValue('new_sibling_folder');
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

      const file1Button = screen.getByText('file1.txt').closest('button');
      expect(file1Button).toBeInTheDocument();

      fireEvent.contextMenu(file1Button);

      const newFolderMenuItem = await screen.findByText('New Folder');
      expect(newFolderMenuItem).toBeInTheDocument();

      fireEvent.click(newFolderMenuItem);

      // pathForCreation = item.type === "directory" ? `${currentPath}/${newFolderName}` : `${parentPath ? parentPath + '/' : ''}${newFolderName}`;
      // For file1.txt, parentPath is "", currentPath is "file1.txt", item.type is "file"
      // So, pathForCreation should be "new_sibling_folder"
      expect(global.prompt).toHaveBeenCalledWith('Enter name for the new folder:');
      expect(mockOnCreate).toHaveBeenCalledWith('new_sibling_folder', 'folder');
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
