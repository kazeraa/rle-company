// CONFIG
document.getElementById("companyName").textContent =
  CONFIG.companyName;

document.getElementById("slogan").textContent =
  CONFIG.slogan;

document.getElementById("established").textContent =
  CONFIG.established;

document.getElementById("motto").textContent =
  CONFIG.motto;

// LOGO
document.getElementById("logo").src =
  CONFIG.logoUrl;

document.getElementById("loaderLogo").src =
  CONFIG.logoUrl;

// BACKGROUND
document.body.style.backgroundImage = `
linear-gradient(
rgba(5,10,20,.78),
rgba(5,10,20,.92)
),
url("${CONFIG.backgroundUrl}")
`;

// JOIN BUTTON
document.getElementById("joinBtn").href =
  CONFIG.joinLink;

document.getElementById("heroJoin").href =
  CONFIG.joinLink;

document.getElementById("communityJoin").href =
  CONFIG.joinLink;

// STATS
document.getElementById("members").textContent =
  CONFIG.stats.members;

document.getElementById("convoys").textContent =
  CONFIG.stats.convoys;

document.getElementById("partners").textContent =
  CONFIG.stats.partners;

document.getElementById("eventsStat").textContent =
  CONFIG.stats.events;

// CONTACT
document.getElementById("wa").href =
  CONFIG.contact.whatsapp;

document.getElementById("ig").href =
  CONFIG.contact.instagram;

document.getElementById("tt").href =
  CONFIG.contact.tiktok;

document.getElementById("dc").href =
  CONFIG.contact.discord;

// LOADING
window.addEventListener("load", () => {
  setTimeout(() => {
    document
      .getElementById("loader")
      .classList.add("hide");
  }, 1800);
});

// SCROLL REVEAL
const observer =
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

document
  .querySelectorAll(
    ".section, .card, .stat-card, .fleet-card, .event-card, .news-card, .manager, .gallery-item"
  )
  .forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });

// PARALLAX
document.addEventListener(
  "mousemove",
  (e) => {
    const x =
      e.clientX /
      window.innerWidth;

    const y =
      e.clientY /
      window.innerHeight;

    document.querySelector(
      ".blob-1"
    ).style.transform =
      `translate(${x*25}px,${
        y*25
      }px)`;

    document.querySelector(
      ".blob-2"
    ).style.transform =
      `translate(${
        -x*30
      }px,${
        -y*30
      }px)`;

    document.querySelector(
      ".blob-3"
    ).style.transform =
      `translate(${x*18}px,${
        -y*18
      }px)`;
  }
);

// NAVBAR SCROLL
window.addEventListener(
  "scroll",
  () => {
    const navbar =
      document.querySelector(
        ".navbar"
      );

    if (
      window.scrollY > 50
    ) {
      navbar.style.background =
        "rgba(10,15,28,.82)";
    } else {
      navbar.style.background =
        "rgba(255,255,255,.08)";
    }
  }
);

// COUNTER ANIMATION
function animateCounter(
  element,
  value
) {
  const target =
    parseInt(value);

  if (
    isNaN(target)
  )
    return;

  let current = 0;

  const step =
    Math.ceil(
      target / 50
    );

  const interval =
    setInterval(() => {
      current += step;

      if (
        current >=
        target
      ) {
        current =
          target;
        clearInterval(
          interval
        );
      }

      element.textContent =
        current + "+";
    }, 30);
}

setTimeout(() => {
  animateCounter(
    document.getElementById(
      "members"
    ),
    CONFIG.stats.members
  );

  animateCounter(
    document.getElementById(
      "convoys"
    ),
    CONFIG.stats.convoys
  );

  animateCounter(
    document.getElementById(
      "partners"
    ),
    CONFIG.stats.partners
  );

  animateCounter(
    document.getElementById(
      "eventsStat"
    ),
    CONFIG.stats.events
  );
}, 2000);

// GALLERY
const gallery =
  document.getElementById(
    "galleryGrid"
  );

CONFIG.gallery.forEach(
  (img) => {

    gallery.innerHTML += `
      <div
        class="glass gallery-item">

        <img
          src="${img}"
          onclick="openImageModal('${img}')">

      </div>
    `;

  }
);

const imageModal =
  document.getElementById(
    "imageModal"
  );

const modalImage =
  document.getElementById(
    "modalImage"
  );

function openImageModal(
  img
) {

  modalImage.src =
    img;

  imageModal.classList.remove(
    "hidden"
  );

  document.body.style.overflow =
    "hidden";
}

function closeImageModal() {

  imageModal.classList.add(
    "hidden"
  );

  document.body.style.overflow =
    "";
}

// ESC
document.addEventListener(
  "keydown",
  (e) => {

    if (
      e.key === "Escape"
    ) {

      closeImageModal();

    }

  }
);

// CLICK BACKGROUND
imageModal.addEventListener(
  "click",
  (e) => {

    if (
      e.target === imageModal
    ) {

      closeImageModal();

    }

  }
);

// NEWS
const news =
  document.getElementById(
    "newsGrid"
  );

CONFIG.news.forEach(
  (item) => {
    news.innerHTML += `
      <div class="glass news-card">

        <small>
          ${item.date}
        </small>

        <h3>
          ${item.title}
        </h3>

        <p>
          ${item.desc}
        </p>

      </div>
    `;
  }
);

// MANAGEMENT
const management =
  document.getElementById(
    "managementGrid"
  );

CONFIG.management.forEach(
  (item) => {
    management.innerHTML += `
      <div class="glass manager">

        <img src="${item.img}">

        <h3>
          ${item.name}
        </h3>

        <p>
          ${item.role}
        </p>

      </div>
    `;
  }
);