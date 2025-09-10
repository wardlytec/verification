// ====== DOM Elements ======
const overlay = document.getElementById("reviewsOverlay");
const popup = document.getElementById("reviewsPopup");
const toggleBtn = document.getElementById("toggleReviews");
const closeBtn = document.getElementById("closePopup");
const reviewForm = document.getElementById("reviewForm");
const reviewFormCard = document.getElementById("reviewFormCard");
const cancelFormBtn = document.getElementById("cancelFormBtn");
const showFormBtn = document.getElementById("showFormBtn");
const showFormBtnInside = document.getElementById("showFormBtnInside");

// Main elements outside modal
const avgRatingEl = document.getElementById("avgRating");
const avgStarsEl = document.getElementById("avgStars");
const satisfiedCountEl = document.getElementById("satisfiedCount");
const totalReviewsEl = document.getElementById("totalReviews");
const successCountEl = document.getElementById("successCount");
const successCountErrorMainEl = document.getElementById("successCountErrorMain");

// Elements inside modal
const avgRatingModalEl = document.getElementById("avgRatingModal");
const avgStarsModalEl = document.getElementById("avgStarsModal");
const satisfiedCountModalEl = document.getElementById("satisfiedCountModal");
const totalReviewsModalEl = document.getElementById("totalReviewsModal");
const successCountModalEl = document.getElementById("successCountModal");
const successCountErrorEl = document.getElementById("successCountError");

// Reviews containers
const reviewsContainer = document.getElementById("reviewsContainer");
const mainReviewsContainer = document.getElementById("mainReviewsContainer");

// Supabase configuration
const SUPABASE_URL = "https://rtzkgoxsthhocibehzay.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0emtnb3hzdGhob2NpYmVoemF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTk5NzksImV4cCI6MjA2OTQ5NTk3OX0.bj5fSRTLXze1h0kkSveSZsEyfrkRAtoXvqeWtUikD7o";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== Utility Functions ======
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function generateStars(rating) {
  const fullStars = '★'.repeat(rating);
  const emptyStars = '☆'.repeat(5 - rating);
  return fullStars + emptyStars;
}

function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;

  const sum = reviews.reduce((acc, review) => acc + (review.stars || 0), 0);
  return (sum / reviews.length).toFixed(1);
}

// ====== Load Functions ======
// Load users count and transactions count
async function loadUsersCount() {
  try {
    console.log("🔄 Loading users count...");

    // Get users count
    const { count, error } = await client
      .from("users")
      .select("*", { count: 'exact', head: true });

    if (error) {
      console.error("❌ Error fetching users count:", error);
      return;
    }

    console.log("✅ Users count fetched:", count);
    const total = count || 0;
    const satisfied = total > 0 ? total : "0";

    // Update outside modal
    satisfiedCountEl.textContent = satisfied;

    // Update inside modal
    satisfiedCountModalEl.textContent = satisfied;

    // Get completed transactions count
    try {
      console.log("🔄 Loading completed transactions count...");

      // Get completed recharge transactions
      const { count: rechargeCount, error: rechargeError } = await client
        .from("recharge_transactions")
        .select("*", { count: 'exact', head: true })
        .eq("status", "تم");

      // Get completed supply transactions
      const { count: supplyCount, error: supplyError } = await client
        .from("supply_transactions")
        .select("*", { count: 'exact', head: true })
        .eq("status", "تم");

      // Check for errors
      const successError = rechargeError || supplyError;

      if (successError) {
        console.error("❌ Error fetching completed transactions:", successError);
        if (rechargeError) {
          console.error("❌ Error in recharge transactions:", rechargeError);
        }
        if (supplyError) {
          console.error("❌ Error in supply transactions:", supplyError);
        }

        // Use default values in case of error
        successCountEl.textContent = "0";
        successCountModalEl.textContent = "0";
        // Show error message
        successCountErrorEl.style.display = "block";
        successCountErrorMainEl.style.display = "block";
      } else {
        console.log("✅ Completed recharge transactions:", rechargeCount);
        console.log("✅ Completed supply transactions:", supplyCount);

        // Sum transactions from both tables
        const successTotal = (rechargeCount || 0) + (supplyCount || 0);
        console.log("✅ Total completed transactions:", successTotal);

        // Update successful operations count outside modal
        successCountEl.textContent = successTotal;

        // Update successful operations count inside modal
        successCountModalEl.textContent = successTotal;

        // Hide error message
        successCountErrorEl.style.display = "none";
        successCountErrorMainEl.style.display = "none";
      }
    } catch (err) {
      console.error("❌ Exception when fetching completed transactions:", err);
      // Use default values in case of exception
      successCountEl.textContent = "0";
      successCountModalEl.textContent = "0";
      // Show error message
      successCountErrorEl.style.display = "block";
      successCountErrorMainEl.style.display = "block";
    }
  } catch (err) {
    console.error("⚡ Unexpected exception:", err);
  }
}

// Update reviews count
async function updateReviewsCount() {
  try {
    console.log("🔄 Updating reviews count...");

    const { count, error } = await client
      .from("reviews")
      .select("*", { count: 'exact', head: true });

    if (error) {
      console.error("❌ Error fetching reviews count:", error);
      return;
    }

    console.log("✅ Reviews count updated:", count);

    const reviewCount = count || 0;
    console.log("🔄 Updating reviews count in updateReviewsCount:", reviewCount);

    if (totalReviewsEl) {
      totalReviewsEl.textContent = reviewCount;
      console.log("✅ Reviews count updated on main page from updateReviewsCount");
    }

    if (totalReviewsModalEl) {
      totalReviewsModalEl.textContent = reviewCount;
      console.log("✅ Reviews count updated in modal from updateReviewsCount");
    }
  } catch (err) {
    console.error("⚡ Unexpected exception when updating reviews count:", err);
  }
}

// Load and display reviews
async function loadReviews() {
  try {
    console.log("🔄 Loading reviews...");

    // Check if required variables exist
    if (!client) {
      console.error("❌ Supabase client not initialized");
      return;
    }

    if (!reviewsContainer) {
      console.error("❌ Reviews container element not found");
      return;
    }

    // Use cached reviews if available
    if (window.cachedReviewsHtml) {
      console.log("✅ Using cached reviews");
      // عرض التقييمات فقط في القائمة المنبثقة وليس في الصفحة الرئيسية
      reviewsContainer.innerHTML = window.cachedReviewsHtml;
      return;
    }

    const { data: reviews, error } = await client
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching reviews:", error);
      reviewsContainer.innerHTML = 
        `<p style="color:red; text-align:center">🚨 Error fetching reviews: ${error.message}</p>`;
      return;
    }

    console.log("✅ Reviews fetched:", reviews);

    // Update reviews count
    const reviewCount = reviews ? reviews.length : 0;
    if (totalReviewsEl) totalReviewsEl.textContent = reviewCount;
    if (totalReviewsModalEl) totalReviewsModalEl.textContent = reviewCount;

    // Calculate average rating
    const avgRating = calculateAverageRating(reviews);
    if (avgRatingEl) avgRatingEl.textContent = avgRating;
    if (avgRatingModalEl) avgRatingModalEl.textContent = avgRating;

    // Update stars display
    if (avgStarsEl) avgStarsEl.textContent = generateStars(Math.round(avgRating));
    if (avgStarsModalEl) avgStarsModalEl.textContent = generateStars(Math.round(avgRating));

    // Display reviews
    if (!reviews || reviews.length === 0) {
      reviewsContainer.innerHTML = 
        `<p style="text-align:center; color:#888; padding:20px">No reviews yet</p>`;
      return;
    }

    let reviewsHtml = "";
    reviews.forEach((review, index) => {
      console.log(`📝 Processing review ${index + 1}:`, review);

      // Check for required data
      const name = review.name || "Anonymous";
      const location = review.location || "Unspecified";
      const stars = review.stars ? generateStars(review.stars) : "☆☆☆☆☆";
      const comment = review.comment || "No comment";

      reviewsHtml += `
        <div class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">${name.charAt(0).toUpperCase()}</div>
              <div>
                <div class="reviewer-name" onclick="handleNameClick('${escapeHtml(name)}', this)" style="cursor: pointer;" data-clicks="0">${escapeHtml(name)}</div>
                <div class="reviewer-location">📍 ${escapeHtml(location)}</div>
              </div>
            </div>
            <div>
              <div class="review-stars">${stars}</div>
              <div class="review-date">🕒 ${new Date(review.created_at).toLocaleDateString('ar-EG')}</div>
            </div>
          </div>
          <div class="review-text">${escapeHtml(comment)}</div>
        </div>
      `;
    });

    console.log("✅ Reviews HTML prepared");
    reviewsContainer.innerHTML = reviewsHtml;

    // Cache reviews for later use
    window.cachedReviewsHtml = reviewsHtml;
    console.log("✅ Reviews cached");

    // إضافة مستمعي الأحداث لجميع أسماء العملاء بعد تحميل التقييمات
    setTimeout(() => {
      const reviewerNames = document.querySelectorAll('.reviewer-name');
      reviewerNames.forEach(nameElement => {
        // التأكد من أن العنصر لديه الخاصية data-clicks
        if (!nameElement.getAttribute('data-clicks')) {
          nameElement.setAttribute('data-clicks', '0');
        }

        // إضافة مستمع الحدث إذا لم يكن موجودًا بالفعل
        if (!nameElement.hasAttribute('data-listener')) {
          nameElement.addEventListener('click', function() {
            handleNameClick(this.textContent, this);
          });
          nameElement.setAttribute('data-listener', 'true');
        }
      });
      console.log("✅ Added click listeners to all reviewer names");
    }, 100);

    // التقييمات ستظهر فقط في القائمة المنبثقة وليس في الصفحة الرئيسية
    // تم إزالة عرض التقييمات في الحاوية الرئيسية
  } catch (err) {
    console.error("⚡ Unexpected exception when fetching reviews:", err);
    reviewsContainer.innerHTML = 
      `<p style="color:red; text-align:center">🚨 Unexpected error: ${err.message}</p>`;
  }
}

// ====== Event Listeners ======
// Open and close modal
toggleBtn.addEventListener("click", () => {
  overlay.style.display = "flex";
  setTimeout(() => popup.classList.add("show"), 50);
  loadUsersCount();

  // Update reviews count with short delay
  setTimeout(() => {
    console.log("🔄 Updating reviews count when opening modal");
    updateReviewsCount();
  }, 300);

  // Load reviews with longer delay
  setTimeout(() => {
    console.log("🔄 Loading reviews when opening modal");
    loadReviews();
  }, 500);
});

closeBtn.addEventListener("click", () => {
  popup.classList.remove("show");
  setTimeout(() => overlay.style.display = "none", 200);
});

// Show review form
showFormBtn.addEventListener("click", () => { 
  reviewFormCard.style.display = "block"; 
  window.scrollTo({top: reviewFormCard.offsetTop, behavior: "smooth"}); 
});

showFormBtnInside.addEventListener("click", () => {
  popup.classList.remove("show");
  setTimeout(() => overlay.style.display = "none", 200);
  reviewFormCard.style.display = "block";
  window.scrollTo({top: reviewFormCard.offsetTop, behavior: "smooth"});
});

// Submit review
reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const location = document.getElementById("location").value.trim();
  const rating = parseInt(document.getElementById("rating").value);
  const comment = document.getElementById("comment").value.trim();

  if (!name || !location || !rating || !comment) { 
    alert("Please fill all fields"); 
    return; 
  }

  const { error } = await client.from("reviews").insert([{ 
    name, 
    location, 
    stars: rating, 
    comment 
  }]);

  if (error) { 
    console.error("Insert error:", error); 
    alert("❌ Error saving review: " + error.message); 
    return; 
  }

  alert("✅ Review submitted successfully");
  reviewForm.reset();
  reviewFormCard.style.display = "none";

  // Reload data
  loadUsersCount();

  // Clear cached reviews
  window.cachedReviewsHtml = null;
  console.log("✅ Cached reviews cleared");

  // Update reviews count after adding new review with short delay
  setTimeout(() => {
    console.log("🔄 Updating reviews count after adding new review");
    updateReviewsCount();
  }, 500);

  // Reload reviews after adding new review with longer delay
  setTimeout(() => {
    console.log("🔄 Reloading reviews after adding new review");
    loadReviews();
  }, 700);
});

// Hide form when cancel button is clicked
cancelFormBtn.addEventListener("click", () => {
  reviewFormCard.style.display = "none";
  reviewForm.reset();
});

// دالة للتعامل مع النقر على اسم العميل
function handleNameClick(name, element) {
  // زيادة عدد النقرات
  let clicks = parseInt(element.getAttribute('data-clicks')) + 1;
  element.setAttribute('data-clicks', clicks);

  // تغيير لون الاسم عند كل نقرة
  element.style.color = clicks >= 3 ? '#ff5100' : '';

  console.log(`🔍 Clicked on ${name}: ${clicks} times`);

  // عند الوصول إلى 5 نقرات
  if (clicks >= 5) {
    // إعادة تعيين عدد النقرات
    element.setAttribute('data-clicks', 0);
    element.style.color = '';

    // الحصول على التعليق الحالي
    const reviewCard = element.closest('.review-card');

    if (reviewCard) {
      // نسخ التعليق
      const reviewClone = reviewCard.cloneNode(true);

      // إضافة زر إزالة التعليق المثبت (يظهر فقط للمدير)
      const removePinButton = document.createElement("button");
      removePinButton.className = "btn ghost";
      removePinButton.innerHTML = '<i class="fas fa-unlink"></i> إزالة التثبيت';
      removePinButton.style.marginTop = "10px";
      removePinButton.style.display = "none"; // إخفاء الزر افتراضيًا

      // إظهار الزر فقط عند النقر على اسم المدير 5 مرات
      removePinButton.addEventListener("click", function() {
        // إزالة التعليق المثبت
        const pinnedReview = document.querySelector(".pinned-review");
        if (pinnedReview) {
          pinnedReview.remove();
        }
        // إظهار رسالة تأكيد
        const message = document.createElement("div");
        message.className = "success-message";
        message.textContent = "تم إزالة تثبيت التعليق بنجاح";
        message.style.textAlign = "center";
        message.style.padding = "10px";
        message.style.marginTop = "10px";
        message.style.backgroundColor = "rgba(76, 175, 80, 0.2)";
        message.style.borderRadius = "5px";
        reviewsContainer.insertBefore(message, reviewsContainer.firstChild);

        // إخفاء الرسالة بعد 3 ثواني
        setTimeout(() => {
          message.remove();
        }, 3000);
      });

      // إظهار زر الإزالة عند النقر على التعليق المثبت 3 مرات
      reviewClone.addEventListener("click", function(e) {
        // التأكد من أن النقر لم يكن على زر الإزالة بالفعل
        if (e.target.closest('.btn')) return;

        let pinClicks = parseInt(this.getAttribute('data-pin-clicks') || 0) + 1;
        this.setAttribute('data-pin-clicks', pinClicks);

        if (pinClicks >= 3 && removePinButton.style.display === "none") {
          removePinButton.style.display = "block";
          this.setAttribute('data-pin-clicks', 0);

          // إظهار رسالة تأكيد
          const message = document.createElement("div");
          message.className = "info-message";
          message.textContent = "يمكنك الآن إزالة تثبيت التعليق";
          message.style.textAlign = "center";
          message.style.padding = "10px";
          message.style.marginTop = "10px";
          message.style.backgroundColor = "rgba(33, 150, 243, 0.2)";
          message.style.borderRadius = "5px";

          // التحقق من وجود رسالة سابقة وإزالتها
          const existingMessage = this.parentNode.querySelector('.info-message');
          if (existingMessage) {
            existingMessage.remove();
          }

          reviewsContainer.insertBefore(message, this.nextSibling);

          // إخفاء الرسالة بعد 3 ثواني
          setTimeout(() => {
            if (message.parentNode) {
              message.remove();
            }
          }, 3000);
        }
      });

      reviewClone.appendChild(removePinButton);
      reviewClone.classList.add("pinned-review");

      // إزالة أي تعليق مثبت سابق
      const existingPinnedReview = document.querySelector(".pinned-review");
      if (existingPinnedReview) {
        existingPinnedReview.remove();
      }

      // إضافة التعليق المثبت في الأعلى
      reviewsContainer.insertBefore(reviewClone, reviewsContainer.firstChild);

      // إظهار رسالة تأكيد
      const message = document.createElement("div");
      message.className = "success-message";
      message.textContent = "تم تثبيت التعليق في الأعلى بنجاح";
      message.style.textAlign = "center";
      message.style.padding = "10px";
      message.style.marginTop = "10px";
      message.style.backgroundColor = "rgba(76, 175, 80, 0.2)";
      message.style.borderRadius = "5px";
      reviewsContainer.insertBefore(message, reviewClone.nextSibling);

      // إخفاء الرسالة بعد 3 ثواني
      setTimeout(() => {
        message.remove();
      }, 3000);
    }
  }
}

// Load data when page loads
window.addEventListener("load", () => {
  loadUsersCount();
  loadReviews();

  // Show modal automatically after a delay
  setTimeout(() => {
    overlay.style.display = "flex";
    setTimeout(() => popup.classList.add("show"), 50);
  }, 1000); // Wait 1 second before showing modal
});
