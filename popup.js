document.getElementById('findBtn').addEventListener('click', async () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    document.getElementById('result').textContent = 'Please enter a name';
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: findAndHighlight,
    args: [name]
  });

  const count = results[0].result;
  document.getElementById('result').textContent =
    count > 0 ? `Found ${count} match${count === 1 ? '' : 'es'}` : 'No matches found';
});

document.getElementById('clearBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: clearHighlights
  });

  document.getElementById('result').textContent = 'Highlights cleared';
});

function findAndHighlight(name) {
  // Clear existing highlights first (inline to work in page context)
  const existingStyle = document.getElementById('name-finder-style');
  if (existingStyle) existingStyle.remove();

  const existingHighlights = document.querySelectorAll('.name-finder-highlight');
  existingHighlights.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });

  const regex = new RegExp(`(${name})`, 'gi');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];

  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.match(regex)) {
      textNodes.push(walker.currentNode);
    }
  }

  let count = 0;
  textNodes.forEach(node => {
    const matches = node.nodeValue.match(regex);
    if (matches) {
      count += matches.length;
      const span = document.createElement('span');
      span.innerHTML = node.nodeValue.replace(regex, '<mark class="name-finder-highlight">$1</mark>');
      node.parentNode.replaceChild(span, node);
    }
  });

  const style = document.createElement('style');
  style.id = 'name-finder-style';
  style.textContent = '.name-finder-highlight { background-color: yellow; padding: 2px; }';
  document.head.appendChild(style);

  return count;
}

function clearHighlights() {
  const existingStyle = document.getElementById('name-finder-style');
  if (existingStyle) existingStyle.remove();

  const highlights = document.querySelectorAll('.name-finder-highlight');
  highlights.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}
