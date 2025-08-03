# Image Downloader Extension

A Firefox extension that adds download icons to images on web pages. The icons appear when you hover over images and allow you to download them with a single click.

### For Development/Testing:

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the sidebar
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file from this directory

### Debugging:

If downloads aren't working:

1. Open the browser console (F12) to see debug messages
2. Check the extension's background script console:
   - Go to `about:debugging`
   - Find your extension and click "Inspect"
   - Look for any error messages
3. Test with the provided `test.html` file
4. Make sure the extension has the `downloads` permission
