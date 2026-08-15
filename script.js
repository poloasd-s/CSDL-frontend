
// BIẾN TOÀN CỤC
var BASE_URL = 'https://csdl-backend.onrender.com';
var allDocuments = [];
var currentUserRole = 'user';
var baseCategoryList = [];
var currentCategoryList = [];
var currentPage = 1;
var itemsPerPage = 15;

// BIẾN QUẢN LÝ SẮP XẾP (SORTING)
var currentSortColumn = '';
var currentSortAsc = true;

// BẢN ĐỒ PHÂN CẤP DANH MỤC
var CATEGORY_HIERARCHY = {
  "TL QĐ 272/QĐ-CHK": [
    "Văn bản, TL Việt Nam", "BQP-CTC", "QĐ, HD về ATS", "Luật", "Nghị định", "Thông tư", "Cục HK", "VBHĐ", "Danh mục TLHDKT",
    "ICAO", "ANNEX", "DOC"
  ],
  "Văn bản, TL Việt Nam": [
    "BQP-CTC", "QĐ, HD về ATS", "Luật", "Nghị định", "Thông tư", "Cục HK", "VBHĐ", "Danh mục TLHDKT"
  ],
  "ICAO": [
    "ANNEX", "DOC"
  ],
  "TL ISO 9001:2015": [
    "Chính sách chất lượng", "MTCL", "GCN ISO", "QT-TL ISO", "Lĩnh vực Không lưu", "Khác"
  ],
  "Tổ Không lưu": [
    "Hệ thống VBĐHB TCT", "Hệ thống VBĐHB ĐKSKL", "Triển khai thông tin Tổ KL", "Họp Tổ KL"
  ]
};

// QUẢN LÝ TAGS DANH MỤC
var uploadTags = [];
var editTags = [];

function addUploadTag() {
  var input = document.getElementById('upload-tag-input');
  if (!input) return;
  var val = input.value.trim();
  if (val) {
    var parts = val.split(/[,;]/).map(function (p) { return p.trim(); }).filter(function (p) { return p.length > 0; });
    parts.forEach(function (part) {
      if (!uploadTags.some(function (t) { return t.toLowerCase() === part.toLowerCase(); })) {
        uploadTags.push(part);
      }
    });
    input.value = '';
    renderUploadTags();
  }
}

function removeUploadTag(index) {
  uploadTags.splice(index, 1);
  renderUploadTags();
}

function renderUploadTags() {
  var container = document.getElementById('upload-category-tags');
  if (!container) return;
  if (uploadTags.length === 0) {
    container.innerHTML = '<span class="text-xs text-amber-700/60 italic px-1">Chưa chọn tag nào...</span>';
    return;
  }
  container.innerHTML = uploadTags.map(function (tag, i) {
    return '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FEF9E7] text-amber-900 border border-amber-300/80 shadow-xs transition hover:bg-amber-100/80">' +
      '<i class="fas fa-tag text-[11px] text-amber-600"></i> ' + tag +
      '<button type="button" onclick="removeUploadTag(' + i + ')" class="text-amber-400 hover:text-amber-800 font-bold focus:outline-none ml-1 text-sm leading-none transition">&times;</button>' +
      '</span>';
  }).join('');
}

function addEditTag() {
  var input = document.getElementById('edit-tag-input');
  if (!input) return;
  var val = input.value.trim();
  if (val) {
    var parts = val.split(/[,;]/).map(function (p) { return p.trim(); }).filter(function (p) { return p.length > 0; });
    parts.forEach(function (part) {
      if (!editTags.some(function (t) { return t.toLowerCase() === part.toLowerCase(); })) {
        editTags.push(part);
      }
    });
    input.value = '';
    renderEditTags();
  }
}

function removeEditTag(index) {
  editTags.splice(index, 1);
  renderEditTags();
}

function renderEditTags() {
  var container = document.getElementById('edit-category-tags');
  if (!container) return;
  if (editTags.length === 0) {
    container.innerHTML = '<span class="text-xs text-amber-700/60 italic px-1">Chưa chọn tag nào...</span>';
    return;
  }
  container.innerHTML = editTags.map(function (tag, i) {
    return '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FEF9E7] text-amber-900 border border-amber-300/80 shadow-xs transition hover:bg-amber-100/80">' +
      '<i class="fas fa-tag text-[11px] text-amber-600"></i> ' + tag +
      '<button type="button" onclick="removeEditTag(' + i + ')" class="text-amber-400 hover:text-amber-800 font-bold focus:outline-none ml-1 text-sm leading-none transition">&times;</button>' +
      '</span>';
  }).join('');
}




document.addEventListener("DOMContentLoaded", function () {
  getUserInfo();
  loadDashboardData();
  setupSearch();
});




// --- HÀM LẤY VÀ ÁP DỤNG QUYỀN NGƯỜI DÙNG ---
function getUserInfo() {
  // Mock user cho local environment
  const userInfo = { role: 'admin', email: 'admin@localhost' };
  applyRoles(userInfo);
}




function applyRoles(userInfo) {
  currentUserRole = userInfo.role || 'user';
  var emailEl = document.getElementById('user-email-display');
  var roleEl = document.getElementById('user-role-display');
  var avatarEl = document.querySelector('.avatar');




  if (emailEl) emailEl.textContent = userInfo.email || 'Khách';
  if (avatarEl && userInfo.email) avatarEl.textContent = userInfo.email.charAt(0).toUpperCase();




  if (currentUserRole === 'admin') {
    if (roleEl) {
      roleEl.textContent = "Quản trị viên";
      roleEl.className = "text-xs text-blue-600 font-bold uppercase";
    }
    document.querySelectorAll('.admin-only').forEach(function (el) {
      el.classList.remove('hidden');
    });
  } else {
    if (roleEl) roleEl.textContent = "Người dùng";
  }
}




function loadDashboardData() {
  fetch(BASE_URL + '/api/data')
    .then(response => response.json())
    .then(result => {
      if (!result.success) throw new Error(result.message || 'Lỗi lấy dữ liệu');
      const data = result.data || [];

      // MAPPING: Đổi key từ Tiếng Việt (từ Sheets/MongoDB) sang Tiếng Anh (cho frontend)
      const mappedData = data.map(item => {
        let mainCat = item["Danh mục"] || item.danhMuc || item.category || "Khác";
        
        // Tạm thời chỉ hiển thị Main tag (Danh mục)
        let rawCatList = [mainCat];

        // 1. Tự động nhận diện tài liệu Annex để phân vào danh mục ICAO -> ANNEX
        let contextStr = (
          (item["Tên tài liệu"] || item.tenTaiLieu || item.fileName || "") + " " +
          (item["Số/Ký hiệu VB"] || item.soKyHieuVB || item.docNumber || "") + " " +
          (item["Nội dung trích yếu"] || item.noiDungTrichYeu || item.abstract || "") + " " +
          mainCat
        ).toLowerCase();

        let isAnnex = contextStr.includes("annex");

        if (isAnnex) {
          if (mainCat === 'Khác' || mainCat.toUpperCase() === 'ICAO' || mainCat.toLowerCase().includes('annex')) {
            mainCat = 'ANNEX';
            if (rawCatList.length === 1) {
              rawCatList = ['ANNEX'];
            }
          }
        }

        if (rawCatList.length === 0) {
          rawCatList = [mainCat];
        }

        let docNumber = item["Số/Ký hiệu VB"] || item.soKyHieuVB || item.docNumber || "";
        let fileName = item["Tên tài liệu"] || item.tenTaiLieu || item.fileName || "";
        let abstract = item["Nội dung trích yếu"] || item.noiDungTrichYeu || item.abstract || "";
        if (!fileName && abstract) fileName = abstract;
        if (!abstract && fileName) abstract = fileName;

        return {
          ...item,
          docNumber: docNumber,
          fileName: fileName,
          abstract: abstract,
          category: mainCat,
          categories: rawCatList,
          effectiveDate: item["Ngày hiệu lực"] || item.ngayHieuLuc || item.effectiveDate || "",
          expiryDate: item["Ngày hết hiệu lực"] || item.ngayHetHieuLuc || item.expiryDate || "",
          lastUpdated: item["Cập nhật lần cuối"] || item.capNhatLanCuoi || item["Thời gian cập nhật"] || item.updatedAt || item.lastUpdated || "",
          status: item["Trạng thái"] || item.trangThai || item.status || "Không xác định",
          driveLink: item["Link Drive"] || item.linkDrive || item.driveLink || "",
          fileId: item["File ID"] || item.fileID || item.fileId || "",
          note: item["Ghi chú"] || item.ghiChu || item.note || "",
          updatedBy: item["Người cập nhật"] || item.nguoiCapNhat || item.updatedBy || ""
        };
      });

      try {
        allDocuments = mappedData;
        renderStats(allDocuments);
        renderRecentTable(allDocuments, false);
        renderWarningTables(allDocuments);
        renderNotifications(allDocuments);
        renderCharts(allDocuments);
      } catch (err) {
        console.error("Lỗi giao diện:", err);
      }
    })
    .catch(error => {
      console.error("Lỗi máy chủ:", error);
    });
}




/**
 * THUẬT TOÁN TÍNH TOÁN & PHÂN CẤP CẢNH BÁO HIỆU LỰC THỜI GIAN THỰC
 * @param {string|Date} expiryDateStr - Chuỗi ngày hết hạn (YYYY-MM-DD, DD/MM/YYYY,...)
 * @param {string} rawStatus - Trạng thái chuỗi ban đầu từ DB/Sheets
 * @returns {Object} { statusKey, statusText, countdownText, daysDiff, badgeClass, dotColor, colorTheme }
 */
function evaluateDocumentExpiry(expiryDateStr, rawStatus) {
  var rawStatusClean = rawStatus ? String(rawStatus).trim().toLowerCase() : "";
  var isExplicitlyExpired = rawStatusClean.indexOf("hết hiệu lực") !== -1 && rawStatusClean !== "sắp hết hiệu lực";

  // 1. Nếu không có ngày hết hạn
  if (!expiryDateStr || String(expiryDateStr).trim() === "" || expiryDateStr === "N/A" || expiryDateStr === "-") {
    if (isExplicitlyExpired) {
      return {
        statusKey: 'expired',
        statusText: 'Đã hết hiệu lực',
        countdownText: 'Hết hiệu lực',
        daysDiff: -1,
        badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold',
        dotColor: 'bg-rose-500',
        colorTheme: 'rose'
      };
    }
    return {
      statusKey: 'active',
      statusText: 'Còn hiệu lực',
      countdownText: 'Vô thời hạn',
      daysDiff: 9999,
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium',
      dotColor: 'bg-emerald-500',
      colorTheme: 'emerald'
    };
  }

  // 2. Chuẩn hóa chuỗi ngày: hỗ trợ DD/MM/YYYY, YYYY-MM-DD, ISO...
  var cleanStr = String(expiryDateStr).trim();
  var expDate = null;

  if (cleanStr.includes('/')) {
    var parts = cleanStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        expDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
  } else if (cleanStr.includes('-')) {
    var parts = cleanStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        expDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
  } else {
    expDate = new Date(cleanStr);
  }

  if (!expDate || isNaN(expDate.getTime())) {
    if (isExplicitlyExpired) {
      return {
        statusKey: 'expired',
        statusText: 'Đã hết hiệu lực',
        countdownText: 'Hết hiệu lực',
        daysDiff: -1,
        badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold',
        dotColor: 'bg-rose-500',
        colorTheme: 'rose'
      };
    }
    return {
      statusKey: 'active',
      statusText: rawStatus || 'Còn hiệu lực',
      countdownText: 'Không xác định ngày',
      daysDiff: 9999,
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium',
      dotColor: 'bg-emerald-500',
      colorTheme: 'emerald'
    };
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);

  var diffMs = expDate.getTime() - today.getTime();
  var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // 3. Phân chia 3 mức cảnh báo màu
  if (diffDays < 0) {
    // 🔴 MÀU ĐỎ: ĐÃ HẾT HẠN HOẶC CẦN THANH TRA GẤP
    var overdueDays = Math.abs(diffDays);
    var isCritical = overdueDays > 30;
    return {
      statusKey: 'expired',
      statusText: 'Đã hết hiệu lực',
      countdownText: isCritical ? ('Quá hạn ' + overdueDays + ' ngày (Cần thanh tra)') : ('Quá hạn ' + overdueDays + ' ngày'),
      daysDiff: diffDays,
      badgeClass: isCritical
        ? 'bg-rose-100 text-rose-800 border border-rose-400 font-bold shadow-xs'
        : 'bg-rose-100 text-rose-700 border border-rose-300 font-medium',
      dotColor: 'bg-rose-600',
      colorTheme: 'rose'
    };
  } else if (diffDays <= 60) {
    // 🟠 MÀU VÀNG / CAM: SẮP HẾT HẠN (ĐẾM NGƯỢC)
    var countdownLabel = diffDays === 0 ? 'Hết hạn hôm nay' : ('Còn ' + diffDays + ' ngày');
    return {
      statusKey: 'expiring',
      statusText: 'Sắp hết hiệu lực',
      countdownText: countdownLabel,
      daysDiff: diffDays,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-xs',
      dotColor: 'bg-amber-500',
      colorTheme: 'amber'
    };
  } else {
    // 🟢 MÀU XANH: CÒN HẠN LÂU DÀI
    return {
      statusKey: 'active',
      statusText: 'Còn hiệu lực',
      countdownText: 'Còn ' + diffDays + ' ngày',
      daysDiff: diffDays,
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium',
      dotColor: 'bg-emerald-500',
      colorTheme: 'emerald'
    };
  }
}

// --- HÀM TÍNH TOÁN VÀ ĐỔ DỮ LIỆU LÊN 4 THẺ KPI ---
function renderStats(docs) {
  var countTotal = docs.length, countActive = 0, countExpiring = 0, countExpired = 0;
  docs.forEach(function (doc) {
    var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
    if (evalInfo.statusKey === 'active') countActive++;
    else if (evalInfo.statusKey === 'expiring') countExpiring++;
    else if (evalInfo.statusKey === 'expired') countExpired++;
  });

  var statTotal = document.getElementById('stat-total'); if (statTotal) statTotal.innerText = countTotal;
  var statActive = document.getElementById('stat-active'); if (statActive) statActive.innerText = countActive;
  var statExpiring = document.getElementById('stat-expiring'); if (statExpiring) statExpiring.innerText = countExpiring;
  var statExpired = document.getElementById('stat-expired'); if (statExpired) statExpired.innerText = countExpired;
}

function parseDateToTime(dateVal) {
  if (!dateVal) return 0;
  if (dateVal instanceof Date) return dateVal.getTime();
  if (typeof dateVal === 'number') return dateVal;
  var str = String(dateVal).trim();
  if (!str || str === 'N/A' || str === '-') return 0;
  
  var d = new Date(str);
  if (!isNaN(d.getTime())) return d.getTime();
  
  if (str.includes('/')) {
    var parts = str.split(' ');
    var dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
      var day = parseInt(dateParts[0], 10);
      var month = parseInt(dateParts[1], 10) - 1;
      var year = parseInt(dateParts[2], 10);
      var hours = 0, minutes = 0, seconds = 0;
      if (parts[1]) {
        var timeParts = parts[1].split(':');
        hours = parseInt(timeParts[0] || 0, 10);
        minutes = parseInt(timeParts[1] || 0, 10);
        seconds = parseInt(timeParts[2] || 0, 10);
      }
      var customDate = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(customDate.getTime())) return customDate.getTime();
    }
  }
  return 0;
}

// --- HÀM RENDER BẢNG TÀI LIỆU MỚI CẬP NHẬT (30 NGÀY GẦN NHẤT) ---
function renderRecentTable(docs, isSearch) {
  var tbody = document.getElementById('table-recent-docs');
  if (!tbody) return;
  tbody.innerHTML = '';

  var now = Date.now();
  var thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  var recentDocs = docs;
  if (!isSearch) {
    recentDocs = docs.filter(function (doc) {
      if (!doc.effectiveDate) return false;
      var effTime = parseDateToTime(doc.effectiveDate);
      return effTime >= thirtyDaysAgo;
    });

    recentDocs.sort(function (a, b) {
      return parseDateToTime(b.effectiveDate) - parseDateToTime(a.effectiveDate);
    });
  }

  if (recentDocs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="p-6 text-center text-gray-500 italic">Không có tài liệu nào có ngày hiệu lực trong 30 ngày gần nhất.</td></tr>';
    return;
  }

  var limit = isSearch ? 20 : 5;
  var adminClass = (currentUserRole === 'admin') ? '' : 'hidden';

  recentDocs.slice(0, limit).forEach(function (doc, index) {
    var dateDisplay = "N/A";
    if (doc.effectiveDate) {
      var dObj = new Date(doc.effectiveDate);
      if (!isNaN(dObj.getTime())) {
        dateDisplay = dObj.toLocaleDateString('vi-VN');
      } else {
        dateDisplay = String(doc.effectiveDate).split('T')[0] || String(doc.effectiveDate);
      }
    }

    var tenTL = doc.fileName ? doc.fileName : '<span class="text-gray-400 italic">Chưa có tên</span>';
    var trichYeu = doc.abstract ? doc.abstract : '<span class="text-gray-400 italic">Chưa có trích yếu</span>';
    var docId = doc.fileId || doc.id || doc.driveLink || doc.docNumber || doc.abstract || '';

    var catList = (Array.isArray(doc.categories) && doc.categories.length > 0) ? doc.categories : (doc.category ? [doc.category] : ['Khác']);
    var categoryBadgesHtml = catList.map(function (c) {
      return '<span class="inline-block bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors mr-1 mb-1">' +
        '<i class="fas fa-tag text-[9px] mr-1 text-blue-500"></i>' + c +
        '</span>';
    }).join('');

    var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
    var statusBadgeHtml = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ' + evalInfo.badgeClass + '">' +
      '<span class="w-1.5 h-1.5 rounded-full ' + evalInfo.dotColor + '"></span>' +
      evalInfo.statusText +
      '</span>';

    var downloadLink = doc.fileId ? 'https://drive.google.com/uc?export=download&id=' + doc.fileId : '#';

    var tr = document.createElement('tr');
    tr.className = "hover:bg-blue-50/50 transition-colors cursor-pointer group";
    tr.innerHTML =
      '<td class="p-3.5 text-gray-500 font-medium text-center" data-label="STT">' + (index + 1) + '</td>' +
      '<td class="p-3.5 font-semibold text-blue-700 whitespace-nowrap" data-label="Số ký hiệu">' + (doc.docNumber || '-') + '</td>' +
      '<td class="p-3.5" data-label="Tên tài liệu"><div class="line-clamp-2 font-medium text-gray-900" title="' + (doc.fileName || '') + '">' + tenTL + '</div></td>' +
      '<td class="p-3.5" data-label="Nội dung trích yếu"><div class="line-clamp-2 text-gray-700" title="' + (doc.abstract || '') + '">' + trichYeu + '</div></td>' +
      '<td class="p-3.5" data-label="Danh mục">' + categoryBadgesHtml + '</td>' +
      '<td class="p-3.5 text-gray-500 whitespace-nowrap" data-label="Ngày ban hành">' + dateDisplay + '</td>' +
      '<td class="p-3.5 whitespace-nowrap" data-label="Trạng thái">' + statusBadgeHtml + '</td>' +
      '<td class="p-3.5 text-center whitespace-nowrap" data-label="Thao tác">' +
      '<div class="flex items-center justify-center gap-3 action-btns">' +
      '<a href="' + (doc.driveLink || '#') + '" target="_blank" class="text-gray-400 hover:text-blue-600 p-1 touch-target" title="Xem"><i class="fas fa-eye"></i></a>' +
      '<a href="' + downloadLink + '" class="text-gray-400 hover:text-green-600 p-1 touch-target" title="Tải"><i class="fas fa-download"></i></a>' +
      '<button onclick="editDoc(\'' + docId + '\')" class="admin-only ' + adminClass + ' text-gray-400 hover:text-yellow-600 p-1 touch-target" title="Sửa"><i class="fas fa-edit"></i></button>' +
      '</div>' +
      '</td>';
    tbody.appendChild(tr);
  });

  // Render mobile cards for recent docs
  renderMobileCards('cards-recent-docs', recentDocs.slice(0, limit));
}

// --- HÀM RENDER MOBILE CARD LIST ---
function renderMobileCards(containerId, docs) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (docs.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-500 py-6 text-sm italic">Không có tài liệu nào.</div>';
    return;
  }

  docs.forEach(function(doc) {
    var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
    var dateDisplay = 'N/A';
    if (doc.effectiveDate) {
      var dObj = new Date(doc.effectiveDate);
      if (!isNaN(dObj.getTime())) dateDisplay = dObj.toLocaleDateString('vi-VN');
    }

    var fileExt = 'TL';
    if (doc.fileName) {
      var ext = doc.fileName.split('.').pop().toUpperCase();
      if (['PDF','DOC','DOCX','XLS','XLSX','PPT','PPTX'].indexOf(ext) !== -1) fileExt = ext;
    }

    var statusClass = evalInfo.statusKey === 'active' ? 'active' : (evalInfo.statusKey === 'expiring' ? 'expiring' : 'expired');
    var catList = (Array.isArray(doc.categories) && doc.categories.length > 0) ? doc.categories : (doc.category ? [doc.category] : []);
    var catText = catList.length > 0 ? catList[0] : '';
    var docId = doc.fileId || doc.id || doc.driveLink || doc.docNumber || '';

    var card = document.createElement('article');
    card.className = 'mobile-record-card';
    card.innerHTML =
      '<div class="file-icon">' + fileExt + '</div>' +
      '<div class="record-content">' +
        '<h3>' + (doc.fileName || doc.abstract || 'Chưa có tên') + '</h3>' +
        '<p class="record-meta">' + (doc.docNumber || '') + (doc.docNumber && dateDisplay !== 'N/A' ? ' · ' : '') + (dateDisplay !== 'N/A' ? dateDisplay : '') + (catText ? ' · ' + catText : '') + '</p>' +
        '<span class="status-badge ' + statusClass + '">' +
          '<span style="width:6px;height:6px;border-radius:50%;display:inline-block;" class="' + evalInfo.dotColor + '"></span>' +
          evalInfo.statusText +
        '</span>' +
      '</div>' +
      '<a href="' + (doc.driveLink || '#') + '" target="_blank" class="record-more" aria-label="Xem tài liệu">' +
        '<i class="fas fa-eye"></i>' +
      '</a>';
    container.appendChild(card);
  });
}

// --- HÀM RENDER 2 BẢNG CẢNH BÁO HIỆU LỰC ---
function renderWarningTables(docs) {
  var tbodyExpiring = document.getElementById('table-expiring-docs');
  var tbodyExpired = document.getElementById('table-expired-docs');
  if (!tbodyExpiring || !tbodyExpired) return;

  var expiringDocs = [];
  var expiredDocs = [];

  docs.forEach(function (doc) {
    var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
    if (evalInfo.statusKey === 'expiring') expiringDocs.push({ doc: doc, eval: evalInfo });
    else if (evalInfo.statusKey === 'expired') expiredDocs.push({ doc: doc, eval: evalInfo });
  });

  // Sắp xếp ưu tiên: Sắp hết hạn thì đưa ngày gần nhất lên trước; Đã hết hạn thì đưa quá hạn lâu nhất lên trước
  expiringDocs.sort(function (a, b) { return (a.eval.daysDiff - b.eval.daysDiff); });
  expiredDocs.sort(function (a, b) { return (a.eval.daysDiff - b.eval.daysDiff); });

  var badgeExpiring = document.getElementById('badge-expiring'); if (badgeExpiring) badgeExpiring.innerText = expiringDocs.length;
  var badgeExpired = document.getElementById('badge-expired'); if (badgeExpired) badgeExpired.innerText = expiredDocs.length;

  function buildTableHTML(tbody, dataList, themeClass) {
    tbody.innerHTML = '';
    if (dataList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-500 italic">Tuyệt vời! Hiện không có tài liệu nào thuộc nhóm này.</td></tr>';
      return;
    }

    dataList.slice(0, 5).forEach(function (item) {
      var doc = item.doc;
      var evalInfo = item.eval;
      var dateDisplay = "N/A";
      if (doc.expiryDate) {
        var dateObj = new Date(doc.expiryDate);
        if (!isNaN(dateObj)) dateDisplay = dateObj.toLocaleDateString('vi-VN');
        else dateDisplay = String(doc.expiryDate);
      }

      var tenTL = doc.fileName ? doc.fileName : '<span class="text-gray-400 italic">Chưa có tên</span>';
      var downloadLink = doc.fileId ? 'https://drive.google.com/uc?export=download&id=' + doc.fileId : '#';
      var trichYeu = doc.abstract ? doc.abstract : '<span class="text-gray-400 italic">Chưa có trích yếu</span>';
      var tr = document.createElement('tr');
      tr.className = "hover:bg-" + themeClass + "-50/50 transition-colors";
      tr.innerHTML =
        '<td class="p-3 font-semibold text-blue-900 whitespace-nowrap" data-label="Số ký hiệu">' + (doc.docNumber || '-') + '</td>' +
        '<td class="p-3" data-label="Tên tài liệu"><div class="line-clamp-1 font-medium text-gray-900" title="' + (doc.fileName || '') + '">' + tenTL + '</div></td>' +
        '<td class="p-3" data-label="Nội dung trích yếu"><div class="line-clamp-1 text-gray-700 font-normal" title="' + (doc.abstract || '') + '">' + trichYeu + '</div></td>' +
        '<td class="p-3 font-medium text-gray-600 whitespace-nowrap" data-label="Ngày hết hạn">' + dateDisplay + '</td>' +
        '<td class="p-3 whitespace-nowrap" data-label="Cảnh báo hạn">' +
        '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ' + evalInfo.badgeClass + '">' +
        '<span class="w-1.5 h-1.5 rounded-full ' + evalInfo.dotColor + '"></span>' +
        evalInfo.countdownText +
        '</span>' +
        '</td>' +
        '<td class="p-3 text-center whitespace-nowrap" data-label="Thao tác">' +
        '<a href="' + (doc.driveLink || '#') + '" target="_blank" class="text-gray-400 hover:text-blue-600 mr-2 p-1" title="Xem văn bản"><i class="fas fa-eye"></i></a>' +
        '<a href="' + downloadLink + '" class="text-gray-400 hover:text-green-600 p-1" title="Tải về"><i class="fas fa-download"></i></a>' +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  buildTableHTML(tbodyExpiring, expiringDocs, 'amber');
  buildTableHTML(tbodyExpired, expiredDocs, 'rose');

  // Render mobile cards for warning tables
  renderMobileCards('cards-expiring-docs', expiringDocs.slice(0, 5).map(function(i) { return i.doc; }));
  renderMobileCards('cards-expired-docs', expiredDocs.slice(0, 5).map(function(i) { return i.doc; }));
}




// --- HÀM CÀI ĐẶT TÌM KIẾM ---
function setupSearch() {
  var searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  // Hỗ trợ nhấn phím Enter để tìm kiếm cho tiện
  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      executeSearch();
    }
  });
}




// --- HÀM THỰC THI KHI BẤM NÚT TÌM KIẾM ---
function executeSearch() {
  var searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  var keyword = searchInput.value.toLowerCase().trim();

  if (keyword === "") {
    navigateTo('dashboard', null, 'menu-dashboard');
    return;
  }

  baseCategoryList = allDocuments.filter(function (doc) {
    var soKyHieu = doc.docNumber ? String(doc.docNumber).toLowerCase() : "";
    var trichYeu = doc.abstract ? String(doc.abstract).toLowerCase() : "";
    var tenTaiLieu = doc.fileName ? String(doc.fileName).toLowerCase() : "";
    return soKyHieu.indexOf(keyword) !== -1 || trichYeu.indexOf(keyword) !== -1 || tenTaiLieu.indexOf(keyword) !== -1;
  });

  var viewDash = document.getElementById('view-dashboard');
  var viewList = document.getElementById('view-danh-sach');
  if (viewDash) viewDash.classList.add('hidden');
  if (viewList) viewList.classList.remove('hidden');

  document.querySelectorAll('.menu-link, .menu-sub-link').forEach(function (link) {
    if (link.classList.contains('menu-link')) {
      link.className = "menu-link flex items-center gap-3 px-4 py-2 hover:bg-blue-800 text-gray-300 border-l-4 border-transparent cursor-pointer transition-colors text-sm";
    } else {
      link.className = "menu-sub-link block pl-14 pr-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800 cursor-pointer border-l-4 border-transparent";
    }
  });

  var titleEl = document.getElementById('title-danh-sach');
  if (titleEl) titleEl.innerText = "Kết quả tìm kiếm: " + keyword;

  clearFilters(); // Tự động hiển thị và phân trang kết quả
}

// --- HÀM LỌC NHANH KHI CLICK VÀO CÁC THẺ KPI TRÊN DASHBOARD ---
function filterByExpiryCard(statusKey) {
  var title = "Tất cả tài liệu";
  if (statusKey === 'active') title = "Tài liệu còn hiệu lực";
  else if (statusKey === 'expiring') title = "Tài liệu sắp hết hiệu lực";
  else if (statusKey === 'expired') title = "Tài liệu đã hết hiệu lực";

  navigateTo('danh-sach', title, 'menu-all-docs');

  var statusSelect = document.getElementById('filter-status');

  if (statusKey === 'all') {
    baseCategoryList = allDocuments;
    if (statusSelect) statusSelect.value = 'all';
  } else if (statusKey === 'active') {
    baseCategoryList = allDocuments.filter(function (doc) {
      var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
      return evalInfo.statusKey === 'active';
    });
    if (statusSelect) statusSelect.value = 'còn hiệu lực';
  } else if (statusKey === 'expiring') {
    baseCategoryList = allDocuments.filter(function (doc) {
      var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
      return evalInfo.statusKey === 'expiring';
    });
    if (statusSelect) statusSelect.value = 'sắp hết hiệu lực';
  } else if (statusKey === 'expired') {
    baseCategoryList = allDocuments.filter(function (doc) {
      var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
      return evalInfo.statusKey === 'expired';
    });
    if (statusSelect) statusSelect.value = 'hết hiệu lực';
  }

  clearFilters(true);
}

// --- HÀM XEM TẤT CẢ TÀI LIỆU SẮP HẾT / ĐÃ HẾT HIỆU LỰC ---
function viewAllStatus(statusType) {
  if (statusType === 'sắp hết hiệu lực') {
    filterByExpiryCard('expiring');
  } else {
    filterByExpiryCard('expired');
  }
}

// --- QUẢN LÝ TÍCH HỢP LOOKER STUDIO ---
function setLookerUrl() {
  var input = document.getElementById('looker-url-input');
  var iframe = document.getElementById('looker-iframe');
  var placeholder = document.getElementById('looker-placeholder');
  var openBtn = document.getElementById('looker-open-external');
  if (!input || !iframe) return;

  var url = input.value.trim();
  if (url) {
    // Đảm bảo URL hợp lệ
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    iframe.src = url;
    iframe.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
    if (openBtn) openBtn.href = url;
    localStorage.setItem('looker_studio_embed_url', url);
  }
}

function refreshLookerFrame() {
  var iframe = document.getElementById('looker-iframe');
  if (iframe && iframe.src) {
    iframe.src = iframe.src;
  }
}

function initLookerStudio() {
  var savedUrl = localStorage.getItem('looker_studio_embed_url');
  if (savedUrl) {
    var input = document.getElementById('looker-url-input');
    var iframe = document.getElementById('looker-iframe');
    var placeholder = document.getElementById('looker-placeholder');
    var openBtn = document.getElementById('looker-open-external');
    if (input) input.value = savedUrl;
    if (iframe) {
      iframe.src = savedUrl;
      iframe.classList.remove('hidden');
    }
    if (placeholder) placeholder.classList.add('hidden');
    if (openBtn) openBtn.href = savedUrl;
  }
}

function toggleSubMenu(menuId, iconId) {
  var el = document.getElementById(menuId);
  var icon = document.getElementById(iconId);
  if (!el || !icon) return;
  if (el.classList.contains('hidden')) {
    el.classList.remove('hidden');
    el.classList.add('flex');
    icon.classList.add('rotate-180');
  } else {
    el.classList.add('hidden');
    el.classList.remove('flex');
    icon.classList.remove('rotate-180');
  }
}

function updateBottomNavActive(viewId) {
  var btns = document.querySelectorAll('.mobile-bottom-nav button');
  btns.forEach(function(b) { b.classList.remove('active'); });
  if (viewId === 'dashboard') {
    var homeBtn = document.getElementById('bottom-nav-home');
    if (homeBtn) homeBtn.classList.add('active');
  } else if (viewId === 'danh-sach') {
    var docsBtn = document.getElementById('bottom-nav-docs');
    if (docsBtn) docsBtn.classList.add('active');
  }
}

function navigateTo(viewId, categoryName, activeMenuId, isFromPopstate) {
  // Push state to browser history if not coming from popstate (back/forward)
  if (!isFromPopstate) {
    var state = { viewId: viewId, categoryName: categoryName, activeMenuId: activeMenuId };
    var hash = '#' + viewId + (categoryName ? '-' + encodeURIComponent(categoryName) : '');
    try {
      if (history.state && history.state.viewId === viewId && history.state.categoryName === categoryName) {
        // Tránh trùng lặp
      } else {
        history.pushState(state, '', hash);
      }
    } catch (e) {
      console.warn('History pushState:', e);
    }
  }

  var viewDash = document.getElementById('view-dashboard');
  var viewList = document.getElementById('view-danh-sach');
  var viewLooker = document.getElementById('view-looker-studio');
  if (viewDash) viewDash.classList.add('hidden');
  if (viewList) viewList.classList.add('hidden');
  if (viewLooker) viewLooker.classList.add('hidden');

  var mainLinks = document.querySelectorAll('.menu-link');
  mainLinks.forEach(function (link) {
    link.className = "menu-link flex items-center gap-3 px-4 py-2 hover:bg-blue-800 text-gray-300 border-l-4 border-transparent cursor-pointer transition-colors text-sm";
  });

  var subLinks = document.querySelectorAll('.menu-sub-link');
  subLinks.forEach(function (link) {
    link.className = "menu-sub-link block pl-14 pr-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800 cursor-pointer border-l-4 border-transparent";
  });

  var activeEl = document.getElementById(activeMenuId);
  if (activeEl) {
    if (activeEl.classList.contains('menu-link')) {
      activeEl.className = "menu-link flex items-center gap-3 px-4 py-2 bg-blue-800 border-l-4 border-blue-400 text-white cursor-pointer transition-colors text-sm";
    } else if (activeEl.classList.contains('menu-sub-link')) {
      activeEl.className = "menu-sub-link block pl-14 pr-4 py-2 text-sm font-bold text-white bg-blue-800 cursor-pointer border-l-4 border-blue-400";
    }
  }

  // Đồng bộ trạng thái active trên Bottom Navigation Mobile
  updateBottomNavActive(viewId);

  if (viewId === 'dashboard' && viewDash) {
    viewDash.classList.remove('hidden');
    var searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    var searchInputMobile = document.getElementById('search-input-mobile');
    if (searchInputMobile) searchInputMobile.value = '';
  } else if (viewId === 'danh-sach' && viewList) {
    viewList.classList.remove('hidden');
    var titleEl = document.getElementById('title-danh-sach');
    if (titleEl) titleEl.innerText = categoryName;
    renderCategoryTable(categoryName);
  } else if (viewId === 'looker-studio' && viewLooker) {
    viewLooker.classList.remove('hidden');
    initLookerStudio();
  }

  // Tự động đóng menu trên Mobile
  if (window.innerWidth < 1024) {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
      sidebar.classList.add('-translate-x-full');
    }
    if (overlay) overlay.classList.remove('active');
  }

  // Cuộn mượt lên đầu trang khi đổi màn hình
  window.scrollTo({ top: 0, behavior: 'instant' });
}




// --- MODULE SẮP XẾP DỮ LIỆU (SORTING) ---
function sortTable(column) {
  if (currentSortColumn === column) {
    currentSortAsc = !currentSortAsc;
  } else {
    currentSortColumn = column;
    currentSortAsc = true;
  }

  function compareElements(a, b) {
    var valA = a[column] ? a[column] : "";
    var valB = b[column] ? b[column] : "";

    if (column === 'effectiveDate') {
      var dateA = new Date(valA).getTime() || 0;
      var dateB = new Date(valB).getTime() || 0;
      return currentSortAsc ? (dateA - dateB) : (dateB - dateA);
    }

    if (column === 'category') {
      valA = Array.isArray(a.categories) && a.categories.length > 0 ? a.categories.join(', ') : (a.category || '');
      valB = Array.isArray(b.categories) && b.categories.length > 0 ? b.categories.join(', ') : (b.category || '');
    }

    var strA = String(valA).toLowerCase();
    var strB = String(valB).toLowerCase();

    if (strA < strB) return currentSortAsc ? -1 : 1;
    if (strA > strB) return currentSortAsc ? 1 : -1;
    return 0;
  }

  if (currentCategoryList && currentCategoryList.length > 0) {
    currentCategoryList.sort(compareElements);
  }
  if (baseCategoryList && baseCategoryList.length > 0) {
    baseCategoryList.sort(compareElements);
  }

  currentPage = 1;
  displayCurrentPage();
}




function renderCategoryTable(categoryName) {
  if (categoryName === 'Tất cả tài liệu') {
    baseCategoryList = allDocuments;
  }
  else if (categoryName === 'Tài liệu bên ngoài') {
    baseCategoryList = allDocuments.filter(function (doc) {
      var cat = doc.category ? String(doc.category).toLowerCase().trim() : "";
      var note = doc.note ? String(doc.note).toLowerCase().trim() : "";
      var inCats = Array.isArray(doc.categories) && doc.categories.some(function (c) {
        return c.toLowerCase().indexOf("ngoài") !== -1;
      });
      return inCats || cat.indexOf("ngoài") !== -1 || note.indexOf("ngoài") !== -1 || cat.indexOf("bên ngoài") !== -1;
    });
  }
  else if (categoryName === 'Tài liệu nội bộ') {
    baseCategoryList = allDocuments.filter(function (doc) {
      var cat = doc.category ? String(doc.category).toLowerCase().trim() : "";
      var note = doc.note ? String(doc.note).toLowerCase().trim() : "";
      var inCats = Array.isArray(doc.categories) && doc.categories.some(function (c) {
        return c.toLowerCase().indexOf("nội bộ") !== -1;
      });
      return inCats || cat.indexOf("nội bộ") !== -1 || note.indexOf("nội bộ") !== -1 || cat.indexOf("trong bộ") !== -1;
    });
  }
  else if (categoryName === '30 ngày gần nhất') {
    var now = Date.now();
    var thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    baseCategoryList = allDocuments.filter(function (doc) {
      if (!doc.effectiveDate) return false;
      var effTime = parseDateToTime(doc.effectiveDate);
      return effTime >= thirtyDaysAgo;
    });

    baseCategoryList.sort(function (a, b) {
      return parseDateToTime(b.effectiveDate) - parseDateToTime(a.effectiveDate);
    });
  }
  else {
    var keyword = String(categoryName).toLowerCase().trim();
    var validCatSet = new Set([keyword]);

    // Tự động bổ sung các danh mục con nếu click vào danh mục cha
    for (var parent in CATEGORY_HIERARCHY) {
      if (parent.toLowerCase() === keyword) {
        CATEGORY_HIERARCHY[parent].forEach(function (child) {
          validCatSet.add(child.toLowerCase());
        });
      }
    }

    baseCategoryList = allDocuments.filter(function (doc) {
      var match = false;
      if (Array.isArray(doc.categories) && doc.categories.length > 0) {
        match = doc.categories.some(function (c) {
          return validCatSet.has(c.toLowerCase());
        });
      }
      if (!match && doc.category) {
        match = validCatSet.has(String(doc.category).toLowerCase().trim());
      }
      return match;
    });
  }
  clearFilters();
}




function applyFilters() {
  var statusFilter = document.getElementById('filter-status').value.toLowerCase();
  var fromDate = document.getElementById('filter-from-date').value;
  var toDate = document.getElementById('filter-to-date').value;

  var fromTime = fromDate ? new Date(fromDate).getTime() : 0;
  var toTime = toDate ? new Date(toDate).getTime() : Infinity;
  if (toTime !== Infinity) toTime += 86399999;

  currentCategoryList = baseCategoryList.filter(function (doc) {
    var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
    var passStatus = (statusFilter === "all") ||
      (statusFilter === "còn hiệu lực" && evalInfo.statusKey === "active") ||
      (statusFilter === "sắp hết hiệu lực" && evalInfo.statusKey === "expiring") ||
      (statusFilter === "hết hiệu lực" && evalInfo.statusKey === "expired") ||
      (evalInfo.statusText.toLowerCase().indexOf(statusFilter) !== -1);

    var passDate = true;
    if (fromTime > 0 || toTime !== Infinity) {
      var docTime = doc.effectiveDate ? new Date(doc.effectiveDate).getTime() : 0;
      if (docTime === 0) {
        passDate = false;
      } else {
        passDate = (docTime >= fromTime && docTime <= toTime);
      }
    }
    return passStatus && passDate;
  });

  currentPage = 1;
  displayCurrentPage();
}

function clearFilters(preserveStatus) {
  var statusEl = document.getElementById('filter-status');
  var fromEl = document.getElementById('filter-from-date');
  var toEl = document.getElementById('filter-to-date');

  if (statusEl && !preserveStatus) statusEl.value = 'all';
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';

  applyFilters();
}

function displayCurrentPage() {
  var tbody = document.getElementById('table-danh-sach-docs');
  if (!tbody) return;
  tbody.innerHTML = '';

  var totalItems = currentCategoryList.length;
  var totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  var startItem = (currentPage - 1) * itemsPerPage;
  var endItem = Math.min(startItem + itemsPerPage, totalItems);

  var pageStartEl = document.getElementById('page-start');
  if (pageStartEl) pageStartEl.innerText = totalItems === 0 ? 0 : startItem + 1;

  var pageEndEl = document.getElementById('page-end');
  if (pageEndEl) pageEndEl.innerText = endItem;

  var pageTotalEl = document.getElementById('page-total');
  if (pageTotalEl) pageTotalEl.innerText = totalItems;

  var pageNumberEl = document.getElementById('page-number');
  if (pageNumberEl) pageNumberEl.innerText = currentPage + '/' + totalPages;

  var btnPrev = document.getElementById('btn-prev-page');
  var btnNext = document.getElementById('btn-next-page');
  if (btnPrev) btnPrev.style.opacity = (currentPage === 1) ? '0.5' : '1';
  if (btnNext) btnNext.style.opacity = (currentPage >= totalPages || endItem >= totalItems) ? '0.5' : '1';

  if (totalItems === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-gray-500 italic">Chưa có dữ liệu phù hợp với bộ lọc hiện tại.</td></tr>';
    return;
  }

  var adminClass = (currentUserRole === 'admin') ? '' : 'hidden';
  var pageData = currentCategoryList.slice(startItem, endItem);

  pageData.forEach(function (doc, index) {
    var dateDisplay = "N/A";
    if (doc.effectiveDate) {
      var dateObj = new Date(doc.effectiveDate);
      if (!isNaN(dateObj)) dateDisplay = dateObj.toLocaleDateString('vi-VN');
    }

    var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
    var statusBadgeHtml = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ' + evalInfo.badgeClass + '">' +
      '<span class="w-1.5 h-1.5 rounded-full ' + evalInfo.dotColor + '"></span>' +
      evalInfo.statusText + (evalInfo.daysDiff < 9000 ? ' (' + evalInfo.countdownText + ')' : '') +
      '</span>';

    var catList = (Array.isArray(doc.categories) && doc.categories.length > 0) ? doc.categories : (doc.category ? [doc.category] : []);
    var categoryBadgesHtml = catList.map(function (c) {
      return '<span class="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors mr-1 mb-1 shadow-2xs">' +
        '<i class="fas fa-tag text-[9px] text-blue-500"></i>' + c +
        '</span>';
    }).join('');
    if (!categoryBadgesHtml) {
      categoryBadgesHtml = '<span class="text-xs text-gray-400 italic">Chưa gắn tag</span>';
    }

    var tenTL = doc.fileName ? doc.fileName : '<span class="text-gray-400 italic">Chưa có tên</span>';
    var downloadLink = doc.fileId ? 'https://drive.google.com/uc?export=download&id=' + doc.fileId : '#';
    var trichYeu = doc.abstract ? doc.abstract : '<span class="text-gray-400 italic">Chưa có trích yếu</span>';
    var docId = doc.fileId || doc.id || doc.driveLink || doc.docNumber || doc.abstract || '';

    var tr = document.createElement('tr');
    tr.className = "hover:bg-blue-50/50 transition-colors";

    var htmlString =
      '<td class="p-4 text-gray-500 font-medium text-center" data-label="STT">' + (startItem + index + 1) + '</td>' +
      '<td class="p-4 font-semibold text-blue-700 whitespace-nowrap" data-label="Số ký hiệu">' + (doc.docNumber || '-') + '</td>' +
      '<td class="p-4" data-label="Tên tài liệu"><div class="line-clamp-2 font-medium text-gray-900" title="' + (doc.fileName || '') + '">' + tenTL + '</div></td>' +
      '<td class="p-4" data-label="Nội dung trích yếu"><div class="line-clamp-2 text-gray-700" title="' + (doc.abstract || '') + '">' + trichYeu + '</div></td>' +
      '<td class="p-4 text-gray-500 whitespace-nowrap" data-label="Ngày ban hành">' + dateDisplay + '</td>' +
      '<td class="p-4 whitespace-nowrap" data-label="Trạng thái">' + statusBadgeHtml + '</td>' +
      '<td class="p-4" data-label="Danh mục / Tags">' + categoryBadgesHtml + '</td>' +
      '<td class="p-4 text-center whitespace-nowrap" data-label="Thao tác">' +
      '<div class="flex items-center justify-center gap-3 action-btns">' +
      '<a href="' + (doc.driveLink || '#') + '" target="_blank" class="text-gray-400 hover:text-blue-600 p-1 touch-target" title="Xem"><i class="fas fa-eye"></i></a>' +
      '<a href="' + downloadLink + '" class="text-gray-400 hover:text-green-600 p-1 touch-target" title="Tải"><i class="fas fa-download"></i></a>' +
      '<button onclick="editDoc(\'' + docId + '\')" class="admin-only ' + adminClass + ' text-gray-400 hover:text-yellow-600 p-1 touch-target" title="Sửa"><i class="fas fa-edit"></i></button>' +
      '</div>' +
      '</td>';

    tr.innerHTML = htmlString;
    tbody.appendChild(tr);
  });

  // Render mobile cards
  renderMobileCards('cards-danh-sach-docs', pageData);

  // Update mobile page number
  var mobilePageNum = document.getElementById('page-number-mobile');
  if (mobilePageNum) mobilePageNum.innerText = currentPage + '/' + totalPages;
}




function changePage(direction) {
  var totalPages = Math.ceil(currentCategoryList.length / itemsPerPage);
  var newPage = currentPage + direction;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    displayCurrentPage();
  }
}




// --- MODULE UPLOAD ---
function openModal() {
  var modal = document.getElementById('upload-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  uploadTags = [];
  var titleEl = document.getElementById('title-danh-sach');
  var currentTitle = titleEl ? titleEl.innerText.trim() : '';
  if (currentTitle && currentTitle !== 'Danh sách tài liệu' && currentTitle !== 'Tất cả tài liệu' && currentTitle.indexOf('Kết quả tìm kiếm') === -1 && currentTitle.indexOf('Tài liệu') === -1) {
    uploadTags.push(currentTitle);
  }
  renderUploadTags();
}




function closeModal() {
  var modal = document.getElementById('upload-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  var form = document.getElementById('upload-form');
  if (form) form.reset();
  uploadTags = [];
  renderUploadTags();
}




function submitUpload() {
  var fileInput = document.getElementById('frm-file');
  var soKyHieuEl = document.getElementById('frm-sokyhieu');
  var trichYeuEl = document.getElementById('frm-trichyeu');
  var danhMucEl = document.getElementById('frm-danhmuc');
  var ngayEl = document.getElementById('frm-ngay');
  var ngayHetHanEl = document.getElementById('frm-ngayhethan');
  var ghiChuEl = document.getElementById('frm-ghichu');
  var btn = document.getElementById('btn-submit');

  if (!fileInput || fileInput.files.length === 0) {
    alert("Vui lòng chọn ít nhất 1 File đính kèm!");
    return;
  }




  var soKyHieu = soKyHieuEl ? soKyHieuEl.value : '';
  var trichYeu = trichYeuEl ? trichYeuEl.value : '';
  var catList = uploadTags.length > 0 ? uploadTags : ['Khác'];
  var ngayBanHanh = ngayEl ? ngayEl.value : '';
  var ngayHetHan = ngayHetHanEl ? ngayHetHanEl.value : '';
  var ghiChu = ghiChuEl ? ghiChuEl.value : '';




  var files = fileInput.files;
  var totalFiles = files.length;
  btn.disabled = true;
  var hasError = false;




  function uploadNextFile(index) {
    if (index >= totalFiles) {
      btn.innerHTML = '<i class="fas fa-save mr-2"></i> Lưu tài liệu';
      btn.disabled = false;
      if (!hasError) {
        alert("Tuyệt vời! Đã tải lên thành công " + totalFiles + " tài liệu.");
        closeModal();
        loadDashboardData();
      }
      return;
    }




    var file = files[index];
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Đang tải ' + (index + 1) + '/' + totalFiles + '...';




    var reader = new FileReader();
    reader.onload = function (e) {
      var base64Data = e.target.result.split(',')[1];

      var formData = {
        soKyHieu: soKyHieu,
        trichYeu: trichYeu,
        categories: catList,
        danhMuc: catList[0],
        ngayBanHanh: ngayBanHanh,
        ngayHetHan: ngayHetHan,
        ghiChu: ghiChu,
        fileName: file.name,
        mimeType: file.type,
        fileBase64: base64Data
      };




      fetch(BASE_URL + '/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(response => response.json())
        .then(res => {
          if (!res.success) {
            alert("Lỗi khi tải file [" + file.name + "]: " + res.message);
            hasError = true;
          }
          uploadNextFile(index + 1);
        })
        .catch(err => {
          alert("Lỗi kết nối khi tải file [" + file.name + "]: " + err.message);
          hasError = true;
          uploadNextFile(index + 1);
        });
    };
    reader.readAsDataURL(file);
  }




  uploadNextFile(0);
}




// --- HÀM XỬ LÝ SỬA TÀI LIỆU ---
function editDoc(docId) {
  var doc = allDocuments.find(function (item) {
    return item.fileId === docId || item.id === docId;
  });
  if (!doc) {
    alert("Không tìm thấy thông tin tài liệu!");
    return;
  }

  document.getElementById('edit-doc-id').value = docId;
  document.getElementById('edit-sokyhieu').value = doc.docNumber || '';
  var fnInput = document.getElementById('edit-filename');
  if (fnInput) fnInput.value = doc.fileName || '';
  document.getElementById('edit-trichyeu').value = doc.abstract || '';
  document.getElementById('edit-ghichu').value = doc.note || '';

  editTags = Array.isArray(doc.categories) && doc.categories.length > 0 ? [...doc.categories] : (doc.category ? [doc.category] : ['Khác']);
  renderEditTags();

  if (doc.effectiveDate) {
    var d = new Date(doc.effectiveDate);
    if (!isNaN(d)) document.getElementById('edit-ngay').value = d.toISOString().split('T')[0];
  }
  if (doc.expiryDate) {
    var expD = new Date(doc.expiryDate);
    if (!isNaN(expD)) document.getElementById('edit-ngayhethan').value = expD.toISOString().split('T')[0];
  }

  var editModal = document.getElementById('edit-modal');
  if (editModal) {
    editModal.classList.remove('hidden');
    editModal.classList.add('flex');
  }
}




function closeEditModal() {
  var editModal = document.getElementById('edit-modal');
  if (editModal) {
    editModal.classList.add('hidden');
    editModal.classList.remove('flex');
  }
  editTags = [];
  renderEditTags();
}




function submitEdit() {
  var docId = document.getElementById('edit-doc-id').value;
  var btn = document.getElementById('btn-edit-submit');
  var catList = editTags.length > 0 ? editTags : ['Khác'];
  var fnInput = document.getElementById('edit-filename');
  var formData = {
    docId: docId,
    soKyHieu: document.getElementById('edit-sokyhieu').value,
    tenTaiLieu: fnInput ? fnInput.value : '',
    categories: catList,
    danhMuc: catList[0],
    trichYeu: document.getElementById('edit-trichyeu').value,
    ngayBanHanh: document.getElementById('edit-ngay').value,
    ngayHetHan: document.getElementById('edit-ngayhethan').value,
    ghiChu: document.getElementById('edit-ghichu').value
  };
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang lưu...';

  fetch(BASE_URL + '/api/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
    .then(response => response.json())
    .then(res => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save mr-1"></i> Cập nhật';
      if (res.success) {
        alert(res.message);
        closeEditModal();
        loadDashboardData();
      } else {
        alert("Lỗi: " + res.message);
      }
    })
    .catch(err => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save mr-1"></i> Cập nhật';
      alert("Lỗi máy chủ: " + err.message);
    });
}




// --- MODULE XUẤT DỮ LIỆU EXCEL ---
function exportToExcel() {
  if (!allDocuments || allDocuments.length === 0) {
    alert("Hệ thống chưa tải xong dữ liệu hoặc không có tài liệu nào để xuất!");
    return;
  }

  var viewDash = document.getElementById('view-dashboard');
  var dataToExport = allDocuments;
  var fileName = "Danh_Sach_Tong_Hop_Tai_Lieu.xlsx";
  var sheetName = "Tổng hợp";




  if (viewDash && viewDash.classList.contains('hidden')) {
    var titleEl = document.getElementById('title-danh-sach');
    var currentCategory = titleEl ? titleEl.innerText.trim() : "";

    if (currentCategory && currentCategory !== "Danh sách tài liệu") {
      dataToExport = currentCategoryList.length > 0 ? currentCategoryList : allDocuments.filter(function (doc) {
        var cat = doc.category ? String(doc.category).toLowerCase().trim() : "";
        return cat.indexOf(currentCategory.toLowerCase()) !== -1;
      });

      var cleanCatName = currentCategory.replace(/[^\w\s]/gi, '').trim().replace(/\s+/g, "_");
      fileName = "Danh_Sach_" + cleanCatName + ".xlsx";
      sheetName = currentCategory.substring(0, 31);
    }
  }




  if (dataToExport.length === 0) {
    alert("Không có dữ liệu trong chuyên mục này để xuất!");
    return;
  }




  var excelData = dataToExport.map(function (doc, index) {
    var ngayBanHanh = "";
    if (doc.effectiveDate) {
      var d1 = new Date(doc.effectiveDate);
      if (!isNaN(d1)) ngayBanHanh = d1.toLocaleDateString('vi-VN');
    }

    var ngayHetHan = "";
    if (doc.expiryDate) {
      var d2 = new Date(doc.expiryDate);
      if (!isNaN(d2)) ngayHetHan = d2.toLocaleDateString('vi-VN');
    }




    return {
      "STT": index + 1,
      "Số/Ký hiệu": doc.docNumber || "",
      "Trích yếu / Nội dung": doc.abstract || doc.fileName || "",
      "Danh mục": doc.category || "Khác",
      "Ngày ban hành": ngayBanHanh,
      "Ngày hết hiệu lực": ngayHetHan,
      "Trạng thái": doc.status || "Không xác định",
      "Người cập nhật": doc.updatedBy || "",
      "Link Drive (Click để xem)": doc.driveLink || ""
    };
  });




  var worksheet = XLSX.utils.json_to_sheet(excelData);
  var wscols = [
    { wch: 5 }, { wch: 20 }, { wch: 50 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 50 }
  ];
  worksheet['!cols'] = wscols;




  var workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}
// --- MODULE ĐIỀU KHIỂN SIDEBAR ---
if (typeof toggleSidebar === 'undefined') {
  function toggleSidebar() {
    if (window.innerWidth >= 1024) {
      document.body.classList.toggle('sidebar-collapsed');
      var isCollapsed = document.body.classList.contains('sidebar-collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
    } else {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebar-overlay');
      if (sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.remove('active');
      } else {
        sidebar.classList.add('mobile-open');
        sidebar.classList.remove('-translate-x-full');
        if (overlay) overlay.classList.add('active');
      }
    }
  }
}
// --- HÀM MỞ TÌM KIẾM NÂNG CAO ---
function openAdvancedFilter() {
  // 1. Chuyển hướng ngay lập tức sang trang "Tất cả tài liệu" (nơi chứa thanh bộ lọc nâng cao)
  navigateTo('danh-sach', 'Tất cả tài liệu', 'menu-all-docs');

  // 2. Tự động trỏ chuột (focus) vào ô Lọc Trạng thái để người dùng thao tác được ngay
  setTimeout(function () {
    var statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
      statusFilter.focus();
    }
  }, 100);
}
// --- MODULE THÔNG BÁO (NOTIFICATIONS) ---
function toggleNotifications() {
  var dropdown = document.getElementById('notification-dropdown');
  if (dropdown) {
    // Đóng/mở khung thông báo
    dropdown.classList.toggle('hidden');

    // Nếu khung thông báo đang mở ra, đánh dấu là "Đã đọc" bằng cách ẩn chấm đỏ
    if (!dropdown.classList.contains('hidden')) {
      var badge = document.getElementById('notification-badge');
      var countText = document.getElementById('notification-count-text');

      if (badge) {
        badge.classList.add('hidden'); // Ẩn chấm đỏ
      }
      if (countText) {
        countText.innerText = 'Đã xem'; // Đổi trạng thái chữ thành đã xem
        countText.className = 'text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium';
      }
    }
  }
}




// Tự động ẩn menu thông báo khi click chuột ra ngoài
document.addEventListener('click', function (event) {
  var dropdown = document.getElementById('notification-dropdown');
  var bellBtn = document.querySelector('button[onclick="toggleNotifications()"]');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (!dropdown.contains(event.target) && (!bellBtn || !bellBtn.contains(event.target))) {
      dropdown.classList.add('hidden');
    }
  }
});


// --- HÀM ĐỔ DỮ LIỆU CẢNH BÁO VÀO DROPDOWN THÔNG BÁO ---
function renderNotifications(docs) {
  var notifList = document.getElementById('notification-list');
  var badge = document.getElementById('notification-badge');
  var countText = document.getElementById('notification-count-text');
  if (!notifList || !badge) return;

  var alerts = [];

  docs.forEach(function (doc) {
    var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
    var docNumber = doc.docNumber || 'Chưa có số';

    if (evalInfo.statusKey === 'expiring') {
      alerts.push({
        title: 'Tài liệu sắp hết hạn (' + evalInfo.countdownText + ')',
        desc: 'Số hiệu ' + docNumber + ' - ' + (doc.abstract || doc.fileName || ''),
        color: 'orange',
        icon: 'fa-triangle-exclamation'
      });
    } else if (evalInfo.statusKey === 'expired') {
      alerts.push({
        title: 'Tài liệu đã hết hạn (' + evalInfo.countdownText + ')',
        desc: 'Số hiệu ' + docNumber + ' - ' + (doc.abstract || doc.fileName || ''),
        color: 'red',
        icon: 'fa-circle-xmark'
      });
    }
  });

  // Hiển thị số lượng lên badge chuông
  if (alerts.length > 0) {
    badge.innerText = alerts.length > 99 ? '99+' : alerts.length;
    badge.classList.remove('hidden');
    if (countText) {
      countText.innerText = alerts.length + ' cảnh báo';
      countText.className = 'text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold';
    }
  } else {
    badge.classList.add('hidden');
    if (countText) {
      countText.innerText = '0 cảnh báo';
      countText.className = 'text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium';
    }
  }

  // Đổ danh sách vào menu (Hiển thị 15 cái mới nhất)
  notifList.innerHTML = '';
  if (alerts.length === 0) {
    notifList.innerHTML = '<div class="px-4 py-6 text-center text-sm text-gray-500 italic">Tuyệt vời! Không có cảnh báo hết hạn nào.</div>';
    return;
  }

  alerts.slice(0, 15).forEach(function (item) {
    var html =
      '<div class="px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 items-start border-b border-gray-100 last:border-0">' +
      '<div class="mt-0.5 text-' + item.color + '-500 bg-' + item.color + '-100 p-2 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-xs">' +
      '<i class="fas ' + item.icon + '"></i>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
      '<p class="text-xs font-bold text-gray-800 line-clamp-1">' + item.title + '</p>' +
      '<p class="text-[11px] text-gray-600 line-clamp-2 mt-0.5">' + item.desc + '</p>' +
      '</div>' +
      '</div>';
    notifList.insertAdjacentHTML('beforeend', html);
  });
}

// --- MODULE VẼ BIỂU ĐỒ (CHART.JS) ---
var chartCatInstance = null;
var chartYearInstance = null;
var chartStatusInstance = null;

function renderCharts(docs) {
  // Tự động nạp Chart.js UMD nếu thư viện chưa sẵn sàng trên trình duyệt PC/Mobile
  if (typeof Chart === 'undefined') {
    if (!window._chartJsLoading) {
      window._chartJsLoading = true;
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.onload = function () {
        window._chartJsLoading = false;
        renderCharts(docs);
      };
      s.onerror = function () {
        var s2 = document.createElement('script');
        s2.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
        s2.onload = function () {
          window._chartJsLoading = false;
          renderCharts(docs);
        };
        s2.onerror = function () {
          window._chartJsLoading = false;
          ['chartCategory', 'chartYear', 'chartStatus'].forEach(function(id) {
            var canvas = document.getElementById(id);
            var fallback = document.getElementById(id + '-fallback');
            if (canvas) canvas.style.display = 'none';
            if (fallback) fallback.classList.remove('hidden');
          });
        };
        document.head.appendChild(s2);
      };
      document.head.appendChild(s);
    }
    return;
  }

  ['chartCategory', 'chartYear', 'chartStatus'].forEach(function(id) {
    var canvas = document.getElementById(id);
    var fallback = document.getElementById(id + '-fallback');
    if (canvas) canvas.style.display = 'block';
    if (fallback) fallback.classList.add('hidden');
  });

  Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
  Chart.defaults.font.size = 13;

  // --- BỘ TỪ ĐIỂN TỰ ĐỘNG GOM NHÓM (DYNAMIC MAPPING) ---
  // Hỗ trợ tự động nhận diện danh mục mới và gom nhóm theo CATEGORY_HIERARCHY
  var fallbackMapping = {
    "TL QĐ 272/QĐ-CHK": ["272", "qđ-chk", "qđ 272", "quy định 272"],
    "TL ISO 9001:2015": ["iso", "chính sách chất lượng", "mtcl", "mục tiêu chất lượng", "sổ tay", "quy trình", "biểu mẫu", "hướng dẫn"],
    "ATVSLĐ": ["atvslđ", "an toàn", "vệ sinh lao động"],
    "PCCC-CNCH": ["pccc", "cnch", "phòng cháy", "chữa cháy", "cứu nạn"],
    "Hệ thống VBDHĐ TCT": ["vbdhđ tct", "tct", "tổng công ty"],
    "Hệ thống VBDHĐ ĐKSKL": ["vbdhđ đkskl", "đkskl", "đài kiểm soát"],
    "Năng định, Năng lực": ["năng định", "năng lực"],
    "Tổ Không lưu": ["không lưu", "bqp-ctc", "bqp ctc"],
    "Tổ Kỹ thuật": ["kỹ thuật"],
    "Tổ Phục vụ bay": ["phục vụ bay", "pvb"],
    "Tổ An ninh": ["an ninh"]
  };

  var catCounts = {};
  var yearCounts = {};
  var statusCounts = {
    "Còn hiệu lực": 0,
    "Sắp hết hiệu lực": 0,
    "Đã hết hiệu lực": 0
  };

  // 1. XỬ LÝ VÀ GOM NHÓM DỮ LIỆU
  docs.forEach(function (doc) {
    // -- Phân loại vào Danh mục lớn --
    var catRaw = doc.category ? String(doc.category).trim() : "Khác";
    var finalCat = catRaw;

    // A. Tra cứu động từ CATEGORY_HIERARCHY (Tìm parent cao nhất)
    var visited = {};
    var foundParent = true;
    while (foundParent) {
      foundParent = false;
      for (var parent in CATEGORY_HIERARCHY) {
        var children = CATEGORY_HIERARCHY[parent] || [];
        var isChild = children.some(function(c) { return c.toLowerCase() === finalCat.toLowerCase(); });
        if (isChild && !visited[parent]) {
          finalCat = parent;
          visited[parent] = true;
          foundParent = true;
          break;
        }
      }
    }

    // B. Nếu finalCat vẫn chưa khớp chính xác (do lỗi đánh máy/historical data), dùng fallback mapping
    // Lưu ý: Nếu một danh mục mới được tạo ra (VD: "Pháp chế"), nó sẽ không match fallback
    // và giữ nguyên tên "Pháp chế" làm danh mục lớn, biểu đồ sẽ tự động thêm mảng mới!
    var lowerCatRaw = finalCat.toLowerCase();
    var matchedFallback = false;
    for (var rootMenu in fallbackMapping) {
      if (lowerCatRaw === rootMenu.toLowerCase()) {
        finalCat = rootMenu; // Chuẩn hóa lại tên hiển thị
        matchedFallback = true;
        break;
      }
      var keywords = fallbackMapping[rootMenu];
      for (var i = 0; i < keywords.length; i++) {
        if (lowerCatRaw.includes(keywords[i].toLowerCase())) {
          finalCat = rootMenu;
          matchedFallback = true;
          break;
        }
      }
      if (matchedFallback) break;
    }

    catCounts[finalCat] = (catCounts[finalCat] || 0) + 1;

    // -- Đếm Năm ban hành --
    if (doc.effectiveDate) {
      var d = new Date(doc.effectiveDate);
      if (!isNaN(d.getTime())) {
        var y = d.getFullYear();
        yearCounts[y] = (yearCounts[y] || 0) + 1;
      }
    }

    // -- Đếm Trạng thái hiệu lực động --
    var evalInfo = evaluateDocumentExpiry(doc.expiryDate, doc.status);
    if (evalInfo.statusKey === 'active') {
      statusCounts["Còn hiệu lực"]++;
    } else if (evalInfo.statusKey === 'expiring') {
      statusCounts["Sắp hết hiệu lực"]++;
    } else if (evalInfo.statusKey === 'expired') {
      statusCounts["Đã hết hiệu lực"]++;
    }
  });

  // 2. VẼ BIỂU ĐỒ 1: THEO LOẠI
  var ctxCat = document.getElementById('chartCategory');
  if (ctxCat) {
    var catColors = ['#2563eb', '#7c3aed', '#d97706', '#059669', '#dc2626', '#db2777', '#0891b2', '#65a30d', '#4f46e5', '#0d9488', '#ea580c', '#64748b'];

    if (chartCatInstance) chartCatInstance.destroy();
    chartCatInstance = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: Object.keys(catCounts),
        datasets: [{
          data: Object.values(catCounts),
          backgroundColor: catColors.slice(0, Object.keys(catCounts).length),
          borderWidth: 2, hoverOffset: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, padding: 12 } }
        }
      }
    });
  }

  // 3. VẼ BIỂU ĐỒ 2: THEO NĂM (BAR)
  var ctxYear = document.getElementById('chartYear');
  if (ctxYear) {
    var sortedYears = Object.keys(yearCounts).sort();
    var yearData = sortedYears.map(function (y) { return yearCounts[y]; });

    if (chartYearInstance) chartYearInstance.destroy();
    chartYearInstance = new Chart(ctxYear, {
      type: 'bar',
      data: {
        labels: sortedYears,
        datasets: [{
          label: 'Số lượng',
          data: yearData,
          backgroundColor: '#2563eb',
          borderRadius: 6,
          barThickness: 22
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 4. VẼ BIỂU ĐỒ 3: THEO TRẠNG THÁI HIỆU LỰC (3 MÀU CHUẨN XANH - CAM - ĐỎ)
  var ctxStatus = document.getElementById('chartStatus');
  if (ctxStatus) {
    var labelsStatus = Object.keys(statusCounts).filter(function (k) { return statusCounts[k] > 0; });
    var dataStatus = labelsStatus.map(function (k) { return statusCounts[k]; });

    var bgColors = labelsStatus.map(function (label) {
      var lbl = label.toLowerCase();
      if (lbl.indexOf('còn') !== -1) return '#059669'; // Xanh lá
      if (lbl.indexOf('sắp') !== -1) return '#f59e0b'; // Vàng Cam
      if (lbl.indexOf('hết') !== -1) return '#dc2626'; // Đỏ
      return '#8b5cf6';
    });

    if (chartStatusInstance) chartStatusInstance.destroy();
    chartStatusInstance = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: labelsStatus,
        datasets: [{
          data: dataStatus,
          backgroundColor: bgColors,
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, padding: 12 } }
        }
      }
    });
  }
}

// --- MODULE: TÌM KIẾM TỨC THÌ (REAL-TIME SEARCH) ---
function realTimeSearch() {
  // 1. Lấy từ khóa người dùng vừa gõ
  var keyword = document.getElementById('search-input').value.toLowerCase().trim();

  // 2. Chuyển sang giao diện danh sách nếu đang ở màn hình Dashboard
  var dashboardView = document.getElementById('view-dashboard');
  if (dashboardView && !dashboardView.classList.contains('hidden') && keyword !== "") {
    navigateTo('danh-sach', 'Tất cả tài liệu', 'menu-all-docs');
  }

  // 3. Nếu người dùng xóa trắng ô tìm kiếm, tự động khôi phục lại
  if (keyword === "") {
    renderCategoryTable('Tất cả tài liệu');
    return;
  }

  // 4. Lọc dữ liệu gốc
  baseCategoryList = allDocuments.filter(function (doc) {
    var soKyHieu = doc.docNumber ? String(doc.docNumber).toLowerCase() : "";
    var trichYeu = doc.abstract ? String(doc.abstract).toLowerCase() : "";
    var tenTaiLieu = doc.fileName ? String(doc.fileName).toLowerCase() : "";
    var loaiTL = doc.category ? String(doc.category).toLowerCase() : "";

    return soKyHieu.includes(keyword) || trichYeu.includes(keyword) || tenTaiLieu.includes(keyword) || loaiTL.includes(keyword);
  });

  // 5. Cập nhật Tiêu đề bảng
  var titleElement = document.querySelector('#view-danh-sach h2');
  if (titleElement) {
    titleElement.innerText = "KẾT QUẢ TÌM KIẾM: " + keyword.toUpperCase();
  }

  // 6. CHÌA KHÓA NẰM Ở ĐÂY: Gọi hàm applyFilters() thay vì in trực tiếp
  // Hàm này sẽ tiếp nhận baseCategoryList mới, đối chiếu bộ lọc và in ra bảng chính xác.
  if (typeof applyFilters === "function") {
    applyFilters();
  } else {
    currentPage = 1;
    displayCurrentPage();
  }
}

// =========================================================================
// === MODULE: ĐIỀU HƯỚNG CỬ CHỈ VUỐT & LỊCH SỬ DUYỆT TRANG (SWIPE & POPSTATE) ===
// =========================================================================
(function initMobileGestureAndHistoryNavigation() {
  var touchStartX = 0;
  var touchStartY = 0;
  var touchStartTime = 0;

  // Lắng nghe bắt đầu chạm màn hình
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  // Lắng nghe khi nhấc ngón tay (kết thúc vuốt)
  document.addEventListener('touchend', function (e) {
    if (e.changedTouches.length === 1 && window.innerWidth < 1024) {
      var touchEndX = e.changedTouches[0].clientX;
      var touchEndY = e.changedTouches[0].clientY;
      var deltaX = touchEndX - touchStartX;
      var deltaY = touchEndY - touchStartY;
      var duration = Date.now() - touchStartTime;

      // Không kích hoạt nếu chạm/vuốt trên ô nhập liệu (input, textarea, select)
      var target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      // Kiểm tra điều kiện cử chỉ vuốt ngang rõ ràng:
      // - Khoảng cách X > 70px
      // - Độ lệch dọc Y < 65px (tránh nhầm với thao tác cuộn dọc)
      // - Thời gian vuốt < 500ms
      // - Góc vuốt ngang chiếm ưu thế: |deltaX| > |deltaY| * 1.4
      if (Math.abs(deltaX) > 70 && Math.abs(deltaY) < 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4 && duration < 500) {
        if (deltaX > 0) {
          // 👉 VUỐT SANG PHẢI (TRÁI SANG PHẢI): BACK (LÙI LẠI)
          handleGestureBack();
        } else {
          // 👈 VUỐT SANG TRÁI (PHẢI SANG TRÁI): FORWARD (TIẾN TỚI)
          handleGestureForward();
        }
      }
    }
  }, { passive: true });

  function handleGestureBack() {
    // 1. Nếu Drawer Sidebar đang mở -> Đóng Sidebar trước
    var sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
      toggleSidebar();
      return;
    }
    // 2. Nếu Modal Thêm mới đang mở -> Đóng Modal
    var uploadModal = document.getElementById('upload-modal');
    if (uploadModal && !uploadModal.classList.contains('hidden')) {
      closeModal();
      return;
    }
    // 3. Nếu Modal Sửa đang mở -> Đóng Modal
    var editModal = document.getElementById('edit-modal');
    if (editModal && !editModal.classList.contains('hidden')) {
      closeEditModal();
      return;
    }
    // 4. Nếu có lịch sử trình duyệt -> Quay lại trang trước
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Nếu đang ở màn hình khác Dashboard và không còn history -> về Dashboard
      var viewDash = document.getElementById('view-dashboard');
      if (viewDash && viewDash.classList.contains('hidden')) {
        navigateTo('dashboard', null, 'menu-dashboard');
      }
    }
  }

  function handleGestureForward() {
    // 1. Nếu Sidebar đang mở -> Đóng Sidebar
    var sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
      toggleSidebar();
      return;
    }
    // 2. Tiến tới trang tiếp theo trong lịch sử
    window.history.forward();
  }

  // Lắng nghe sự kiện Popstate khi bấm nút Back trên điện thoại / vuốt cạnh hệ điều hành
  window.addEventListener('popstate', function (e) {
    // Đóng các modal nếu đang mở
    var uploadModal = document.getElementById('upload-modal');
    if (uploadModal && !uploadModal.classList.contains('hidden')) {
      uploadModal.classList.add('hidden');
      uploadModal.classList.remove('flex');
    }
    var editModal = document.getElementById('edit-modal');
    if (editModal && !editModal.classList.contains('hidden')) {
      editModal.classList.add('hidden');
      editModal.classList.remove('flex');
    }

    if (e.state && e.state.viewId) {
      navigateTo(e.state.viewId, e.state.categoryName, e.state.activeMenuId, true);
    } else {
      // Khôi phục về trang chủ nếu rỗng state
      navigateTo('dashboard', null, 'menu-dashboard', true);
    }
  });

  // Gán state ban đầu cho trang web
  if (!history.state) {
    history.replaceState({ viewId: 'dashboard', categoryName: null, activeMenuId: 'menu-dashboard' }, '', '#dashboard');
  }
})();



