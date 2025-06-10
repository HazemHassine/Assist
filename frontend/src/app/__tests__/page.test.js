import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page'; // Adjust path to your Home component (page.js)
// Mock child components used by Home
jest.mock('@/components/file-explorer', () => ({
  FileExplorer: jest.fn(({ files, onFileSelect, onCreate, onMove, onRename, onDelete }) => (
    <div data-testid="file-explorer">
      Mock File Explorer
      {/* Add buttons to simulate actions if needed for more integrated tests later */}
    </div>
  )),
}));
jest.mock('@/components/file-editor', () => jest.fn(() => <div data-testid="file-editor">Mock File Editor</div>));
jest.mock('@/components/markdown-preview', () => jest.fn(() => <div data-testid="markdown-preview">Mock Markdown Preview</div>));
jest.mock('react-toastify', () => ({
  ToastContainer: jest.fn(() => <div data-testid="toast-container" />),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
  Bounce: jest.fn(),
}));

// Mock lucide-react icons used directly in Home page.js
jest.mock('lucide-react', () => {
    const originalModule = jest.requireActual('lucide-react');
    return {
      ...originalModule,
      FolderOpen: () => <svg data-testid="folder-open-icon" />,
      PanelLeftClose: () => <svg data-testid="panel-left-close-icon" />,
      PanelLeftOpen: () => <svg data-testid="panel-left-open-icon" />,
    };
  });


// Mock global fetch
global.fetch = jest.fn();

describe('Home Page (page.js logic)', () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllMocks(); // Clear all mocks including toast
  });

  // Helper to get access to the functions passed as props to FileExplorer
  // This is a bit indirect; ideally, we'd export these handlers from page.js if we wanted to test them in isolation.
  // For now, we'll trigger them via FileExplorer's mocked props if needed, or test their effects.
  // Let's test the handlers more directly by calling them after rendering Home component
  // To do this, we'd need to extract them or use a more complex setup.
  // Alternative: We can get the props passed to the mocked FileExplorer.

  async function getFileExplorerProps() {
    render(<Home />);
    // Wait for initial loadFiles if any
    await act(async () => {
        // Resolve initial loadFiles if it's mocked
        if (fetch.mock.calls.find(call => call[0] === '/api/files')) {
             fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] }),
            });
        }
    });
    const fileExplorerMock = require('@/components/file-explorer').FileExplorer;
    return fileExplorerMock.mock.calls[0][0]; // Get props from the first call to FileExplorer
  }


  test('handleCreateFileOrFolder calls fetch with correct parameters', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Created successfully' }),
    });
    fetch.mockResolvedValueOnce({ // For loadFiles
        ok: true,
        json: async () => ({ files: [] }),
    });

    const { onCreate } = await getFileExplorerProps(); // Get the actual onCreate function
    await act(async () => {
      await onCreate('new/test.txt', 'file');
    });

    expect(fetch).toHaveBeenCalledWith('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'new/test.txt', type: 'file' }),
    });
    expect(require('react-toastify').toast.success).toHaveBeenCalledWith('Created successfully', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/api/files'); // For loadFiles
  });

  test('handleRename calls fetch with correct parameters', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Renamed successfully', new_name: 'folder/renamed.txt' }),
    });
     fetch.mockResolvedValueOnce({ // For loadFiles
        ok: true,
        json: async () => ({ files: [] }),
    });

    const { onRename } = await getFileExplorerProps();
    await act(async () => {
      await onRename('folder/old_name.txt', 'renamed.txt');
    });

    expect(fetch).toHaveBeenCalledWith('/api/files/rename/folder%2Fold_name.txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: 'renamed.txt' }),
      });
    expect(require('react-toastify').toast.success).toHaveBeenCalledWith('Item renamed to folder/renamed.txt!', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/api/files');
  });

  test('handleMoveItem calls fetch with correct parameters', async () => {
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Moved successfully' }),
      });
    fetch.mockResolvedValueOnce({ // For loadFiles
       ok: true,
       json: async () => ({ files: [] }),
   });

    const { onMove } = await getFileExplorerProps();
    await act(async () => {
        await onMove('source/item.txt', 'destination/item.txt');
    });

    expect(fetch).toHaveBeenCalledWith('/api/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePath: 'source/item.txt', destinationPath: 'destination/item.txt' }),
    });
    expect(require('react-toastify').toast.success).toHaveBeenCalledWith('Moved successfully', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/api/files');
  });

  test('handleDelete calls fetch with correct parameters', async () => {
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Deleted successfully' }),
    });
    fetch.mockResolvedValueOnce({ // For loadFiles
       ok: true,
       json: async () => ({ files: [] }),
    });

    const { onDelete } = await getFileExplorerProps();
    await act(async () => {
        await onDelete('item_to_delete.txt');
    });

    expect(fetch).toHaveBeenCalledWith('/api/files/item_to_delete.txt', {
        method: 'DELETE',
    });
    expect(require('react-toastify').toast.success).toHaveBeenCalledWith('Deleted successfully', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/api/files');
  });

  test('handleCreateFileOrFolder shows error toast on API failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Create failed miserably' }),
      status: 500,
    });
     fetch.mockResolvedValueOnce({ // For loadFiles (which might not be called if create fails early)
        ok: true,
        json: async () => ({ files: [] }),
    });


    const { onCreate } = await getFileExplorerProps();
    await act(async () => {
      await onCreate('new/test.txt', 'file');
    });

    expect(fetch).toHaveBeenCalledWith('/api/files/create', expect.any(Object));
    expect(require('react-toastify').toast.error).toHaveBeenCalledWith('Create failed miserably', expect.any(Object));
  });

});
