console.log('Script loaded');

const form = document.getElementById('userForm');
const usernameInput = document.getElementById('usernameInput');
const profileSection = document.getElementById('profileSection');
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const bioEl = document.getElementById('bio');
const followersEl = document.getElementById('followers');
const profileLink = document.getElementById('profileLink');
const errorEl = document.getElementById('error');

let languageChart, repoTypeChart;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;

  errorEl.classList.add('hidden');
  profileSection.classList.add('hidden'); // Skjul profil-sektionen indtil data er klar
  
  if (languageChart) languageChart.destroy();
  if (repoTypeChart) repoTypeChart.destroy();

  try {
    // Hent brugerdata
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error('User Not Found');
    const user = await userRes.json();

    // Hent repos (maks 100)
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    if (!reposRes.ok) throw new Error('Repos Not Found');
    const repos = await reposRes.json();
    console.log("Repos hentet:", repos);

    // Vis profil info
    avatar.src = user.avatar_url;
    nameEl.textContent = user.name || user.login;
    bioEl.textContent = user.bio || 'Ingen bio tilgængelig';
    followersEl.textContent = `${user.followers} follower${user.followers !== 1 ? 's' : ''}`;
    profileLink.href = user.html_url;
    profileLink.textContent = "See profile on GitHub";

    // Vis profil-sektion NU, efter succesfuld hentning
    profileSection.classList.remove('hidden');
    profileSection.scrollIntoView({ behavior: 'smooth' });

    // Data til grafer
    const langCount = {};
    const repoTypeCount = { fork: 0, source: 0, archived: 0 };

    repos.forEach(repo => {
      if (repo.language) langCount[repo.language] = (langCount[repo.language] || 0) + 1;
      if (repo.fork) repoTypeCount.fork++;
      else if (repo.archived) repoTypeCount.archived++;
      else repoTypeCount.source++;
    });

    // Tegn grafer
    drawLanguageChart(langCount);
    drawRepoTypeChart(repoTypeCount);

    // Vis repo-listen
    const repoList = document.getElementById('repoList');
    repoList.innerHTML = '';

    repos.forEach(repo => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${repo.html_url}" target="_blank" class="repo-link">
          <strong>${repo.name}</strong> 
          <span class="repo-language">${repo.language || 'Unknown'}</span> - 
          <span>${repo.stargazers_count} ⭐</span> 
          ${repo.fork ? '<em>(Fork)</em>' : ''}
        </a>
      `;
      repoList.appendChild(li);
    });

  } catch (err) {
    // Vis kun fejlmeddelelsen, skjul profil-sektionen
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    profileSection.classList.add('hidden');
  }
});



// Tegn sprog-bar chart
// Tegn sprog-bar chart med gradient og pænere styling
function drawLanguageChart(langCount) {
  const ctx = document.getElementById('languageChart').getContext('2d');
  const labels = Object.keys(langCount);
  const data = Object.values(langCount);

  // Lav gradient farve til barerne
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(56, 161, 105, 0.9)');
  gradient.addColorStop(1, 'rgba(56, 161, 105, 0.4)');

  languageChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Repositories per language',
        data,
        backgroundColor: gradient,
        borderRadius: 8,
        barPercentage: 0.5,
        maxBarThickness: 40,
        hoverBackgroundColor: 'rgba(56, 161, 105, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: '#444',
            font: { size: 14 }
          },
          grid: {
            color: '#eee'
          }
        },
        x: {
          ticks: {
            color: '#555',
            font: { size: 14 }
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#383838',
          titleColor: '#a8ff60',
          bodyColor: '#fff',
          cornerRadius: 6,
          padding: 10,
          callbacks: {
            label: ctx => `Repos: ${ctx.parsed.y}`
          }
        }
      }
    }
  });
}

// Tegn repo-type donut chart med lidt mere kontrast og skygge
function drawRepoTypeChart(repoTypeCount) {
  const ctx = document.getElementById('repoTypeChart').getContext('2d');
  const labels = ['Source', 'Forks', 'Archived'];
  const data = [
    repoTypeCount.source,
    repoTypeCount.fork,
    repoTypeCount.archived
  ];

  const colors = [
    'rgba(56, 161, 105, 0.9)',   // Grøn
    'rgba(96, 165, 250, 0.9)',   // Blå
    'rgba(244, 63, 94, 0.9)'     // Rød
  ];

  repoTypeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverOffset: 10 ,
        borderRadius: 12,
        borderColor: '#222',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        duration: 1200,
        easing: 'easeOutQuart'
      },
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#ffffff',
            font: { size: 13, weight: 'normal' }
          }
        },
        tooltip: {
          backgroundColor: '#222',
          titleColor: '#a8ff60',
          bodyColor: '#eee',
          cornerRadius: 6,
          padding: 12,
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed}`
          }
        }
      }
    }
  });
}




