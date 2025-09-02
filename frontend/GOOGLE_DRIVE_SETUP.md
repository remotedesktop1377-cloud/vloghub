# Google Drive API Integration Setup

This guide will help you set up Google Drive API integration to upload script production JSON files directly to Google Drive.

## Prerequisites

1. **Google Cloud Account**: You need access to Google Cloud Console
2. **Google Drive Account**: A Google Drive account where files will be uploaded

## Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### Step 2: Enable Google Drive API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on "Google Drive API" and click **Enable**

### Step 3: Create Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - **Name**: `youtube-clip-searcher-drive`
   - **Description**: `Service account for uploading script production files to Google Drive`
4. Click **Create and Continue**
5. Skip role assignment for now (click **Continue**)
6. Click **Done**

### Step 4: Generate Service Account Key

1. In the **Credentials** page, find your newly created service account
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** > **Create new key**
5. Select **JSON** format
6. Click **Create**
7. A JSON file will be downloaded - **keep this file secure!**

### Step 5: Extract Required Information

From the downloaded JSON file, extract these values:
- `client_email`: The service account email
- `private_key`: The private key (long string starting with `-----BEGIN PRIVATE KEY-----`)

### Step 6: Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder for your script files (e.g., "Script Production Files")
3. Right-click on the folder and select **Share**
4. Add the service account email (from step 5) as an **Editor**
5. Copy the folder ID from the URL (the long string after `/folders/`)

### Step 7: Configure Environment Variables

Add these variables to your `frontend/.env.local` file:

```env
# Google Drive Integration
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
```

### Example Configuration

```env
# Google Drive Integration
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=youtube-clip-searcher-drive@my-project-12345.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID=1ABcDeFgHiJkLmNoPqRsTuVwXyZ123456789
```

## Important Notes

### Security Considerations

1. **Never commit the `.env.local` file** to version control
2. **Keep the service account JSON file secure** and never share it
3. **Use environment variables** for all sensitive data
4. **Regularly rotate service account keys** for security

### Private Key Formatting

- The private key must include `\n` characters for line breaks
- Wrap the entire key in double quotes
- Ensure the key starts with `-----BEGIN PRIVATE KEY-----` and ends with `-----END PRIVATE KEY-----`

### Folder Permissions

- The service account must have **Editor** permissions on the target folder
- The folder must be shared with the service account email
- You can create subfolders and the service account will have access to them

## How It Works

### Upload Process

1. User clicks "Upload JSON to Google Drive" button
2. System creates comprehensive JSON structure with:
   - Project metadata (topic, title, duration, etc.)
   - Chapter details (narration, timing, assets)
   - Image URLs for each chapter
3. Generates timestamped filename
4. Uploads to specified Google Drive folder
5. Returns shareable link to uploaded file

### File Structure

The uploaded JSON contains:
```json
{
  "project": {
    "topic": "Sample Topic",
    "title": "Sample Title",
    "duration": 60,
    "resolution": "1920x1080",
    "region": "US",
    "language": "en",
    "subtitleLanguage": "en",
    "narrationType": "professional"
  },
  "script": [
    {
      "id": "scene-1",
      "narration": "Chapter narration text...",
      "duration": "10 seconds",
      "durationInSeconds": 10,
      "words": 25,
      "startTime": "0:00",
      "endTime": "0:10",
      "assets": {
        "images": ["https://image1.jpg", "https://image2.jpg"]
      }
    }
  ]
}
```

## Testing the Integration

### Test Upload

1. Make sure your environment variables are set correctly
2. Create a script with chapters in the application
3. Click "Upload JSON to Google Drive"
4. Check your Google Drive folder for the uploaded file
5. Verify the file contains the expected JSON structure

### Troubleshooting

#### Common Issues

1. **"Google Drive credentials not configured"**
   - Verify all three environment variables are set
   - Check for typos in variable names

2. **"Failed to upload to Google Drive"**
   - Verify service account has access to the folder
   - Check that the folder ID is correct
   - Ensure private key is properly formatted

3. **"Invalid credentials"**
   - Verify the service account email is correct
   - Check that the private key includes proper line breaks (`\n`)
   - Ensure the service account key hasn't been deleted

#### Debug Steps

1. Check browser console for detailed error messages
2. Verify environment variables are loaded correctly
3. Test with a simple folder structure first
4. Ensure the service account has the necessary permissions

## Features

### Automatic Filename Generation

Files are automatically named with:
- Script title (sanitized)
- Timestamp for uniqueness
- `.json` extension

Example: `script-production-my-amazing-video-2024-01-15T10-30-45.json`

### Success Feedback

- Toast notification on successful upload
- Alert with link to open the uploaded file
- File details displayed in the UI

### Error Handling

- Comprehensive error messages
- Toast notifications for failures
- Detailed logging for debugging

## API Endpoint

The integration uses the `/api/google-drive-upload` endpoint which:
- Accepts JSON data and filename
- Authenticates with Google Drive API
- Uploads file to specified folder
- Returns file ID and shareable link

## Support

For issues with:
- **Google Cloud Console**: Check Google Cloud documentation
- **Service Account Setup**: Refer to Google Cloud IAM guides  
- **Drive API Permissions**: Review Google Drive API documentation
- **Application Integration**: Check browser console for error details
