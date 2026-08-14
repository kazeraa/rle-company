// ==================================================
// RLE — RANS LOGISTIK EUROPE
// MAIN JAVASCRIPT
// ==================================================

document.addEventListener("DOMContentLoaded", () => {

    /* ==================================================
       ELEMENTS
    ================================================== */

    const loader = document.getElementById("loader");
    const menuButton = document.getElementById("menuButton");
    const navLinks = document.querySelector(".nav-links");
    const navbar = document.querySelector(".navbar");


    /* ==================================================
       LOADER
    ================================================== */

    window.addEventListener("load", () => {

        setTimeout(() => {

            if (loader) {
                loader.classList.add("hide");
            }

        }, 1000);

    });


    /* ==================================================
       CONFIG
    ================================================== */

    if (typeof RLE_CONFIG !== "undefined") {

        /*
         * PAGE TITLE
         */

        document.title =
            `${RLE_CONFIG.company.shortName} — ${RLE_CONFIG.company.name}`;


        /*
         * STATISTICS
         */

        document
            .querySelectorAll("[data-stat]")
            .forEach(element => {

                const statType =
                    element.dataset.stat;

                if (
                    RLE_CONFIG.stats &&
                    RLE_CONFIG.stats[statType]
                ) {

                    element.textContent =
                        RLE_CONFIG.stats[statType];

                }

            });


        /*
         * DISCORD LINKS
         */

        document
            .querySelectorAll(
                'a[href*="discord.gg"]'
            )
            .forEach(link => {

                link.href =
                    RLE_CONFIG.links.discord;

            });


        /*
         * WHATSAPP LINKS
         */

        document
            .querySelectorAll(
                'a[href*="wa.me"]'
            )
            .forEach(link => {

                link.href =
                    RLE_CONFIG.links.whatsapp;

            });


        /*
         * INSTAGRAM
         */

        document
            .querySelectorAll(
                'a[href*="instagram.com"]'
            )
            .forEach(link => {

                link.href =
                    RLE_CONFIG.links.instagram;

            });


        /*
         * TIKTOK
         */

        document
            .querySelectorAll(
                'a[href*="tiktok.com"]'
            )
            .forEach(link => {

                link.href =
                    RLE_CONFIG.links.tiktok;

            });


        /*
         * RECRUITMENT STATUS
         */

        const recruitmentStatus =
            document.querySelector(
                ".recruit-status"
            );

        if (
            recruitmentStatus &&
            RLE_CONFIG.recruitment
        ) {

            const statusText =
                recruitmentStatus.childNodes[
                    recruitmentStatus.childNodes.length - 1
                ];

            if (statusText) {

                statusText.textContent =
                    ` ${RLE_CONFIG.recruitment.text}`;

            }

        }


        /*
         * JOIN BUTTONS
         */

        document
            .querySelectorAll(
                ".join-button, .nav-button"
            )
            .forEach(button => {

                if (
                    button.classList.contains(
                        "join-button"
                    ) ||
                    button.classList.contains(
                        "nav-button"
                    )
                ) {

                    button.textContent =
                        RLE_CONFIG.recruitment.button;

                }

            });

    }


    /* ==================================================
       MOBILE MENU
    ================================================== */

    if (menuButton && navLinks) {

        menuButton.addEventListener(
            "click",
            () => {

                navLinks.classList.toggle(
                    "active"
                );

                const isOpen =
                    navLinks.classList.contains(
                        "active"
                    );

                menuButton.textContent =
                    isOpen ? "✕" : "☰";

            }
        );


        /*
         * CLOSE MENU AFTER CLICK
         */

        navLinks
            .querySelectorAll("a")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        navLinks.classList.remove(
                            "active"
                        );

                        menuButton.textContent =
                            "☰";

                    }
                );

            });

    }


    /* ==================================================
       NAVBAR SCROLL EFFECT
    ================================================== */

    function updateNavbar() {

        if (!navbar) return;

        if (window.scrollY > 50) {

            navbar.classList.add(
                "scrolled"
            );

        } else {

            navbar.classList.remove(
                "scrolled"
            );

        }

    }


    window.addEventListener(
        "scroll",
        updateNavbar
    );

    updateNavbar();


    /* ==================================================
       SCROLL REVEAL
    ================================================== */

    const revealElements =
        document.querySelectorAll(
            ".section, " +
            ".company-profile, " +
            ".fleet-card, " +
            ".gallery-item, " +
            ".convoy-item, " +
            ".stat"
        );


    revealElements.forEach(
        element => {

            element.classList.add(
                "reveal"
            );

        }
    );


    const revealObserver =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "show"
                            );

                            revealObserver.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.12
            }
        );


    revealElements.forEach(
        element => {

            revealObserver.observe(
                element
            );

        }
    );


    /* ==================================================
       ACTIVE NAVIGATION
    ================================================== */

    const sections =
        document.querySelectorAll(
            "section[id]"
        );

    const navigationLinks =
        document.querySelectorAll(
            ".nav-links a"
        );


    const activeObserver =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            const currentId =
                                entry.target.id;


                            navigationLinks
                                .forEach(link => {

                                    link.classList.remove(
                                        "active"
                                    );

                                    const target =
                                        link.getAttribute(
                                            "href"
                                        );


                                    if (
                                        target ===
                                        `#${currentId}`
                                    ) {

                                        link.classList.add(
                                            "active"
                                        );

                                    }

                                });

                        }

                    }
                );

            },
            {
                threshold: 0.45
            }
        );


    sections.forEach(
        section => {

            activeObserver.observe(
                section
            );

        }
    );


    /* ==================================================
       HERO PARALLAX
    ================================================== */

    const hero =
        document.querySelector(".hero");


    if (hero) {

        window.addEventListener(
            "scroll",
            () => {

                const scroll =
                    window.scrollY;


                if (
                    scroll <
                    window.innerHeight
                ) {

                    hero.style.backgroundPosition =
                        `center ${scroll * 0.25}px`;

                }

            }
        );

    }


    /* ==================================================
       FLEET CARD TILT
    ================================================== */

    const fleetCards =
        document.querySelectorAll(
            ".fleet-card"
        );


    fleetCards.forEach(card => {

        card.addEventListener(
            "mousemove",
            event => {

                if (
                    window.innerWidth < 900
                ) return;


                const rect =
                    card.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                const centerX =
                    rect.width / 2;


                const centerY =
                    rect.height / 2;


                const rotateX =
                    ((y - centerY) /
                        centerY) *
                    -2;


                const rotateY =
                    ((x - centerX) /
                        centerX) *
                    2;


                card.style.transform =
                    `perspective(900px)
                     rotateX(${rotateX}deg)
                     rotateY(${rotateY}deg)
                     translateY(-3px)`;

            }
        );


        card.addEventListener(
            "mouseleave",
            () => {

                card.style.transform =
                    "";

            }
        );

    });


    /* ==================================================
       SMOOTH ANCHOR OFFSET
    ================================================== */

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    const targetId =
                        link.getAttribute(
                            "href"
                        );


                    if (
                        targetId === "#" ||
                        !targetId
                    ) {

                        return;

                    }


                    const target =
                        document.querySelector(
                            targetId
                        );


                    if (!target) return;


                    event.preventDefault();


                    const navbarHeight =
                        navbar
                            ? navbar.offsetHeight
                            : 0;


                    const targetPosition =
                        target.getBoundingClientRect()
                            .top +
                        window.scrollY -
                        navbarHeight;


                    window.scrollTo({
                        top:
                            targetPosition,
                        behavior:
                            "smooth"
                    });

                }
            );

        });


    /* ==================================================
       IMAGE FALLBACK
    ================================================== */

    document
        .querySelectorAll("img")
        .forEach(img => {

            img.addEventListener(
                "error",
                () => {

                    img.style.opacity = "0";

                    img.parentElement.classList.add(
                        "image-error"
                    );

                }
            );

        });


    /* ==================================================
       CONSOLE BRANDING
    ================================================== */

    console.log(
        "%c RLE — RANS LOGISTIK EUROPE ",
        `
        background:#d6ad63;
        color:#08090b;
        font-size:16px;
        font-weight:900;
        padding:8px 14px;
        `
    );

    console.log(
        "%c Driven By The Road. ",
        `
        color:#d6ad63;
        font-size:12px;
        font-weight:700;
        `
    );

        /* ==================================================
       FLEET DETAIL MODAL
    ================================================== */

    const fleetModal =
        document.getElementById("fleetModal");

    const fleetModalClose =
        document.getElementById(
            "fleetModalClose"
        );

    const fleetModalImage =
        document.getElementById(
            "fleetModalImage"
        );

    const fleetModalNumber =
        document.getElementById(
            "fleetModalNumber"
        );

    const fleetModalTitle =
        document.getElementById(
            "fleetModalTitle"
        );

    const fleetModalDescription =
        document.getElementById(
            "fleetModalDescription"
        );

    const fleetType =
        document.getElementById(
            "fleetType"
        );

    const fleetRole =
        document.getElementById(
            "fleetRole"
        );


    const fleetData = {

        scania: {
            number: "01 — RLE FLEET",
            title: "SCANIA",
            image: "assets/fleet/scania.jpg",
            description:
                "Scania menjadi salah satu pilihan utama armada RLE untuk perjalanan jarak jauh dengan karakter European trucking yang kuat.",
            type: "HEAVY TRUCK",
            role: "LONG HAUL"
        },

        volvo: {
            number: "02 — RLE FLEET",
            title: "VOLVO",
            image: "assets/fleet/volvo.jpg",
            description:
                "Volvo menghadirkan kombinasi kenyamanan, teknologi dan performa untuk perjalanan bersama RLE.",
            type: "HEAVY TRUCK",
            role: "LONG HAUL"
        },

        mercedes: {
            number: "03 — RLE FLEET",
            title: "MERCEDES",
            image: "assets/fleet/mercedes.jpg",
            description:
                "Mercedes menjadi representasi gaya modern dan kenyamanan dalam perjalanan virtual RLE.",
            type: "HEAVY TRUCK",
            role: "LOGISTICS"
        }

    };


    document
        .querySelectorAll(".fleet-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const fleetName =
                        card.dataset.fleet;

                    const data =
                        fleetData[fleetName];

                    if (!data) return;


                    fleetModalImage.style.backgroundImage =
                        `url("${data.image}")`;

                    fleetModalNumber.textContent =
                        data.number;

                    fleetModalTitle.textContent =
                        data.title;

                    fleetModalDescription.textContent =
                        data.description;

                    fleetType.textContent =
                        data.type;

                    fleetRole.textContent =
                        data.role;


                    fleetModal.classList.add(
                        "active"
                    );

                    document.body.style.overflow =
                        "hidden";

                }
            );

        });


    function closeFleetModal() {

        fleetModal.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";

    }


    fleetModalClose?.addEventListener(
        "click",
        closeFleetModal
    );


    fleetModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                fleetModal
            ) {

                closeFleetModal();

            }

        }
    );


    /* ==================================================
       GALLERY LIGHTBOX
    ================================================== */

    const galleryModal =
        document.getElementById(
            "galleryModal"
        );

    const galleryModalImage =
        document.getElementById(
            "galleryModalImage"
        );

    const galleryCaption =
        document.getElementById(
            "galleryCaption"
        );

    const galleryClose =
        document.getElementById(
            "galleryClose"
        );

    const galleryPrev =
        document.getElementById(
            "galleryPrev"
        );

    const galleryNext =
        document.getElementById(
            "galleryNext"
        );


    const galleryItems =
        [
            ...document.querySelectorAll(
                ".gallery-item img"
            )
        ];


    let currentGalleryIndex = 0;


    function openGallery(index) {

        if (
            !galleryItems[index]
        ) return;


        currentGalleryIndex =
            index;


        const image =
            galleryItems[index];


        galleryModalImage.src =
            image.src;


        galleryModalImage.alt =
            image.alt;


        galleryCaption.textContent =
            image.alt ||
            `RLE GALLERY ${index + 1}`;


        galleryModal.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }


    function closeGallery() {

        galleryModal.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";

    }


    function nextGallery() {

        currentGalleryIndex =
            (
                currentGalleryIndex + 1
            ) %
            galleryItems.length;


        openGallery(
            currentGalleryIndex
        );

    }


    function previousGallery() {

        currentGalleryIndex =
            (
                currentGalleryIndex -
                1 +
                galleryItems.length
            ) %
            galleryItems.length;


        openGallery(
            currentGalleryIndex
        );

    }


    galleryItems.forEach(
        (image, index) => {

            image.parentElement.addEventListener(
                "click",
                () => {

                    openGallery(index);

                }
            );

        }
    );


    galleryClose?.addEventListener(
        "click",
        closeGallery
    );


    galleryNext?.addEventListener(
        "click",
        nextGallery
    );


    galleryPrev?.addEventListener(
        "click",
        previousGallery
    );


    galleryModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                galleryModal
            ) {

                closeGallery();

            }

        }
    );


    /* ==================================================
       MANAGEMENT MODAL
    ================================================== */

    const managementModal =
        document.getElementById(
            "managementModal"
        );

    const managementModalClose =
        document.getElementById(
            "managementModalClose"
        );

    const managementModalImage =
        document.getElementById(
            "managementModalImage"
        );

    const managementModalName =
        document.getElementById(
            "managementModalName"
        );

    const managementModalRole =
        document.getElementById(
            "managementModalRole"
        );


    document
        .querySelectorAll(
            ".management-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    managementModalImage.src =
                        card.dataset.image;

                    managementModalName.textContent =
                        card.dataset.name;

                    managementModalRole.textContent =
                        card.dataset.role;


                    managementModal.classList.add(
                        "active"
                    );

                    document.body.style.overflow =
                        "hidden";

                }
            );

        });


    function closeManagementModal() {

        managementModal.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";

    }


    managementModalClose?.addEventListener(
        "click",
        closeManagementModal
    );


    managementModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                managementModal
            ) {

                closeManagementModal();

            }

        }
    );


    /* ==================================================
       KEYBOARD CONTROLS
    ================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeFleetModal();

                closeGallery();

                closeManagementModal();

            }


            if (
                galleryModal?.classList.contains(
                    "active"
                )
            ) {

                if (
                    event.key === "ArrowRight"
                ) {

                    nextGallery();

                }

                if (
                    event.key === "ArrowLeft"
                ) {

                    previousGallery();

                }

            }

        }
    );

});