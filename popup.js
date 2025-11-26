document.getElementById('searchBtn').addEventListener('click', async () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    document.getElementById('result').textContent = 'Please enter a name';
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: findAndSubmitSearch,
      args: [name]
    });

    const result = results[0].result;
    document.getElementById('result').textContent = result.message;
  } catch (err) {
    document.getElementById('result').textContent = 'Error: ' + err.message;
  }
});

document.getElementById('messageBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: clickMessageButton
    });

    const result = results[0].result;
    document.getElementById('result').textContent = result.message;
  } catch (err) {
    document.getElementById('result').textContent = 'Error: ' + err.message;
  }
});

function findAndSubmitSearch(name) {
  // Common search input selectors
  const searchSelectors = [
    'input[type="search"]',
    'input[name="q"]',
    'input[name="query"]',
    'input[name="search"]',
    'input[name="s"]',
    'input[placeholder*="search" i]',
    'input[placeholder*="find" i]',
    'input[aria-label*="search" i]',
    'input[id*="search" i]',
    'input[class*="search" i]',
    'header input[type="text"]',
    'nav input[type="text"]',
    '[role="search"] input'
  ];

  let searchInput = null;

  // Try each selector until we find a search box
  for (const selector of searchSelectors) {
    const input = document.querySelector(selector);
    if (input && input.offsetParent !== null) { // Check it's visible
      searchInput = input;
      break;
    }
  }

  if (!searchInput) {
    return { success: false, message: 'No search box found on this page' };
  }

  // Fill in the search box
  searchInput.value = name;
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));

  // Try to submit the search
  const form = searchInput.closest('form');
  if (form) {
    form.submit();
    return { success: true, message: 'Searching...' };
  }

  // If no form, try pressing Enter
  searchInput.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true
  }));

  return { success: true, message: 'Search submitted' };
}

function clickMessageButton() {
  // Search ALL artdeco button spans for "Message"
  const artdecoSpans = document.querySelectorAll('span.artdeco-button__text');
  for (const span of artdecoSpans) {
    if (span.textContent.trim() === 'Message') {
      const clickable = span.closest('button, a, [role="button"]') || span;
      clickable.click();
      return { success: true, message: 'Clicked Message button' };
    }
  }

  // Fallback: find any span containing "Message" text
  const spans = document.querySelectorAll('span');
  for (const span of spans) {
    if (span.textContent.trim() === 'Message') {
      const clickable = span.closest('button, a, [role="button"]') || span;
      clickable.click();
      return { success: true, message: 'Clicked Message button' };
    }
  }

  // Debug: report what artdeco spans were found
  const found = Array.from(artdecoSpans).map(s => s.textContent.trim()).join(', ');
  return { success: false, message: 'No Message button found. Found: ' + (found || 'none') };
}
