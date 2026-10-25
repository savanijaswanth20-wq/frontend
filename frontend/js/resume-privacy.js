/**
 * JobNex - Resume Analysis & Privacy Script
 */

document.addEventListener("DOMContentLoaded", () => {
  const tabResumeBtn = document.getElementById("tab-btn-resume");
  const tabPrivacyBtn = document.getElementById("tab-btn-privacy");
  const sectionResume = document.getElementById("section-resume-tab");
  const sectionPrivacy = document.getElementById("section-privacy-tab");
  const toastContainer = document.getElementById("resume-toast-notification");
  const toastText = document.getElementById("resume-toast-text");

  const fileInput = document.getElementById("resume-file-input");
  const filenameDisplay = document.getElementById("display-resume-filename");
  const jdTextarea = document.getElementById("jd-textarea-input");
  const analyzeBtn = document.getElementById("btn-analyze-jd");
  const sampleFrontendBtn = document.getElementById("btn-sample-frontend");
  const sampleDsBtn = document.getElementById("btn-sample-ds");

  // Analysis result elements
  const scoreValueEl = document.getElementById("scorecard-score-value");
  const matchLevelBadge = document.getElementById("match-level-badge");
  const matchedSkillsList = document.getElementById("matched-skills-list");
  const missingSkillsList = document.getElementById("missing-skills-list");

  // Privacy elements
  const toggleEmployer = document.getElementById("toggle-mask-employer");
  const toggleContact = document.getElementById("toggle-mask-contact");
  const toggleAnon = document.getElementById("toggle-anon-avatar");
  const savePrivacyBtn = document.getElementById("btn-save-privacy");
  const previewBtn = document.getElementById("btn-preview-recruiter-view");
  const previewModal = document.getElementById("recruiter-preview-modal");
  const closePreviewBtn = document.getElementById("btn-close-preview-modal");
  const closePreviewFooter = document.getElementById("btn-close-preview-modal-footer");

  let activeTab = "resume";
  let isAnalyzing = false;

  function switchTab(tab) {
    activeTab = tab;
    if (tab === "resume") {
      tabResumeBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all bg-white text-slate-900 shadow-xs cursor-pointer";
      tabPrivacyBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900 cursor-pointer";
      sectionResume.classList.remove("hidden");
      sectionPrivacy.classList.add("hidden");
    } else {
      tabPrivacyBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all bg-white text-slate-900 shadow-xs cursor-pointer";
      tabResumeBtn.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900 cursor-pointer";
      sectionPrivacy.classList.remove("hidden");
      sectionResume.classList.add("hidden");
    }
  }

  function showToast(msg) {
    if (!toastContainer || !toastText) return;
    toastText.textContent = msg;
    toastContainer.classList.remove("hidden");
    setTimeout(() => {
      toastContainer.classList.add("hidden");
    }, 3500);
  }

  if (tabResumeBtn) tabResumeBtn.addEventListener("click", () => switchTab("resume"));
  if (tabPrivacyBtn) tabPrivacyBtn.addEventListener("click", () => switchTab("privacy"));

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (filenameDisplay) filenameDisplay.textContent = file.name;
        showToast(`Uploaded new resume: ${file.name}`);
        if (window.JobNexUtils) window.JobNexUtils.playSound("success");
      }
    });
  }

  if (sampleFrontendBtn) {
    sampleFrontendBtn.addEventListener("click", () => {
      if (jdTextarea) {
        jdTextarea.value = "Senior Frontend Engineer (React / TypeScript)\n\nKey Requirements:\n- 3+ years experience with React, Next.js, and modern TypeScript\n- Deep knowledge of Tailwind CSS, CSS Modules, and accessible UI components\n- Experience with GraphQL or REST APIs, state management (Zustand/Redux)\n- Strong understanding of Core Web Vitals, testing with Jest/Vitest, and CI/CD pipelines";
      }
      showToast("Loaded Senior Frontend Engineer sample JD");
    });
  }

  if (sampleDsBtn) {
    sampleDsBtn.addEventListener("click", () => {
      if (jdTextarea) {
        jdTextarea.value = "Data Scientist / ML Engineer (Forecasting)\n\nKey Requirements:\n- Strong foundation in Python, SQL, Pandas, and Scikit-Learn\n- Experience designing and training Machine Learning & Deep Learning models\n- Knowledge of Data Visualization tools (Plotly, Tableau) and AWS Cloud deployments\n- Excellent problem-solving skills and predictive modeling experience";
      }
      showToast("Loaded Data Scientist sample JD");
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", () => {
      if (isAnalyzing) return;
      isAnalyzing = true;

      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = `
        <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span>Analyzing Resume with AI...</span>
      `;

      setTimeout(() => {
        isAnalyzing = false;
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `
          <i data-lucide="sparkles" class="w-4 h-4"></i>
          <span>Analyze Resume against Job Description</span>
        `;
        if (window.lucide) window.lucide.createIcons();

        const jd = (jdTextarea ? jdTextarea.value : "").toLowerCase();
        let matched = ["React", "TypeScript", "REST APIs", "PostgreSQL", "Docker"];
        let missing = ["AWS Cloud Deployments"];

        if (jd.includes("python") || jd.includes("data")) {
          matched = ["Python", "SQL", "Pandas", "Scikit-Learn"];
          missing = ["Deep Learning (PyTorch)", "AWS SageMaker"];
          if (scoreValueEl) scoreValueEl.textContent = "76%";
          if (matchLevelBadge) matchLevelBadge.textContent = "Moderate Match";
        } else {
          matched = ["React", "TypeScript", "Node.js", "REST APIs", "PostgreSQL", "Tailwind CSS", "Docker"];
          missing = ["AWS Cloud Deployments", "CI/CD Pipelines"];
          if (scoreValueEl) scoreValueEl.textContent = "88%";
          if (matchLevelBadge) matchLevelBadge.textContent = "Strong Match";
        }

        if (matchedSkillsList) {
          matchedSkillsList.innerHTML = matched.map((s) => `
            <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">✓ ${s}</span>
          `).join("");
        }

        if (missingSkillsList) {
          missingSkillsList.innerHTML = missing.map((s) => `
            <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">! ${s}</span>
          `).join("");
        }

        if (window.JobNexUtils) window.JobNexUtils.playSound("success");
        showToast("ATS match analysis generated!");
      }, 1000);
    });
  }

  if (savePrivacyBtn) {
    savePrivacyBtn.addEventListener("click", () => {
      if (window.JobNexUtils) {
        window.JobNexUtils.playSound("success");
        window.JobNexUtils.showToast("Privacy settings saved successfully!", "success");
      }
      showToast("Privacy settings saved successfully!");
    });
  }

  function openPreview() {
    if (previewModal) previewModal.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  function closePreview() {
    if (previewModal) previewModal.classList.add("hidden");
  }

  if (previewBtn) previewBtn.addEventListener("click", openPreview);
  if (closePreviewBtn) closePreviewBtn.addEventListener("click", closePreview);
  if (closePreviewFooter) closePreviewFooter.addEventListener("click", closePreview);
  if (previewModal) {
    previewModal.addEventListener("click", (e) => {
      if (e.target === previewModal) closePreview();
    });
  }
});
