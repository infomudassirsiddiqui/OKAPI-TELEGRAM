// State
const state = {
    balance: parseFloat(localStorage.getItem('balance')) || 0,
    totalMined: parseFloat(localStorage.getItem('totalMined')) || 0,
    hashRate: 0,
    miningStatus: localStorage.getItem('miningStatus') || 'Idle',
    ecoMining: localStorage.getItem('ecoMining') === 'true',
    poolBonus: parseFloat(localStorage.getItem('poolBonus')) || 1,
    questsCompleted: parseInt(localStorage.getItem('questsCompleted')) || 0,
    tasksCompleted: JSON.parse(localStorage.getItem('tasksCompleted')) || {
        checkin: false,
        refer: false,
        community: false,
        followX: false
    },
    lastAIUpdate: parseInt(localStorage.getItem('lastAIUpdate')) || 0,
    sessionStart: parseInt(localStorage.getItem('sessionStart')) || 0,
    referralId: localStorage.getItem('referralId') || `ref_${Math.random().toString(36).slice(2, 10)}`,
    referralCount: parseInt(localStorage.getItem('referralCount')) || 0,
    referralCommission: parseFloat(localStorage.getItem('referralCommission')) || 0,
    referredBy: localStorage.getItem('referredBy') || null,
    nftMinted: localStorage.getItem('nftMinted') === 'true'
};

// DOM Elements
const elements = {};
function initElements() {
    const ids = [
        'mineButton', 'voiceControl', 'ecoMining', 'optimizeButton', 'createPool', 'joinPool',
        'mintNFT', 'tokenBalance', 'hashRate', 'totalMined', 'aiSuggestion', 'marketChart',
        'sidebarToggle', 'sidebar', 'checkinButton', 'referButton', 'communityButton', 'followXButton',
        'stakeBalance', 'questList', 'sessionTimer', 'referralLink', 'referralCount', 'referralCommission',
        'checkinStatus', 'referStatus', 'communityStatus', 'followXStatus', 'shareX', 'shareTelegram'
    ];
    ids.forEach(id => {
        elements[id] = document.getElementById(id);
        if (!elements[id]) console.warn(`Element #${id} not found`);
    });
    elements.tabLinks = document.querySelectorAll('.tab-link');
    elements.tabContents = document.querySelectorAll('.tab-content');
}

// Mining Logic
let miningInterval = null;
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
function startMining() {
    const now = Date.now();
    if (state.sessionStart > 0 && now - state.sessionStart < SESSION_DURATION) {
        showToast('Mining session already active', 'info');
        return;
    }
    if (!elements.mineButton) {
        console.error('Mine button not found');
        showToast('Error starting mining. Refresh page.', 'error');
        return;
    }
    state.miningStatus = 'Mining';
    state.sessionStart = now;
    elements.mineButton.classList.add('mining');
    elements.mineButton.querySelector('span').textContent = 'Stop Mining';
    updateHashRate();
    miningInterval = setInterval(() => {
        if (now - state.sessionStart >= SESSION_DURATION) {
            stopMining(true);
            return;
        }
        const increment = (state.ecoMining ? 0.01 : 0.02) * state.poolBonus;
        state.balance += increment;
        state.totalMined += increment;
        if (state.referredBy) {
            state.referralCommission += increment * 0.05; // 5% commission
            localStorage.setItem('referralCommission', state.referralCommission.toFixed(2));
        }
        localStorage.setItem('balance', state.balance.toFixed(2));
        localStorage.setItem('totalMined', state.totalMined.toFixed(2));
        localStorage.setItem('miningStatus', state.miningStatus);
        localStorage.setItem('sessionStart', state.sessionStart);
        updateUI();
        checkQuests();
    }, 1000);
    showToast('24-hour mining session started! 🦒', 'success');
    animateProgressRing();
    updateTimer();
}

function stopMining(autoStopped = false) {
    if (!elements.mineButton) return;
    state.miningStatus = 'Idle';
    state.sessionStart = 0;
    elements.mineButton.classList.remove('mining');
    elements.mineButton.querySelector('span').textContent = 'Tap to Mine';
    clearInterval(miningInterval);
    miningInterval = null;
    localStorage.setItem('miningStatus', state.miningStatus);
    localStorage.setItem('sessionStart', state.sessionStart);
    showToast(autoStopped ? 'Mining session ended' : 'Mining stopped', 'info');
    updateUI();
    animateProgressRing();
}

function updateHashRate() {
    state.hashRate = (state.ecoMining ? 50 : 100) + (state.referralCount * 10);
    if (Date.now() - state.lastAIUpdate < 3600000) {
        state.hashRate = (state.ecoMining ? 75 : 150) + (state.referralCount * 10);
    }
}

function animateProgressRing() {
    const circle = document.querySelector('.progress-ring-circle');
    if (circle) {
        circle.classList.toggle('mining', state.miningStatus === 'Mining');
    }
}

function updateTimer() {
    if (!elements.sessionTimer || !state.sessionStart || state.miningStatus !== 'Mining') {
        if (elements.sessionTimer) elements.sessionTimer.textContent = 'Session: Not started';
        return;
    }
    const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - state.sessionStart;
        if (elapsed >= SESSION_DURATION || state.miningStatus !== 'Mining') {
            elements.sessionTimer.textContent = 'Session: Not started';
            clearInterval(interval);
            return;
        }
        const remaining = SESSION_DURATION - elapsed;
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        elements.sessionTimer.textContent = `Session: ${hours}h ${minutes}m ${seconds}s remaining`;
    }, 1000);
}

// Event Listeners
function initEventListeners() {
    if (!elements.mineButton) {
        console.error('Mine button not available');
        return;
    }
    elements.tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            elements.tabLinks.forEach(l => l.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            const tab = document.getElementById(link.dataset.tab);
            if (tab) tab.classList.add('active');
            if (link.dataset.tab === 'mine' && elements.sessionTimer) {
                showToast('Tap the "Tap to Mine" button to start a 24-hour session! 🦒', 'info');
            }
        });
    });

    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', () => {
            if (elements.sidebar) elements.sidebar.classList.toggle('collapsed');
        });
    }

    elements.mineButton.addEventListener('click', () => {
        if (state.miningStatus === 'Idle') startMining();
        else stopMining();
    });

    if (elements.ecoMining) {
        elements.ecoMining.addEventListener('change', () => {
            state.ecoMining = elements.ecoMining.checked;
            localStorage.setItem('ecoMining', state.ecoMining);
            if (state.miningStatus === 'Mining') {
                updateHashRate();
                showToast(`Eco-Mining ${state.ecoMining ? 'enabled' : 'disabled'}`, 'info');
                updateUI();
            }
        });
    }

    if (elements.optimizeButton) {
        elements.optimizeButton.addEventListener('click', () => {
            updateHashRate();
            state.lastAIUpdate = Date.now();
            localStorage.setItem('lastAIUpdate', state.lastAIUpdate);
            if (elements.aiSuggestion) elements.aiSuggestion.textContent = `Optimized: Mining at ${state.hashRate} H/s for 1 hour`;
            showToast('AI optimization applied 🦒', 'success');
            updateUI();
        });
    }

    if (elements.createPool) {
        elements.createPool.addEventListener('click', () => {
            state.poolBonus = 1.2;
            localStorage.setItem('poolBonus', state.poolBonus);
            showToast('Pool created! 20% mining bonus applied 🦒', 'success');
            updateUI();
        });
    }

    if (elements.joinPool) {
        elements.joinPool.addEventListener('click', () => {
            state.poolBonus = 1.15;
            localStorage.setItem('poolBonus', state.poolBonus);
            showToast('Joined global Okapi pool! 15% bonus applied', 'success');
            updateUI();
        });
    }

    if (elements.mintNFT) {
        elements.mintNFT.addEventListener('click', () => {
            if (state.totalMined >= 10 && !state.nftMinted) {
                state.nftMinted = true;
                state.questsCompleted++;
                localStorage.setItem('nftMinted', 'true');
                localStorage.setItem('questsCompleted', state.questsCompleted);
                elements.mintNFT.disabled = true;
                showToast('Okapi Legend NFT minted! 🦒', 'success');
                updateUI();
            } else {
                showToast(state.nftMinted ? 'NFT already minted' : 'Mine 10 OKP to mint NFT', 'error');
            }
        });
    }

    function handleTask(button, statusEl, taskKey, reward, message) {
        if (button && !state.tasksCompleted[taskKey]) {
            state.balance += reward;
            state.totalMined += reward;
            state.tasksCompleted[taskKey] = true;
            localStorage.setItem('balance', state.balance.toFixed(2));
            localStorage.setItem('totalMined', state.totalMined.toFixed(2));
            localStorage.setItem('tasksCompleted', JSON.stringify(state.tasksCompleted));
            button.disabled = true;
            if (statusEl) statusEl.textContent = '✅ Done';
            showToast(`${message} 🦒`, 'success');
            updateUI();
        } else if (button) {
            showToast('Task already completed', 'info');
        }
    }

    if (elements.checkinButton) elements.checkinButton.addEventListener('click', () => handleTask(elements.checkinButton, elements.checkinStatus, 'checkin', 0.5, 'Daily Check-In: +0.5 OKP'));
    if (elements.referButton) elements.referButton.addEventListener('click', () => handleTask(elements.referButton, elements.referStatus, 'refer', 1.0, 'Referral: +1.0 OKP'));
    if (elements.communityButton) elements.communityButton.addEventListener('click', () => handleTask(elements.communityButton, elements.communityStatus, 'community', 0.8, 'Joined Community: +0.8 OKP'));
    if (elements.followXButton) elements.followXButton.addEventListener('click', () => handleTask(elements.followXButton, elements.followXStatus, 'followX', 0.7, 'Followed @OkapiToken: +0.7 OKP'));

    if (elements.voiceControl) elements.voiceControl.addEventListener('click', () => showToast('Voice control available in iOS/Android app', 'info'));

    if (elements.shareX) elements.shareX.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.referralLink.value).then(() => showToast('Referral link copied! Share on X 🦒', 'success'));
    });

    if (elements.shareTelegram) elements.shareTelegram.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.referralLink.value).then(() => showToast('Referral link copied! Share on Telegram 🦒', 'success'));
    });
}

// Referral System
function simulateReferralJoin(referralId) {
    if (referralId && referralId !== state.referralId && !state.referredBy) {
        state.referredBy = referralId;
        state.referralCount++;
        localStorage.setItem('referredBy', state.referredBy);
        localStorage.setItem('referralCount', state.referralCount);
        showToast('Joined via referral! Referrer gains 5% commission 🦒', 'success');
        updateHashRate();
        updateUI();
    }
}

// Market Trends Chart
let marketChartInstance = null;
function initMarketChart() {
    if (!elements.marketChart) return;
    const ctx = elements.marketChart.getContext('2d');
    if (marketChartInstance) marketChartInstance.destroy();
    marketChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
                label: 'OKP Price ($)',
                data: [0.1, 0.15, 0.12, 0.18, 0.2],
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    setInterval(() => {
        if (marketChartInstance) {
            const newPrice = (Math.random() * 0.1 + 0.15).toFixed(2);
            marketChartInstance.data.datasets[0].data.shift();
            marketChartInstance.data.datasets[0].data.push(newPrice);
            marketChartInstance.update();
        }
    }, 10000);
}

// Quests
function checkQuests() {
    if (elements.mintNFT) elements.mintNFT.disabled = state.nftMinted || state.totalMined < 10;
    if (state.totalMined >= 10 && !state.nftMinted) showToast('Quest completed! You can now mint an NFT 🦒', 'success');
}

// UI Update
function updateUI() {
    if (elements.tokenBalance) elements.tokenBalance.textContent = state.balance.toFixed(2);
    if (elements.hashRate) elements.hashRate.textContent = state.hashRate;
    if (elements.totalMined) elements.totalMined.textContent = state.totalMined.toFixed(2);
    if (elements.stakeBalance) elements.stakeBalance.textContent = state.balance.toFixed(2);
    if (elements.checkinButton) elements.checkinButton.disabled = state.tasksCompleted.checkin;
    if (elements.referButton) elements.referButton.disabled = state.tasksCompleted.refer;
    if (elements.communityButton) elements.communityButton.disabled = state.tasksCompleted.community;
    if (elements.followXButton) elements.followXButton.disabled = state.tasksCompleted.followX;
    if (elements.checkinStatus) elements.checkinStatus.textContent = state.tasksCompleted.checkin ? '✅ Done' : '';
    if (elements.referStatus) elements.referStatus.textContent = state.tasksCompleted.refer ? '✅ Done' : '';
    if (elements.communityStatus) elements.communityStatus.textContent = state.tasksCompleted.community ? '✅ Done' : '';
    if (elements.followXStatus) elements.followXStatus.textContent = state.tasksCompleted.followX ? '✅ Done' : '';
    if (elements.referralLink) elements.referralLink.value = `https://okapi.mine/${state.referralId}`;
    if (elements.referralCount) elements.referralCount.textContent = state.referralCount;
    if (elements.referralCommission) elements.referralCommission.textContent = state.referralCommission.toFixed(2);
    checkQuests();
}

// Toast Notification
function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.className = `toast ${type}`;
        toast.querySelector('.toast-message').textContent = message;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 3000);
    }
}

// Initialize
function init() {
    initElements();
    if (!elements.mineButton) {
        console.error('Critical elements missing. Check HTML IDs.');
        showToast('Error loading app. Please refresh.', 'error');
        return;
    }
    localStorage.setItem('referralId', state.referralId);
    initEventListeners();
    initMarketChart();
    updateUI();
    if (state.miningStatus === 'Mining' && Date.now() - state.sessionStart < SESSION_DURATION) {
        startMining();
    } else if (state.miningStatus === 'Mining') {
        state.miningStatus = 'Idle';
        state.sessionStart = 0;
        localStorage.setItem('miningStatus', state.miningStatus);
        localStorage.setItem('sessionStart', state.sessionStart);
    }
    const lastTaskReset = parseInt(localStorage.getItem('lastTaskReset')) || 0;
    const now = Date.now();
    if (now - lastTaskReset > 24 * 60 * 60 * 1000) {
        state.tasksCompleted = { checkin: false, refer: false, community: false, followX: false };
        localStorage.setItem('tasksCompleted', JSON.stringify(state.tasksCompleted));
        localStorage.setItem('lastTaskReset', now);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    if (refId) simulateReferralJoin(refId);
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', () => clearInterval(miningInterval));