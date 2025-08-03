function updateStatus() {
  const statusText = document.getElementById('status-text');
  const currentUrlElement = document.getElementById('current-url');
  const toggleCheckbox = document.getElementById('extension-toggle');
  
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const currentTab = tabs[0];
    
    currentUrlElement.textContent = currentTab.url || 'Unknown';
    
    // Check if the page is accessible (not a special Firefox page)
    if (currentTab.url.startsWith('http://') || currentTab.url.startsWith('https://')) {
      statusText.textContent = toggleCheckbox.checked ? 'Extension is active' : 'Extension is disabled';
      statusText.style.color = toggleCheckbox.checked ? '#2e7d32' : '#f57c00';
    } else if (currentTab.url.startsWith('file://')) {
      statusText.textContent = 'Extension works on local files';
      statusText.style.color = '#2e7d32';
    } else {
      statusText.textContent = 'Not available on this page';
      statusText.style.color = '#f57c00';
    }
  }).catch((error) => {
    console.error('Error checking tab status:', error);
    statusText.textContent = 'Error checking status';
    statusText.style.color = '#d32f2f';
  });
}

async function loadExtensionState() {
  try {
    const result = await browser.storage.local.get('extensionEnabled');
    const toggleCheckbox = document.getElementById('extension-toggle');

    toggleCheckbox.checked = result.extensionEnabled !== false;
    
    if (result.extensionEnabled === undefined) {
      await browser.storage.local.set({ extensionEnabled: true });
      toggleCheckbox.checked = true;
    }
    
    updateStatus();
  } catch (error) {
    console.error('Error loading extension state:', error);
    const toggleCheckbox = document.getElementById('extension-toggle');
    toggleCheckbox.checked = true;
    updateStatus();
  }
}

async function saveExtensionState(enabled) {
  try {
    await browser.storage.local.set({ extensionEnabled: enabled });
    console.log('Extension state saved:', enabled);
  } catch (error) {
    console.error('Error saving extension state:', error);
  }
}

function handleToggleChange(event) {
  const enabled = event.target.checked;
  
  saveExtensionState(enabled);
  
  updateStatus();
  
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const currentTab = tabs[0];
    
      browser.runtime.sendMessage({
        command: 'toggleExtension',
        enabled: enabled
      }).then((response) => {
        console.log('Toggle message sent successfully:', response);
      }).catch((error) => {
        console.error('Error sending toggle message:', error);
      });
  }).catch((error) => {
    console.error('Error checking tab for toggle:', error);
  });
}

function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute content script: ${error.message}`);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadExtensionState();
  
  const toggleCheckbox = document.getElementById('extension-toggle');
  toggleCheckbox.addEventListener('change', handleToggleChange);
});
