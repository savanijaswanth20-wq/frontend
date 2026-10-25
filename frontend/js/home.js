/**
 * Home Page Logic (frontend/js/home.js)
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Load reusable navbar & footer
  await loadComponent("navbar-container", "components/navbar.html");
  await loadComponent("footer-container", "components/footer.html");
  initNav("home");

  // Initialize Canvas 2D Starfield
  initStarfield("hero-canvas");

  // Populate Featured Jobs
  const featuredJobsContainer = document.getElementById("featured-jobs-container");
  if (featuredJobsContainer && window.JobNexData?.INITIAL_JOBS) {
    const jobs = window.JobNexData.INITIAL_JOBS.filter(j => j.isFeatured).slice(0, 4);
    featuredJobsContainer.innerHTML = jobs.map(job => `
      <div class="glass-card border border-white/80 hover:border-brand-300 rounded-xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
        <div>
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img src="${job.companyLogo}" alt="${job.company}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div>
                <h3 class="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                  ${job.title}
                </h3>
                <p class="text-xs font-semibold text-slate-600">${job.company}</p>
              </div>
            </div>
            <button type="button" class="bookmark-home-btn text-slate-400 hover:text-rose-500 p-1 cursor-pointer" data-id="${job.id}">
              <i data-lucide="bookmark" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 mb-3">
            <span class="flex items-center gap-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
              ${job.location}
            </span>
            <span class="flex items-center gap-1">
              <i data-lucide="briefcase" class="w-3.5 h-3.5 text-slate-400"></i>
              ${job.experienceLevel}
            </span>
          </div>

          <div class="flex flex-wrap gap-1.5 mb-4">
            ${job.skills.slice(0, 3).map(s => `
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                ${s}
              </span>
            `).join("")}
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Package</span>
            <span class="font-bold text-sm text-amber-700">
              ${formatCurrency(job.salaryMin, job.currency)} - ${formatCurrency(job.salaryMax, job.currency)}
            </span>
          </div>

          <a href="pages/jobs.html?apply=${job.id}" class="btn-polish bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-xl">
            Apply Now
          </a>
        </div>
      </div>
    `).join("");

    // Bookmark click handlers
    document.querySelectorAll(".bookmark-home-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        playSound("click");
        btn.querySelector("i")?.classList.toggle("fill-rose-500");
        btn.querySelector("i")?.classList.toggle("text-rose-500");
        showToast("Bookmark updated");
      });
    });
  }

  // Handle Search submission
  const heroSearchForm = document.getElementById("hero-search-form");
  if (heroSearchForm) {
    heroSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("search-query")?.value.trim() || "";
      const region = document.getElementById("search-region")?.value || "ALL";
      const exp = document.getElementById("search-exp")?.value || "ALL";

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (region !== "ALL") params.set("region", region);
      if (exp !== "ALL") params.set("exp", exp);

      window.location.href = `pages/jobs.html?${params.toString()}`;
    });
  }

  // Trending tag clicks
  document.querySelectorAll(".trending-tag-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.getAttribute("data-tag");
      window.location.href = `pages/jobs.html?q=${encodeURIComponent(tag)}`;
    });
  });

  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
});
