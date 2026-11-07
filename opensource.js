const GITHUB_USER = 'manit2004';
const PR_QUERY = `author:${GITHUB_USER} type:pr is:merged -user:${GITHUB_USER}`;
const PER_PAGE = 100;
const MAX_PAGES = 10; // the search API stops at 1,000 results

async function fetchMergedPRs() {
  const prs = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = 'https://api.github.com/search/issues'
      + `?q=${encodeURIComponent(PR_QUERY)}&per_page=${PER_PAGE}&page=${page}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const data = await response.json();
    prs.push(...data.items);
    if (data.items.length < PER_PAGE) break;
  }
  return prs;
}

function mergedAt(pr) {
  return pr.pull_request.merged_at;
}

// Groups PRs by repo, newest merge first, both within and across repos.
function groupByRepo(prs) {
  const groups = new Map();
  const newestFirst = [...prs].sort((a, b) => mergedAt(b).localeCompare(mergedAt(a)));
  for (const pr of newestFirst) {
    const repo = pr.repository_url.split('/repos/')[1];
    if (!groups.has(repo)) groups.set(repo, []);
    groups.get(repo).push(pr);
  }
  return groups;
}

function link(text, href) {
  const a = document.createElement('a');
  a.textContent = text;
  a.href = href;
  return a;
}

function renderPR(pr) {
  const item = document.createElement('li');
  item.className = 'skill-list-item';
  item.append(link(pr.title, pr.html_url));

  const date = new Date(mergedAt(pr)).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const meta = document.createElement('span');
  meta.className = 'pr-meta';
  meta.textContent = `#${pr.number} · merged ${date}`;
  item.append(meta);
  return item;
}

function renderRepo(repo, prs) {
  const card = document.createElement('div');
  card.className = 'skill';

  const title = document.createElement('div');
  title.className = 'skill-title';
  title.append(link(repo, `https://github.com/${repo}`));

  const list = document.createElement('ul');
  list.className = 'skill-list';
  list.append(...prs.map(renderPR));

  card.append(title, list);
  return card;
}

async function showMergedPRs() {
  const status = document.getElementById('pr-status');
  try {
    const prs = await fetchMergedPRs();
    const groups = groupByRepo(prs);
    const prWord = prs.length === 1 ? 'pull request' : 'pull requests';
    const repoWord = groups.size === 1 ? 'project' : 'projects';
    status.textContent = `${prs.length} merged ${prWord} across ${groups.size} ${repoWord}.`;
    document.getElementById('pr-list').append(
      ...[...groups].map(([repo, repoPRs]) => renderRepo(repo, repoPRs))
    );
  } catch (error) {
    console.error(error);
    status.textContent = "Couldn't reach GitHub right now. Try again in a minute, or use the link below.";
  }
}

showMergedPRs();
