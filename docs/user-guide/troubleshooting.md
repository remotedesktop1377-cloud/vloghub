# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the YouTube Research Video Clip Finder.

## Installation Issues

### Application Won't Start

**Symptoms:**
- Blank screen after launch
- Error message during startup
- Application crashes immediately

**Solutions:**
1. **Check system requirements:**
   - Ensure your system meets the minimum requirements
   - Update your web browser to the latest version

2. **Clear cache and cookies:**
   - Open browser settings
   - Find the option to clear browsing data
   - Select cache and cookies, then clear

3. **Reinstall the application:**
   - Uninstall completely
   - Download the latest version
   - Follow installation steps carefully

### Backend Connection Errors

**Symptoms:**
- "Cannot connect to server" message
- Spinning loading indicator that never completes
- API error messages

**Solutions:**
1. **Check if backend server is running:**
   ```bash
   # Check process
   ps aux | grep app.py
   
   # Restart if needed
   cd /path/to/application
   python src/app.py
   ```

2. **Verify port availability:**
   ```bash
   # Check if port is in use
   lsof -i :5000
   
   # If port is in use, change the port in .env file
   ```

3. **Check firewall settings:**
   - Ensure the application has network permissions
   - Allow connections on required ports (typically 3000 for frontend, 5000 for backend)

## YouTube API Issues

### API Key Problems

**Symptoms:**
- "Invalid API key" errors
- "Quota exceeded" messages
- Search functionality not working

**Solutions:**
1. **Verify API key:**
   - Check that your API key is entered correctly in Settings
   - Ensure the API key has YouTube Data API v3 enabled
   - Confirm the key is not restricted by referrer

2. **Check quota usage:**
   - Go to Google Cloud Console → APIs & Services → Dashboard
   - Look at your quota usage for YouTube Data API v3
   - If exceeded, wait until quota resets or create a new project/key

3. **API restrictions:**
   - Ensure your API key doesn't have unnecessary restrictions
   - If using a restricted key, add your domain to allowed referrers

## Video Playback Issues

### Videos Won't Play

**Symptoms:**
- Black screen with loading indicator
- Error message instead of video
- Video player controls appear but video doesn't start

**Solutions:**
1. **Check internet connection:**
   - Test your connection with another website
   - Try lowering video quality in settings

2. **Browser compatibility:**
   - Try a different browser (Chrome, Firefox, Safari)
   - Update your current browser to the latest version
   - Disable browser extensions that might interfere with video playback

3. **Clear browser cache:**
   - Open browser settings
   - Find the option to clear browsing data
   - Select cache and cookies, then clear

### Video Playback is Slow or Stuttering

**Symptoms:**
- Frequent buffering
- Video freezes while audio continues
- Low quality playback

**Solutions:**
1. **Check internet speed:**
   - Run a speed test (e.g., speedtest.net)
   - Close other applications using bandwidth
   - Connect to a stronger WiFi signal or use wired connection

2. **Reduce video quality:**
   - Click the gear icon in the video player
   - Select a lower resolution

3. **Hardware acceleration:**
   - Enable hardware acceleration in your browser settings
   - Update graphics drivers on your computer

## Clip Extraction Issues

### Clip Boundaries Are Inaccurate

**Symptoms:**
- Extracted clips start too early or end too late
- In/out points don't match what was selected
- Timeline markers are offset from actual content

**Solutions:**
1. **Use frame-by-frame navigation:**
   - Pause the video
   - Use `,` and `.` keys to move frame by frame
   - Set in/out points more precisely

2. **Adjust timeline zoom:**
   - Zoom in on the timeline for more precise control
   - Use Ctrl+Wheel or Cmd+Wheel to zoom

3. **Manual adjustment:**
   - Drag the clip boundaries in the timeline
   - Use the trim handles in the clip editor

### Transcription Errors

**Symptoms:**
- Missing transcription
- Inaccurate text in transcription
- Transcription not aligned with video

**Solutions:**
1. **Check video has captions:**
   - Look for CC button in YouTube player
   - Filter search results for videos with captions

2. **Try alternative transcription source:**
   - Switch between YouTube captions and Whisper transcription in settings
   - Select a different language if available

3. **Manual editing:**
   - Use the transcript editor to correct errors
   - Adjust timing of transcript segments if needed

## Download Issues

### Downloads Fail

**Symptoms:**
- Download starts but stops at a percentage
- Error message during download
- Downloaded file is corrupted or won't play

**Solutions:**
1. **Check disk space:**
   - Ensure you have sufficient storage space
   - Clean up unnecessary files if needed

2. **Verify permissions:**
   - Check that the application has write permissions to the download folder
   - Try downloading to a different location

3. **Try different format/quality:**
   - Select a lower quality option
   - Try a different file format if available

### Missing Files After Download

**Symptoms:**
- Download completes but file is not where expected
- File appears briefly then disappears
- Zero byte files in download folder

**Solutions:**
1. **Check download location:**
   - Verify the correct download path in settings
   - Search your computer for the filename

2. **Check antivirus software:**
   - Your security software might be quarantining the files
   - Add the application to your antivirus exceptions

3. **File naming conflicts:**
   - Check if files are being overwritten due to naming conflicts
   - Enable the option to add unique identifiers to filenames

## Still Having Problems?

If you're still experiencing issues after trying these solutions:

1. **Check our community forum** for similar issues and solutions
2. **Report the bug** using the "Report Bug" option in the Help menu
3. **Contact support** at support@youtube-clip-finder.example.com with:
   - Detailed description of the issue
   - Steps to reproduce the problem
   - Screenshots or screen recordings if possible
   - Your system information (OS, browser version, etc.) 