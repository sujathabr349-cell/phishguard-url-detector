/**
 * PhishGuard - Frontend Interaction Controller
 * Handles animated URL scanning, client-side validation, modal workflows,
 * and responsive mobile drawer behaviors.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile navigation drawer toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-open');
        });
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        });
    }

    // 2. Sample URL quick-fill buttons
    const sampleButtons = document.querySelectorAll('.sample-btn');
    const urlInput = document.getElementById('urlInput');
    sampleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sampleUrl = btn.getAttribute('data-url');
            if (urlInput && sampleUrl) {
                urlInput.value = sampleUrl;
                urlInput.focus();
            }
        });
    });

    // 3. Scan Form animated progress pipeline
    const scanForm = document.getElementById('scanForm');
    const submitBtn = document.getElementById('submitScanBtn');
    const progressContainer = document.getElementById('scanProgressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressStatusText = document.getElementById('progressStatusText');

    const stepParse = document.getElementById('stepParse');
    const stepFeatures = document.getElementById('stepFeatures');
    const stepHeuristics = document.getElementById('stepHeuristics');
    const stepML = document.getElementById('stepML');

    if (scanForm && submitBtn && progressContainer) {
        scanForm.addEventListener('submit', (e) => {
            const rawVal = (urlInput ? urlInput.value : '').trim();

            // Client-side pre-validation
            if (!rawVal) {
                e.preventDefault();
                alert('Please enter a destination URL.');
                return;
            }

            if (!rawVal.startsWith('http://') && !rawVal.startsWith('https://')) {
                e.preventDefault();
                alert('Invalid URL scheme: PhishGuard requires URLs to begin with http:// or https://');
                return;
            }

            // Prevent duplicate clicks
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';

            // Reveal animated progress pipeline
            progressContainer.style.display = 'block';

            // Pipeline sequence simulation before standard POST finishes
            let step = 0;
            const steps = [
                { el: stepParse, text: 'Deconstructing hostname and validating RFC syntax...', progress: 25 },
                { el: stepFeatures, text: 'Extracting lexical patterns, dot counts, and character entropy...', progress: 55 },
                { el: stepHeuristics, text: 'Evaluating weighted security heuristic matrix...', progress: 80 },
                { el: stepML, text: 'Running feature vector against Random Forest classifier...', progress: 98 }
            ];

            const interval = setInterval(() => {
                if (step < steps.length) {
                    const current = steps[step];
                    if (current.el) {
                        current.el.classList.add('active');
                        if (step > 0 && steps[step - 1].el) {
                            steps[step - 1].el.classList.remove('active');
                            steps[step - 1].el.classList.add('done');
                        }
                    }
                    if (progressBarFill) progressBarFill.style.width = current.progress + '%';
                    if (progressStatusText) progressStatusText.textContent = current.text;
                    step++;
                } else {
                    clearInterval(interval);
                }
            }, 300);
        });
    }

    // 4. Copy URL button interaction
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    const copyBtnText = document.getElementById('copyBtnText');
    if (copyUrlBtn && copyBtnText) {
        copyUrlBtn.addEventListener('click', () => {
            const textToCopy = copyUrlBtn.getAttribute('data-copy');
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const original = copyBtnText.textContent;
                    copyBtnText.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtnText.textContent = original;
                    }, 2000);
                }).catch(() => {
                    alert('Could not copy link to clipboard.');
                });
            }
        });
    }

    // 5. Clear History Confirmation Modal
    const clearBtn = document.getElementById('clearAllHistoryBtn');
    const clearModal = document.getElementById('clearConfirmModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');

    if (clearBtn && clearModal) {
        clearBtn.addEventListener('click', () => {
            clearModal.style.display = 'flex';
        });

        const closeModal = () => {
            clearModal.style.display = 'none';
        };

        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
        if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
        clearModal.addEventListener('click', (e) => {
            if (e.target === clearModal) closeModal();
        });
    }
});
