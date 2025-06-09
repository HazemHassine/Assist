import path from 'path';
import fs from 'fs/promises';

/**
 * BASE_PATH is the absolute path to the 'vault' directory,
 * located at the root of the project.
 * process.cwd() in Next.js server-side contexts (like API routes or server components if used there)
 * typically refers to the project root.
 */
export const BASE_PATH = path.resolve(process.cwd(), 'vault');

/**
 * Validates a relative path from the vault and returns a secure, absolute path.
 *
 * @param {string} relativePathFromVault - The relative path from the vault directory
 *                                         (e.g., "myFile.txt" or "myFolder/myFile.txt").
 * @returns {string} The validated, absolute path.
 * @throws {Error} If the path is invalid or attempts directory traversal outside the vault.
 */
export function getValidatedPath(relativePathFromVault) {
  if (typeof relativePathFromVault !== 'string') {
    throw new Error("Invalid path: Path must be a string.");
  }

  // Sanitize by replacing backslashes with forward slashes for consistency
  const sanitizedRelativePath = relativePathFromVault.replace(/\\/g, '/');

  // Prevent absolute paths from being passed as relativePathFromVault
  if (path.isAbsolute(sanitizedRelativePath)) {
      throw new Error("Invalid path: relativePathFromVault cannot be an absolute path.");
  }

  const fullPath = path.join(BASE_PATH, sanitizedRelativePath);
  const normalizedPath = path.normalize(fullPath);

  // Security Check: Ensure the normalized path is still within or equal to BASE_PATH.
  // path.relative(BASE_PATH, normalizedPath) should not start with '..' or be an absolute path if normalizedPath is outside.
  // A simpler check is to ensure normalizedPath.startsWith(BASE_PATH + path.sep) or normalizedPath === BASE_PATH
  // For robustness, also check if BASE_PATH itself is a prefix of normalizedPath.
  if (!normalizedPath.startsWith(BASE_PATH + path.sep) && normalizedPath !== BASE_PATH) {
    // Additional check for the case where BASE_PATH might not have a trailing separator in the comparison
    if (!normalizedPath.startsWith(BASE_PATH) || (normalizedPath.length > BASE_PATH.length && normalizedPath[BASE_PATH.length] !== path.sep) ) {
        throw new Error("Invalid path: Attempted directory traversal or invalid path construction.");
    }
  }

  return normalizedPath;
}

/**
 * Recursively builds a file tree structure for a given directory path.
 *
 * @param {string} currentPath - The absolute path to the directory to scan.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of items,
 *                                   each being an object with name, type ('file' or 'directory'),
 *                                   and 'children' (for directories).
 */
export async function buildFileTree(currentPath) {
  try {
    // Validate that currentPath is within BASE_PATH before proceeding
    if (!currentPath.startsWith(BASE_PATH)) {
        // This check is a safeguard; typically getValidatedPath would be used before calling this.
        throw new Error("Access denied: Path is outside the allowed directory.");
    }
    await fs.access(currentPath); // Check if path exists and is accessible
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Directory not found: ${currentPath}`);
      return []; // Return empty if directory doesn't exist
    }
    throw error; // Re-throw other errors
  }

  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    const entryPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      const children = await buildFileTree(entryPath); // Recursive call
      items.push({
        name: entry.name,
        type: 'directory',
        children: children,
      });
    } else if (entry.isFile()) {
      items.push({
        name: entry.name,
        type: 'file',
      });
    }
    // Symlinks and other file types are ignored in this implementation
  }

  // Sort items: directories first, then files, both alphabetically.
  items.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'directory' ? -1 : 1;
  });

  return items;
}

// Example of how getValidatedPath might be used if BASE_PATH itself has symlinks.
// This more robust check for getValidatedPath ensures that even if BASE_PATH is like /some/symlink -> /actual/path
// and relativePathFromVault is ../../something, it doesn't escape the /actual/path.
// The current implementation of getValidatedPath using startsWith(BASE_PATH) should handle most cases,
// but realpath can be used for stricter validation if symlinks in BASE_PATH are a concern.
// For this subtask, the current getValidatedPath is sufficient.
/*
export async function getValidatedPathWithRealPath(relativePathFromVault) {
  const fullPath = path.join(BASE_PATH, relativePathFromVault);
  const normalizedPath = path.normalize(fullPath);

  const realBasePath = await fs.realpath(BASE_PATH);
  const realNormalizedPath = await fs.realpath(normalizedPath);

  if (!realNormalizedPath.startsWith(realBasePath)) {
    throw new Error("Invalid path: Attempted directory traversal.");
  }
  return realNormalizedPath; // Or normalizedPath, depending on whether you want symlinks resolved.
}
*/
