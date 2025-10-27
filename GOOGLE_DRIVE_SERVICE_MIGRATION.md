# Google Drive Service Migration Guide

## Overview
Created a shared Google Drive service to eliminate code duplication across API routes. This service provides reusable functions for authentication and common Drive operations.

## Created Files

### `frontend/src/services/googleDriveService.ts`
A centralized service that exports the following functions:

#### Functions:
1. **`getJWTClient(scopes)`** - Get authenticated JWT client
   - Returns a JWT client with specified scopes
   - Default scope: `https://www.googleapis.com/auth/drive`

2. **`getDriveClient(scopes)`** - Get authenticated Drive client
   - Returns a ready-to-use Drive client
   - Default scope: `https://www.googleapis.com/auth/drive`

3. **`findOrCreateFolder(drive, name, parentId, options)`** - Find or create folder
   - Searches for existing folder, creates if not found
   - Supports `supportsAllDrives` and `includeItemsFromAllDrives` options
   - Returns: `{ id: string, created: boolean }`

4. **`findOrCreateCleanFolder(drive, name, parentId)`** - Find/create and clear folder
   - Same as above but clears contents if folder exists
   - Returns: folder ID

5. **`clearFolder(drive, folderId)`** - Clear folder contents
   - Deletes all files in a folder

6. **`getRootFolderId()`** - Get root folder from environment
   - Reads from `GOOGLE_DRIVE_FOLDER_ID` or `GOOGLE_PARENT_FOLDER_ID`
   - Throws error if not set

7. **`resolveSubfolderId(drive, parentFolderId, name)`** - Find subfolder by name
   - Returns subfolder ID or null

## Updated Files

### ✅ Completed:
1. `frontend/app/api/google-drive-generate-folder/route.ts`
2. `frontend/app/api/google-drive-upload/route.ts`

### ⏳ To Be Updated:
1. `frontend/app/api/google-drive-scene-upload/route.ts`
2. `frontend/app/api/google-drive-media-upload/route.ts`
3. `frontend/app/api/google-drive-library/route.ts` (already has `getDriveClient()` but needs cleanup)
4. `frontend/app/api/google-drive-media/route.ts` (already has `getJWT()` but needs cleanup)

## Migration Pattern

### Before:
```typescript
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { DRIVE_CLIENT_CREDENTIALS_FILE_NAME } from '@/data/constants';

// ... repeated helper function ...

const credentialsPath = path.join(process.cwd(), 'src', 'config', DRIVE_CLIENT_CREDENTIALS_FILE_NAME);
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const jwtClient = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth: jwtClient });

const ROOT_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_PARENT_FOLDER_ID;
if (!ROOT_ID) {
    return NextResponse.json({ error: '...' }, { status: 500 });
}
```

### After:
```typescript
import { getDriveClient, getRootFolderId, findOrCreateFolder } from '@/services/googleDriveService';

// Get authenticated Drive client
const drive = getDriveClient();

// Get root folder ID from environment
const ROOT_ID = getRootFolderId();

// Use findOrCreateFolder as needed
const folder = await findOrCreateFolder(drive, name, ROOT_ID);
```

## How to Update Remaining Routes

### For each file:

1. **Update imports:**
   - Remove: `google` from googleapis, `path`, `fs`, `DRIVE_CLIENT_CREDENTIALS_FILE_NAME` (if no longer needed)
   - Add: Import functions from `@/services/googleDriveService`

2. **Remove duplicate helper functions:**
   - Delete any local `findOrCreateFolder` functions
   - Use the shared one from the service

3. **Replace credential setup:**
   - Replace the entire credentials block with: `const drive = getDriveClient();`
   - Replace root folder check with: `const ROOT_ID = getRootFolderId();`

4. **Update function calls:**
   - If using local helper functions, replace with imports from the service
   - Update any custom helper functions to use the service functions

## Benefits

✅ **Single Source of Truth**: All Drive authentication logic in one place  
✅ **Easier Maintenance**: Update credentials handling in one file  
✅ **Consistent Behavior**: All routes use the same authentication  
✅ **Reduced Code**: Eliminate ~30-40 lines per route  
✅ **Better Error Handling**: Centralized error handling in service functions  
✅ **Type Safety**: Better TypeScript support with shared types  

## Testing

After migration, test all affected routes to ensure:
- [ ] Folder creation works correctly
- [ ] File uploads succeed
- [ ] Authentication scopes are correct
- [ ] Error handling works properly
- [ ] Performance is maintained

## Notes

- The service maintains backward compatibility with existing functionality
- Custom scopes can still be passed to `getDriveClient(scopes)`
- All existing behavior is preserved with cleaner code

