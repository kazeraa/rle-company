let members = [];
let adminSession = null;
let displayedCardMember = null;
let verifiedCardMember = null;
let pendingDeleteMemberId = null;

const supabaseSettings = RLE_CONFIG.supabase || {};
const hasSupabaseConfig = Boolean(supabaseSettings.url && supabaseSettings.anonKey);
const supabaseClient = hasSupabaseConfig && window.supabase
    ? window.supabase.createClient(supabaseSettings.url, supabaseSettings.anonKey)
    : null;
const authDialog = document.getElementById("authDialog");

function isAdmin() {
    return Boolean(adminSession);
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 3500);
}

function setConnectionStatus(message, connected) {
    document.getElementById("connectionStatus").textContent = message;
    document.getElementById("connectionDot").classList.toggle("offline", !connected);
}

function formatSupabaseError(error) {
    const message = error?.message || "Kesalahan tidak diketahui";
    if (
        error?.code === "PGRST205" ||
        /could not find the table ['"]?public\.members['"]? in the schema cache/i.test(message)
    ) {
        return "Tabel public.members belum tersedia. Jalankan ulang new code/supabase.sql di Supabase SQL Editor.";
    }
    return message;
}

function applyAccess() {
    document.querySelectorAll(".admin-only").forEach(element => {
        element.hidden = !isAdmin();
    });

    const authButton = document.getElementById("authButton");
    authButton.textContent = isAdmin() ? "KELUAR" : "LOGIN ADMIN";
    authButton.className = isAdmin() ? "secondary-button" : "primary-button";
    showView(isAdmin() ? "dashboard" : "check");
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
}

function initials(name) {
    return String(name || "").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
}

function formatDate(date) {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })
        .format(new Date(`${date}T12:00:00`));
}

function nextId() {
    const numbers = members
        .map(member => Number(String(member.id).match(/\d+$/)?.[0]))
        .filter(Number.isFinite);
    return `RLE-${String(Math.max(0, ...numbers) + 1).padStart(6, "0")}`;
}

function showView(viewName) {
    document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === viewName));
    document.getElementById(`${viewName}View`).classList.add("active");
    document.getElementById("pageTitle").textContent = {
        dashboard: "Dashboard",
        members: "Data Anggota",
        check: "Cek Identitas"
    }[viewName];
}

function renderDashboard() {
    const now = new Date();
    document.getElementById("totalMembers").textContent = members.length;
    document.getElementById("activeMembers").textContent = members.filter(member => member.status === "ACTIVE").length;
    document.getElementById("newMembers").textContent = members.filter(member => {
        if (!member.joined) return false;
        const date = new Date(`${member.joined}T12:00:00`);
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;

    const recent = [...members].sort((a, b) => String(b.joined).localeCompare(String(a.joined))).slice(0, 5);
    document.getElementById("recentMembers").innerHTML = recent.map(member => `
        <div class="member-row">
            <div class="member-avatar">${escapeHtml(initials(member.name))}</div>
            <div class="member-info">
                <strong>${escapeHtml(member.name)}</strong>
                <span>${escapeHtml(member.division)}</span>
            </div>
            <span class="member-id">${escapeHtml(member.id)}</span>
        </div>
    `).join("") || '<div class="empty-result"><p>Belum ada anggota</p></div>';
}

function renderTable() {
    const search = document.getElementById("memberSearch").value.trim().toLowerCase();
    const status = document.getElementById("statusFilter").value;
    const filtered = members.filter(member =>
        (!search || `${member.name} ${member.id} ${member.division}`.toLowerCase().includes(search)) &&
        (status === "ALL" || member.status === status)
    );

    document.getElementById("memberTable").innerHTML = filtered.map(member => `
        <tr>
            <td class="table-id">${escapeHtml(member.id)}</td>
            <td><strong>${escapeHtml(member.name)}</strong></td>
            <td>${escapeHtml(member.division)}</td>
            <td>${escapeHtml(formatDate(member.joined))}</td>
            <td><span class="status-badge ${member.status === "ACTIVE" ? "" : "inactive"}">${member.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}</span></td>
            <td>
                <div class="row-actions">
                    <button class="icon-button" type="button" data-card="${escapeHtml(member.id)}" title="Lihat kartu">◫</button>
                    <button class="icon-button" type="button" data-delete="${escapeHtml(member.id)}" title="Hapus">×</button>
                </div>
            </td>
        </tr>
    `).join("") || '<tr><td colspan="6" style="text-align:center;color:#8e96a1">Tidak ada anggota ditemukan</td></tr>';
}

function renderAll() {
    renderDashboard();
    renderTable();
}

async function loadMembers() {
    if (!supabaseClient || !isAdmin()) {
        members = [];
        renderAll();
        return;
    }

    const { data, error } = await supabaseClient
        .from("members")
        .select("id, name, division, status, joined")
        .order("joined", { ascending: false });

    if (error) {
        console.error("Gagal memuat data anggota dari Supabase.", error);
        showToast(`Gagal memuat anggota: ${formatSupabaseError(error)}`);
        return;
    }

    members = data || [];
    renderAll();
}

function showCheckError(message) {
    verifiedCardMember = null;
    document.getElementById("checkResult").innerHTML = `
        <div class="empty-result">
            <div class="result-icon" style="color:#ef7a7a">!</div>
            <p><strong>${escapeHtml(message)}</strong></p>
        </div>`;
}

async function showCheckResult(rawId) {
    const id = rawId.trim().toUpperCase();
    const result = document.getElementById("checkResult");
    verifiedCardMember = null;
    if (!supabaseClient) {
        showCheckError("Supabase belum dikonfigurasi");
        return;
    }

    result.innerHTML = '<div class="empty-result"><p>Memeriksa identitas...</p></div>';
    const { data, error } = await supabaseClient.rpc("verify_rle_member", { lookup_id: id });
    if (error) {
        console.error("Gagal memeriksa identitas di Supabase.", error);
        showCheckError("Pemeriksaan gagal. Coba lagi beberapa saat.");
        return;
    }

    const member = Array.isArray(data) ? data[0] : data;
    if (!member) {
        result.innerHTML = `
            <div class="empty-result">
                <div class="result-icon" style="color:#ef7a7a">×</div>
                <p><strong>Identitas tidak ditemukan</strong></p>
                <span>ID tidak tercatat dalam sistem RLE</span>
            </div>`;
        return;
    }

    verifiedCardMember = member;
    const active = member.status === "ACTIVE";
    result.innerHTML = `
        <div style="text-align:center">
            <div class="identity-card" style="text-align:left;margin:auto">
                ${cardContent(member)}
            </div>
            <p style="color:${active ? "#62d69d" : "#ef7a7a"};font-size:12px;margin:14px 0 0">
                ${active ? "IDENTITAS TERVERIFIKASI" : "IDENTITAS TIDAK AKTIF"}
            </p>
            <button type="button" class="primary-button download-card-button" data-download-card="${escapeHtml(member.id)}">
                Unduh Kartu PNG
            </button>
        </div>`;
}

function cardContent(member) {
    const active = member.status === "ACTIVE";
    return `
        <div class="card-head">
            <img src="../assets/logo rle.jpeg" alt="Logo RLE">
            <div><strong>RLE</strong><span>RANS LOGISTIK EUROPE</span></div>
        </div>
        <div class="card-body">
            <div>
                <div class="eyebrow">ANGGOTA RESMI</div>
                <div class="card-name">${escapeHtml(member.name)}</div>
                <div class="card-info">
                    <span>ID<b>${escapeHtml(member.id)}</b></span>
                    <span>DIVISI<b>${escapeHtml(member.division)}</b></span>
                    <span>BERGABUNG<b>${escapeHtml(formatDate(member.joined))}</b></span>
                </div>
            </div>
            <div class="card-status ${active ? "" : "inactive"}">${active ? "VALID<br>AKTIF" : "STATUS<br>INACTIVE"}</div>
        </div>`;
}

function findMember(rawId) {
    const id = rawId.trim().toUpperCase();
    return members.find(member => member.id.toUpperCase() === id);
}

function openCard(memberId) {
    const member = findMember(memberId);
    if (!member) return;
    displayedCardMember = member;
    document.getElementById("identityCard").innerHTML = `<div class="identity-card">${cardContent(member)}</div>`;
    document.getElementById("identityDialog").showModal();
}

async function downloadMemberCard(member) {
    try {
        await document.fonts.ready;
        const logo = new Image();
        logo.src = "../assets/logo rle.jpeg";
        await new Promise((resolve, reject) => {
            logo.onload = resolve;
            logo.onerror = () => reject(new Error("Logo RLE gagal dimuat"));
        });

        const scale = 2;
        const width = 440;
        const height = 278;
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Browser tidak mendukung pembuatan gambar");
        context.scale(scale, scale);

        const roundedRect = (x, y, rectWidth, rectHeight, radius) => {
            context.beginPath();
            context.moveTo(x + radius, y);
            context.arcTo(x + rectWidth, y, x + rectWidth, y + rectHeight, radius);
            context.arcTo(x + rectWidth, y + rectHeight, x, y + rectHeight, radius);
            context.arcTo(x, y + rectHeight, x, y, radius);
            context.arcTo(x, y, x + rectWidth, y, radius);
            context.closePath();
        };
        const fitText = (text, maxWidth, startingSize, weight) => {
            let size = startingSize;
            context.font = `${weight} ${size}px Inter, sans-serif`;
            while (context.measureText(text).width > maxWidth && size > 12) {
                size -= 1;
                context.font = `${weight} ${size}px Inter, sans-serif`;
            }
            return size;
        };

        roundedRect(0.5, 0.5, width - 1, height - 1, 14);
        const background = context.createLinearGradient(0, 0, width, height);
        background.addColorStop(0, "#171d24");
        background.addColorStop(1, "#090b0e");
        context.fillStyle = background;
        context.fill();
        context.save();
        roundedRect(0.5, 0.5, width - 1, height - 1, 14);
        context.clip();
        context.translate(width / 2, height / 2);
        context.rotate(-Math.PI / 6);
        context.fillStyle = "rgba(212,173,97,0.2)";
        context.font = "italic 800 20px Inter, sans-serif";
        for (let x = -width; x < width; x += 105) {
            for (let y = -height; y < height; y += 58) {
                context.fillText("RLE", x, y);
            }
        }
        context.restore();
        context.save();
        roundedRect(0.5, 0.5, width - 1, height - 1, 14);
        context.clip();
        context.strokeStyle = "rgba(212,173,97,0.18)";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(width - 10, height + 30, 110, 0, Math.PI * 2);
        context.stroke();
        context.restore();
        context.strokeStyle = "rgba(212,173,97,0.5)";
        context.lineWidth = 1;
        roundedRect(0.5, 0.5, width - 1, height - 1, 14);
        context.stroke();

        context.save();
        context.beginPath();
        context.arc(58, 57, 17, 0, Math.PI * 2);
        context.clip();
        context.drawImage(logo, 41, 40, 34, 34);
        context.restore();
        context.fillStyle = "#eef1f4";
        context.font = "700 19px Inter, sans-serif";
        context.letterSpacing = "2px";
        context.fillText("RLE", 94, 51);
        context.fillStyle = "#d4ad61";
        context.font = "500 8px Inter, sans-serif";
        context.letterSpacing = "1.5px";
        context.fillText("RANS LOGISTIK EUROPE", 94, 70);
        context.strokeStyle = "rgba(255,255,255,0.08)";
        context.beginPath();
        context.moveTo(0, 95);
        context.lineTo(width, 95);
        context.stroke();

        context.fillStyle = "#f0d28c";
        context.font = "800 10px Inter, sans-serif";
        context.letterSpacing = "2px";
        context.fillText("ANGGOTA RESMI", 22, 126);
        context.fillStyle = "#eef1f4";
        const name = String(member.name || "");
        context.letterSpacing = "0";
        context.font = `400 ${fitText(name, 245, 32, "400")}px Inter, sans-serif`;
        context.fillText(name, 22, 157);

        context.font = "400 14px Inter, sans-serif";
        const details = [
            ["ID", member.id],
            ["DIVISI", member.division],
            ["BERGABUNG", formatDate(member.joined)]
        ];
        details.forEach(([label, value], index) => {
            const y = 181 + index * 21;
            context.fillStyle = "#8e96a1";
            context.fillText(label, 22, y);
            const labelWidth = context.measureText(label).width + 8;
            const valueText = String(value || "-");
            context.fillStyle = "#eef1f4";
            context.font = `700 ${fitText(valueText, 230 - labelWidth, 14, "700")}px Inter, sans-serif`;
            context.fillText(valueText, 22 + labelWidth, y);
            context.font = "400 14px Inter, sans-serif";
        });

        const active = member.status === "ACTIVE";
        context.strokeStyle = "rgba(255,255,255,0.08)";
        context.beginPath();
        context.arc(344, 162, 46, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = active ? "#62d69d" : "#ef7a7a";
        context.font = "500 12px Inter, sans-serif";
        context.textAlign = "center";
        context.fillText(active ? "VALID" : "STATUS", 344, 158);
        context.fillText(active ? "AKTIF" : "INACTIVE", 344, 174);

        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(result => result ? resolve(result) : reject(new Error("Gambar kartu gagal dibuat")), "image/png");
        });
        const link = document.createElement("a");
        link.download = `Kartu-${String(member.id).replace(/[^a-z0-9_-]/gi, "-")}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (error) {
        console.error("Gagal mengunduh kartu anggota.", error);
        showToast(`Kartu gagal diunduh: ${error.message}`);
    }
}


async function resolveAdminSession(user) {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        throw new Error("Profil pengguna tidak ditemukan.");
    }

    const role = String(data.role).toUpperCase();

    const allowedRoles = ["OWNER", "ADMIN", "MANAGEMENT"];

    if (!allowedRoles.includes(role)) {
        return null;
    }

    return {
        userId: user.id,
        email: user.email,
        role
    };
}


async function importMembers(records) {
    if (!isAdmin()) {
        showToast("Login Admin atau Manajemen diperlukan untuk impor");
        return;
    }

    const existingIds = new Set(members.map(member => member.id.toUpperCase()));
    const today = new Date().toISOString().slice(0, 10);
    const additions = records
        .filter(record => record && record.id && record.name)
        .map(record => ({
            id: String(record.id).trim().toUpperCase(),
            name: String(record.name).trim(),
            division: String(record.division || "Anggota").trim(),
            status: record.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            joined: /^\d{4}-\d{2}-\d{2}$/.test(record.joined || "") ? record.joined : today
        }))
        .filter(record => {
            if (!record.id || !record.name || existingIds.has(record.id)) return false;
            existingIds.add(record.id);
            return true;
        });

    if (additions.length === 0) {
        showToast("Tidak ada anggota baru untuk diimpor");
        return;
    }

    const { error } = await supabaseClient.from("members").insert(additions);
    if (error) {
        console.error("Gagal mengimpor anggota ke Supabase.", error);
        showToast(`Impor gagal: ${formatSupabaseError(error)}`);
        return;
    }

    await loadMembers();
    showToast(`${additions.length} anggota berhasil diimpor`);
}

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        if (!isAdmin() && button.classList.contains("admin-only")) {
            showToast("Fitur ini khusus Admin atau Manajemen");
            return;
        }
        showView(button.dataset.view);
    });
});
document.querySelectorAll("[data-view-target]").forEach(button => {
    button.addEventListener("click", () => showView(button.dataset.viewTarget));
});

document.getElementById("authButton").addEventListener("click", async event => {
    if (isAdmin()) {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            showToast(`Gagal keluar: ${error.message}`);
            return;
        }
        adminSession = null;
        members = [];
        applyAccess();
        renderAll();
        showToast("Anda telah keluar");
        return;
    }
    if (!supabaseClient) {
        showToast("Konfigurasi Supabase belum diisi");
        return;
    }
    authDialog.showModal();
});

document.getElementById("closeAuth").addEventListener("click", () => authDialog.close());
document.getElementById("cancelAuth").addEventListener("click", () => authDialog.close());
document.getElementById("authForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!supabaseClient) {
        showToast("Konfigurasi Supabase belum diisi");
        return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    const { data: login, error: loginError } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (loginError) {
        showToast(`Login gagal: ${loginError.message}`);
        return;
    }

    try {
        adminSession = await resolveAdminSession(login.user);
    } catch (error) {
        await supabaseClient.auth.signOut();
        console.error("Gagal memeriksa hak akses admin.", error);
        showToast("Hak akses tidak dapat diverifikasi. Periksa konfigurasi Supabase.");
        return;
    }

    if (!adminSession) {
        await supabaseClient.auth.signOut();
        showToast("Akun ini belum diberi akses Admin atau Manajemen");
        return;
    }

    authDialog.close();
    form.reset();
    applyAccess();
    setConnectionStatus("Supabase terhubung", true);
    await loadMembers();
    showToast(`Login ${adminSession.role === "ADMIN" ? "Admin" : "Manajemen"} berhasil`);
});

document.getElementById("openMemberForm").addEventListener("click", () => {
    if (!isAdmin()) return;
    const form = document.getElementById("memberForm");
    form.reset();
    form.elements.id.value = nextId();
    document.getElementById("memberDialog").showModal();
});
document.getElementById("migrateLocalData").addEventListener("click", async () => {
    if (!isAdmin()) return;

    const saved = localStorage.getItem("rle_identity_members");
    if (!saved) {
        showToast("Tidak ditemukan data anggota lama di browser ini");
        return;
    }

    let legacyMembers;
    try {
        legacyMembers = JSON.parse(saved);
    } catch (error) {
        console.error("Data anggota lama tidak dapat dibaca.", error);
        showToast("Data lokal lama tidak dapat dibaca");
        return;
    }

    if (!Array.isArray(legacyMembers)) {
        showToast("Format data lokal lama tidak valid");
        return;
    }

    await importMembers(legacyMembers);
});
document.getElementById("closeMemberForm").addEventListener("click", () => document.getElementById("memberDialog").close());
document.getElementById("cancelMemberForm").addEventListener("click", () => document.getElementById("memberDialog").close());

document.getElementById("memberForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!isAdmin()) {
        showToast("Akses hanya untuk Admin atau Manajemen");
        return;
    }

    const data = new FormData(event.currentTarget);
    const id = String(data.get("id") || "").trim().toUpperCase() || nextId();
    const newMember = {
        id,
        name: String(data.get("name")).trim(),
        division: String(data.get("division")).trim(),
        status: String(data.get("status")),
        joined: new Date().toISOString().slice(0, 10)
    };
    const { data: savedMember, error } = await supabaseClient
        .from("members")
        .insert(newMember)
        .select("id, name, division, status, joined")
        .single();

    if (error) {
        console.error("Gagal menyimpan anggota ke Supabase.", error);
        showToast(`Gagal menyimpan: ${formatSupabaseError(error)}`);
        return;
    }

    members.unshift(savedMember);
    renderAll();
    document.getElementById("memberDialog").close();
    event.currentTarget.reset();
    showToast("Anggota berhasil disimpan ke Supabase");
});

document.getElementById("memberSearch").addEventListener("input", renderTable);
document.getElementById("statusFilter").addEventListener("change", renderTable);

document.getElementById("memberTable").addEventListener("click", async event => {
    const cardButton = event.target.closest("[data-card]");
    const deleteButton = event.target.closest("[data-delete]");
    if (cardButton) openCard(cardButton.dataset.card);
    if (deleteButton && isAdmin()) {
        pendingDeleteMemberId = deleteButton.dataset.delete;
        const member = findMember(pendingDeleteMemberId);
        document.querySelector(".delete-member-message").textContent =
            member
                ? `Anggota ${member.name} (${member.id}) akan dihapus dari sistem kartu identitas.`
                : "Anggota ini akan dihapus dari sistem kartu identitas.";
        document.getElementById("deleteMemberDialog").showModal();
    }
});

function closeDeleteMemberDialog() {
    pendingDeleteMemberId = null;
    document.getElementById("deleteMemberDialog").close();
}

document.getElementById("closeDeleteMember").addEventListener("click", closeDeleteMemberDialog);
document.getElementById("cancelDeleteMember").addEventListener("click", closeDeleteMemberDialog);
document.getElementById("confirmDeleteMember").addEventListener("click", async () => {
    if (!pendingDeleteMemberId || !isAdmin()) return;

    const memberId = pendingDeleteMemberId;
    const { error } = await supabaseClient.from("members").delete().eq("id", memberId);
    if (error) {
        console.error("Gagal menghapus anggota dari Supabase.", error);
        closeDeleteMemberDialog();
        showToast(`Gagal menghapus: ${formatSupabaseError(error)}`);
        return;
    }

    members = members.filter(member => member.id !== memberId);
    closeDeleteMemberDialog();
    renderAll();
    showToast("Anggota berhasil dihapus");
});

document.getElementById("quickCheckForm").addEventListener("submit", async event => {
    event.preventDefault();
    showView("check");
    document.getElementById("publicId").value = document.getElementById("quickId").value;
    await showCheckResult(document.getElementById("quickId").value);
});

document.getElementById("publicCheckForm").addEventListener("submit", async event => {
    event.preventDefault();
    await showCheckResult(document.getElementById("publicId").value);
});

document.getElementById("closeIdentity").addEventListener("click", () => document.getElementById("identityDialog").close());
document.getElementById("downloadIdentity").addEventListener("click", () => {
    if (displayedCardMember) void downloadMemberCard(displayedCardMember);
});
document.getElementById("printIdentity").addEventListener("click", () => window.print());
document.getElementById("checkResult").addEventListener("click", event => {
    const downloadButton = event.target.closest("[data-download-card]");
    if (!downloadButton) return;
    if (verifiedCardMember?.id === downloadButton.dataset.downloadCard) {
        void downloadMemberCard(verifiedCardMember);
    }
});

window.addEventListener("message", event => {
    const allowedOrigins = RLE_CONFIG.identityImportOrigins || [];
    if (event.origin !== location.origin && !allowedOrigins.includes(event.origin)) return;
    if (!Array.isArray(event.data?.members)) return;
    void importMembers(event.data.members);
});

async function importMembersFromUrl(url) {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const incoming = Array.isArray(data) ? data : data.members;
    if (!Array.isArray(incoming)) throw new Error("Format JSON tidak berisi array members");
    await importMembers(incoming);
}

async function initialize() {
    renderAll();
    applyAccess();

    if (!hasSupabaseConfig) {
        setConnectionStatus("Supabase belum dikonfigurasi", false);
        return;
    }
    if (!supabaseClient) {
        setConnectionStatus("Supabase SDK gagal dimuat", false);
        showToast("Supabase SDK gagal dimuat. Periksa koneksi internet.");
        return;
    }

    setConnectionStatus("Menghubungkan Supabase...", false);
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        if (data.session) {
            adminSession = await resolveAdminSession(data.session.user);
            if (!adminSession) await supabaseClient.auth.signOut();
        }

        applyAccess();
        setConnectionStatus("Supabase terhubung", true);
        await loadMembers();

        const importUrl = new URLSearchParams(location.search).get("import");
        if (importUrl && isAdmin()) {
            await importMembersFromUrl(importUrl);
        }
    } catch (error) {
        console.error("Gagal menginisialisasi Supabase.", error);
        setConnectionStatus("Koneksi Supabase gagal", false);
        showToast("Tidak dapat terhubung ke Supabase. Periksa URL, key, dan SQL setup.");
    }
}

void initialize();
