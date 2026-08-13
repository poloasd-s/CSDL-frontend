
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
      "Văn bản, TL Việt Nam", "BQP-CTC", "QĐ, HD về ATS", "Luật", "Nghị định", "Thông tư", "Cục HK", "VBHD", "Danh mục TLHDKT",
      "ICAO", "ANNEX", "DOC"
    ],
    "Văn bản, TL Việt Nam": [
      "BQP-CTC", "QĐ, HD về ATS", "Luật", "Nghị định", "Thông tư", "Cục HK", "VBHD", "Danh mục TLHDKT"
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
      var parts = val.split(/[,;]/).map(function(p) { return p.trim(); }).filter(function(p) { return p.length > 0; });
      parts.forEach(function(part) {
        if (!uploadTags.some(function(t) { return t.toLowerCase() === part.toLowerCase(); })) {
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
      container.innerHTML = '<span class="text-xs text-gray-400 italic">Chưa chọn tag nào...</span>';
      return;
    }
    container.innerHTML = uploadTags.map(function(tag, i) {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">' +
               '<i class="fas fa-tag text-[10px] text-blue-600"></i> ' + tag +
               '<button type="button" onclick="removeUploadTag(' + i + ')" class="text-blue-600 hover:text-blue-900 font-bold focus:outline-none ml-1">&times;</button>' +
             '</span>';
    }).join('');
  }

  function addEditTag() {
    var input = document.getElementById('edit-tag-input');
    if (!input) return;
    var val = input.value.trim();
    if (val) {
      var parts = val.split(/[,;]/).map(function(p) { return p.trim(); }).filter(function(p) { return p.length > 0; });
      parts.forEach(function(part) {
        if (!editTags.some(function(t) { return t.toLowerCase() === part.toLowerCase(); })) {
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
      container.innerHTML = '<span class="text-xs text-gray-400 italic">Chưa chọn tag nào...</span>';
      return;
    }
    container.innerHTML = editTags.map(function(tag, i) {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">' +
               '<i class="fas fa-tag text-[10px] text-yellow-600"></i> ' + tag +
               '<button type="button" onclick="removeEditTag(' + i + ')" class="text-yellow-600 hover:text-yellow-900 font-bold focus:outline-none ml-1">&times;</button>' +
             '</span>';
    }).join('');
  }




  document.addEventListener("DOMContentLoaded", function() {
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
      document.querySelectorAll('.admin-only').forEach(function(el) {
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
        const mappedData = data.map(item => ({
            ...item,
            docNumber: item["Số/Ký hiệu VB"] || item.soKyHieuVB || item.docNumber || "",
            abstract: item["Nội dung trích yếu"] || item.noiDungTrichYeu || item.abstract || "",
            category: item["Danh mục"] || item.danhMuc || item.category || "Khác",
            categories: item.categories || [],
            effectiveDate: item["Ngày hiệu lực"] || item.ngayHieuLuc || item.effectiveDate || "",
            expiryDate: item["Ngày hết hiệu lực"] || item.ngayHetHieuLuc || item.expiryDate || "",
            status: item["Trạng thái"] || item.trangThai || item.status || "Không xác định",
            driveLink: item["Link Drive"] || item.linkDrive || item.driveLink || "",
            fileId: item["File ID"] || item.fileID || item.fileId || "",
            note: item["Ghi chú"] || item.ghiChu || item.note || "",
            fileName: item["Tên tài liệu"] || item.tenTaiLieu || item.fileName || "",
            updatedBy: item["Người cập nhật"] || item.nguoiCapNhat || item.updatedBy || ""
        }));

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




  function renderStats(docs) {
    var countTotal = docs.length, countActive = 0, countExpiring = 0, countExpired = 0;
    docs.forEach(function(doc) {
      var status = doc.status ? String(doc.status).trim().toLowerCase() : "";
      if (status === "còn hiệu lực") countActive++;
      else if (status === "sắp hết hiệu lực") countExpiring++;
      else if (status.indexOf("hết hiệu lực") !== -1) countExpired++;
    });
    var statTotal = document.getElementById('stat-total'); if (statTotal) statTotal.innerText = countTotal;
    var statActive = document.getElementById('stat-active'); if (statActive) statActive.innerText = countActive;
    var statExpiring = document.getElementById('stat-expiring'); if (statExpiring) statExpiring.innerText = countExpiring;
    var statExpired = document.getElementById('stat-expired'); if (statExpired) statExpired.innerText = countExpired;
  }




  function renderRecentTable(docs, isSearch) {
    var tbody = document.getElementById('table-recent-docs');
    if (!tbody) return;
    tbody.innerHTML = '';




    // Lấy mốc thời gian 30 ngày trước tính từ hiện tại
    var thirtyDaysAgo = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);




    // Lọc danh sách tài liệu thuộc 30 ngày gần nhất (dựa trên ngày ban hành/cập nhật)
    var recentDocs = docs;
    if (!isSearch) {
      recentDocs = docs.filter(function(doc) {
        if (!doc.effectiveDate) return false;
        var docTime = new Date(doc.effectiveDate).getTime();
        return !isNaN(docTime) && docTime >= thirtyDaysAgo;
      });
    }




    if (recentDocs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-gray-500">Không có tài liệu nào được cập nhật trong 30 ngày gần nhất.</td></tr>';
      return;
    }




    var limit = isSearch ? 20 : 5;
    var adminClass = (currentUserRole === 'admin') ? '' : 'hidden';




    recentDocs.slice(0, limit).forEach(function(doc, index) {
      var dateDisplay = "N/A";
      if (doc.effectiveDate) {
        var dateObj = new Date(doc.effectiveDate);
        if (!isNaN(dateObj)) dateDisplay = dateObj.toLocaleDateString('vi-VN');
      }




      var trichYeu = doc.abstract ? doc.abstract : '<span class="text-gray-400 italic">Chưa có trích yếu</span>';
      var docId = doc.fileId || doc.id || doc.driveLink || doc.docNumber || doc.abstract || '';
      
      var catList = (Array.isArray(doc.categories) && doc.categories.length > 0) ? doc.categories : (doc.category ? [doc.category] : ['Khác']);
      var categoryBadgesHtml = catList.map(function(c) {
        return '<span class="inline-block bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors mr-1 mb-1">' +
                 '<i class="fas fa-tag text-[9px] mr-1 text-blue-500"></i>' + c +
               '</span>';
      }).join('');




      var statusText = doc.status ? String(doc.status).trim() : "Không xác định";
      var statusLower = statusText.toLowerCase();
      var statusColor = "bg-gray-100 text-gray-700";
      if (statusLower === "còn hiệu lực") statusColor = "bg-green-100 text-green-700";
      else if (statusLower === "sắp hết hiệu lực") statusColor = "bg-orange-100 text-orange-700";
      else if (statusLower.indexOf("hết hiệu lực") !== -1) statusColor = "bg-red-100 text-red-700";




      var downloadLink = doc.fileId ? 'https://drive.google.com/uc?export=download&id=' + doc.fileId : '#';
      var trichYeu = doc.abstract ? doc.abstract : '<span class="text-gray-400 italic">Chưa có trích yếu</span>';
      var docId = doc.fileId || doc.id || doc.driveLink || doc.docNumber || doc.abstract || '';




      var tr = document.createElement('tr');
      tr.className = "hover:bg-blue-50 transition-colors cursor-pointer group";
      tr.innerHTML =
        '<td class="p-4" data-label="STT">' + (index + 1) + '</td>' +
        '<td class="p-4 font-semibold text-blue-700" data-label="Số ký hiệu">' + (doc.docNumber || '-') + '</td>' +
        '<td class="p-4" data-label="Trích yếu"><div class="line-clamp-2" title="' + (doc.abstract || '') + '">' + trichYeu + '</div></td>' +
        '<td class="p-4" data-label="Danh mục">' + categoryBadgesHtml + '</td>' +
        '<td class="p-4 text-gray-500" data-label="Ngày ban hành">' + dateDisplay + '</td>' +
        '<td class="p-4" data-label="Trạng thái"><span class="px-2.5 py-1 rounded-full text-xs font-medium ' + statusColor + '">' + statusText + '</span></td>' +
        '<td class="p-4 text-center" data-label="Thao tác">' +
          '<div class="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">' +
            '<a href="' + (doc.driveLink || '#') + '" target="_blank" class="text-gray-400 hover:text-blue-600" title="Xem"><i class="fas fa-eye"></i></a>' +
            '<a href="' + downloadLink + '" class="text-gray-400 hover:text-green-600" title="Tải"><i class="fas fa-download"></i></a>' +
            '<button onclick="editDoc(\'' + docId + '\')" class="admin-only ' + adminClass + ' text-gray-400 hover:text-yellow-600" title="Sửa"><i class="fas fa-edit"></i></button>' +
          '</div>' +
        '</td>';
      tbody.appendChild(tr);
    });
  }




  function renderWarningTables(docs) {
    var tbodyExpiring = document.getElementById('table-expiring-docs');
    var tbodyExpired = document.getElementById('table-expired-docs');
    if (!tbodyExpiring || !tbodyExpired) return;




    var expiringDocs = [];
    var expiredDocs = [];
    docs.forEach(function(doc) {
      var status = doc.status ? String(doc.status).trim().toLowerCase() : "";
      if (status === "sắp hết hiệu lực") expiringDocs.push(doc);
      if (status.indexOf("hết hiệu lực") !== -1 && status !== "sắp hết hiệu lực") expiredDocs.push(doc);
    });




    var badgeExpiring = document.getElementById('badge-expiring'); if (badgeExpiring) badgeExpiring.innerText = expiringDocs.length;
    var badgeExpired = document.getElementById('badge-expired'); if (badgeExpired) badgeExpired.innerText = expiredDocs.length;




    function buildTableHTML(tbody, dataList, themeClass) {
      tbody.innerHTML = '';
      if (dataList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">Tuyệt vời! Không có tài liệu nào.</td></tr>';
        return;
      }




      dataList.slice(0, 5).forEach(function(doc) {
        var dateDisplay = "N/A";
        if (doc.expiryDate) {
          var dateObj = new Date(doc.expiryDate);
          if (!isNaN(dateObj)) dateDisplay = dateObj.toLocaleDateString('vi-VN');
        }
        var statusText = doc.status ? String(doc.status).trim() : "Không xác định";
        var statusLower = statusText.toLowerCase();
        var statusColor = "bg-gray-100 text-gray-700";
        if (statusLower === "còn hiệu lực") statusColor = "bg-green-100 text-green-700";
        else if (statusLower === "sắp hết hiệu lực") statusColor = "bg-orange-100 text-orange-700";
        else if (statusLower.indexOf("hết hiệu lực") !== -1) statusColor = "bg-red-100 text-red-700";




        var downloadLink = doc.fileId ? 'https://drive.google.com/uc?export=download&id=' + doc.fileId : '#';
        var trichYeu = doc.abstract ? doc.abstract : '<span class="text-gray-400 italic">Chưa có trích yếu</span>';
        var tr = document.createElement('tr');
        tr.className = "hover:bg-" + themeClass + "-50 transition-colors";
        tr.innerHTML =
          '<td class="p-3 font-medium text-' + themeClass + '-700" data-label="Số ký hiệu">' + (doc.docNumber || '-') + '</td>' +
          '<td class="p-3" data-label="Trích yếu"><div class="line-clamp-1 text-gray-700" title="' + (doc.abstract || '') + '">' + trichYeu + '</div></td>' +
          '<td class="p-3 font-semibold text-' + themeClass + '-600" data-label="Ngày hết hạn">' + dateDisplay + '</td>' +
          '<td class="p-3" data-label="Trạng thái"><span class="px-2.5 py-1 rounded-full text-xs font-medium ' + statusColor + '">' + statusText + '</span></td>' +
          '<td class="p-3 text-center" data-label="Thao tác">' +
            '<a href="' + (doc.driveLink || '#') + '" target="_blank" class="text-gray-400 hover:text-blue-600 mr-2"><i class="fas fa-eye"></i></a>' +
            '<a href="' + downloadLink + '" class="text-gray-400 hover:text-green-600"><i class="fas fa-download"></i></a>' +
          '</td>';
        tbody.appendChild(tr);
      });
    }
    buildTableHTML(tbodyExpiring, expiringDocs, 'orange');
    buildTableHTML(tbodyExpired, expiredDocs, 'red');
  }




  // --- HÀM CÀI ĐẶT TÌM KIẾM ---
  function setupSearch() {
    var searchInput = document.getElementById('search-input');
    if (!searchInput) return;
   
    // Hỗ trợ nhấn phím Enter để tìm kiếm cho tiện
    searchInput.addEventListener('keypress', function(e) {
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
   
    baseCategoryList = allDocuments.filter(function(doc) {
      var soKyHieu = doc.docNumber ? String(doc.docNumber).toLowerCase() : "";
      var trichYeu = doc.abstract ? String(doc.abstract).toLowerCase() : "";
      var tenTaiLieu = doc.fileName ? String(doc.fileName).toLowerCase() : "";
      return soKyHieu.indexOf(keyword) !== -1 || trichYeu.indexOf(keyword) !== -1 || tenTaiLieu.indexOf(keyword) !== -1;
    });
   
    var viewDash = document.getElementById('view-dashboard');
    var viewList = document.getElementById('view-danh-sach');
    if (viewDash) viewDash.classList.add('hidden');
    if (viewList) viewList.classList.remove('hidden');
   
    document.querySelectorAll('.menu-link, .menu-sub-link').forEach(function(link) {
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

  // --- HÀM XEM TẤT CẢ TÀI LIỆU SẮP HẾT / ĐÃ HẾT HIỆU LỰC ---
  function viewAllStatus(statusType) {
    var viewDash = document.getElementById('view-dashboard');
    var viewList = document.getElementById('view-danh-sach');
    if (viewDash) viewDash.classList.add('hidden');
    if (viewList) viewList.classList.remove('hidden');


    // Xóa highlight trên menu Sidebar
    document.querySelectorAll('.menu-link, .menu-sub-link').forEach(function(link) {
      if (link.classList.contains('menu-link')) {
        link.className = "menu-link flex items-center gap-3 px-4 py-2 hover:bg-blue-800 text-gray-300 border-l-4 border-transparent cursor-pointer transition-colors text-sm";
      } else {
        link.className = "menu-sub-link block pl-14 pr-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-blue-800 cursor-pointer border-l-4 border-transparent";
      }
    });


    // Đặt lại tiêu đề bảng
    var titleStr = statusType === 'sắp hết hiệu lực' ? "Tất cả tài liệu sắp hết hiệu lực" : "Tất cả tài liệu đã hết hiệu lực";
    var titleEl = document.getElementById('title-danh-sach');
    if (titleEl) titleEl.innerText = titleStr;


    // Lọc dữ liệu đưa vào danh sách hiển thị
    baseCategoryList = allDocuments.filter(function(doc) {
      var docStatus = doc.status ? String(doc.status).trim().toLowerCase() : "";
      if (statusType === 'hết hiệu lực') {
         return docStatus.indexOf("hết hiệu lực") !== -1 && docStatus !== "sắp hết hiệu lực";
      } else {
         return docStatus === "sắp hết hiệu lực";
      }
    });


    clearFilters(); // Reset thanh lọc và hiển thị danh sách
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




  function navigateTo(viewId, categoryName, activeMenuId) {
    var viewDash = document.getElementById('view-dashboard');
    var viewList = document.getElementById('view-danh-sach');
    if (viewDash) viewDash.classList.add('hidden');
    if (viewList) viewList.classList.add('hidden');




    var mainLinks = document.querySelectorAll('.menu-link');
    mainLinks.forEach(function(link) {
      link.className = "menu-link flex items-center gap-3 px-4 py-2 hover:bg-blue-800 text-gray-300 border-l-4 border-transparent cursor-pointer transition-colors text-sm";
    });




    var subLinks = document.querySelectorAll('.menu-sub-link');
    subLinks.forEach(function(link) {
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




    if (viewId === 'dashboard' && viewDash) {
      viewDash.classList.remove('hidden');
      var searchInput = document.getElementById('search-input');
      if(searchInput) searchInput.value = '';
    }
    else if (viewId === 'danh-sach' && viewList) {
      viewList.classList.remove('hidden');
      var titleEl = document.getElementById('title-danh-sach');
      if (titleEl) titleEl.innerText = categoryName;
      renderCategoryTable(categoryName);
    }




    // THÊM ĐOẠN NÀY VÀO CUỐI HÀM navigateTo: Tự động đóng menu trên Mobile
    if (window.innerWidth < 768) {
      var sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
      }
    }
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
    baseCategoryList = allDocuments.filter(function(doc) {
      var cat = doc.category ? String(doc.category).toLowerCase().trim() : "";
      var note = doc.note ? String(doc.note).toLowerCase().trim() : "";
      return cat.indexOf("ngoài") !== -1 || note.indexOf("ngoài") !== -1 || cat.indexOf("bên ngoài") !== -1;
    });
  } 
  else if (categoryName === 'Tài liệu nội bộ') {
    baseCategoryList = allDocuments.filter(function(doc) {
      var cat = doc.category ? String(doc.category).toLowerCase().trim() : "";
      var note = doc.note ? String(doc.note).toLowerCase().trim() : "";
      return cat.indexOf("nội bộ") !== -1 || note.indexOf("nội bộ") !== -1 || cat.indexOf("trong bộ") !== -1;
    });
  } 
  else if (categoryName === '30 ngày gần nhất') {
    // 1. Lấy mốc thời gian 30 ngày trước
    var thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 2. Lọc danh sách 30 ngày
    baseCategoryList = allDocuments.filter(function(doc) {
      var rawDate = doc.effectiveDate; 
      if (!rawDate) return false;
      var docDate = new Date(rawDate);
      if (isNaN(docDate.getTime())) return false;
      return docDate >= thirtyDaysAgo;
    });
  } 
  else {
    var keyword = String(categoryName).toLowerCase().trim();
    var validCatSet = new Set([keyword]);
    
    // Tự động bổ sung các danh mục con nếu click vào danh mục cha
    for (var parent in CATEGORY_HIERARCHY) {
      if (parent.toLowerCase() === keyword) {
        CATEGORY_HIERARCHY[parent].forEach(function(child) {
          validCatSet.add(child.toLowerCase());
        });
      }
    }

    baseCategoryList = allDocuments.filter(function(doc) {
      var match = false;
      if (Array.isArray(doc.categories) && doc.categories.length > 0) {
        match = doc.categories.some(function(c) {
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




    currentCategoryList = baseCategoryList.filter(function(doc) {
      var docStatus = doc.status ? String(doc.status).trim().toLowerCase() : "";
      var passStatus = (statusFilter === "all") || (docStatus.indexOf(statusFilter) !== -1);




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




  function clearFilters() {
    var statusEl = document.getElementById('filter-status');
    var fromEl = document.getElementById('filter-from-date');
    var toEl = document.getElementById('filter-to-date');
   
    if(statusEl) statusEl.value = 'all';
    if(fromEl) fromEl.value = '';
    if(toEl) toEl.value = '';
   
    applyFilters();
  }




  function displayCurrentPage() {
    var tbody = document.getElementById('table-danh-sach-docs');
    if (!tbody) return;
    tbody.innerHTML = '';
   
    var totalItems = currentCategoryList.length;
    var startItem = (currentPage - 1) * itemsPerPage;
    var endItem = Math.min(startItem + itemsPerPage, totalItems);
   
    var pageStartEl = document.getElementById('page-start');
    if (pageStartEl) pageStartEl.innerText = totalItems === 0 ? 0 : startItem + 1;
   
    var pageEndEl = document.getElementById('page-end');
    if (pageEndEl) pageEndEl.innerText = endItem;
   
    var pageTotalEl = document.getElementById('page-total');
    if (pageTotalEl) pageTotalEl.innerText = totalItems;
   
    var pageNumberEl = document.getElementById('page-number');
    if (pageNumberEl) pageNumberEl.innerText = currentPage;




    var btnPrev = document.getElementById('btn-prev-page');
    var btnNext = document.getElementById('btn-next-page');
    if (btnPrev) btnPrev.style.opacity = (currentPage === 1) ? '0.5' : '1';
    if (btnNext) btnNext.style.opacity = (endItem >= totalItems) ? '0.5' : '1';




    if (totalItems === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500">Chưa có dữ liệu phù hợp.</td></tr>';
      return;
    }




    var adminClass = (currentUserRole === 'admin') ? '' : 'hidden';
    var pageData = currentCategoryList.slice(startItem, endItem);




    pageData.forEach(function(doc, index) {
      var dateDisplay = "N/A";
      if (doc.effectiveDate) {
        var dateObj = new Date(doc.effectiveDate);
        if (!isNaN(dateObj)) dateDisplay = dateObj.toLocaleDateString('vi-VN');
      }




      var statusText = doc.status ? String(doc.status).trim() : "Không xác định";
      var statusLower = statusText.toLowerCase();
      var statusColor = "bg-gray-100 text-gray-700";
      if (statusLower === "còn hiệu lực") statusColor = "bg-green-100 text-green-700";
      else if (statusLower === "sắp hết hiệu lực") statusColor = "bg-orange-100 text-orange-700";
      else if (statusLower.indexOf("hết hiệu lực") !== -1) statusColor = "bg-red-100 text-red-700";




      var downloadLink = doc.fileId ? 'https://drive.google.com/uc?export=download&id=' + doc.fileId : '#';
      var trichYeu = doc.abstract ? doc.abstract : '<span class="text-gray-400 italic">Chưa có trích yếu</span>';
      var docId = doc.fileId || doc.id || doc.driveLink || doc.docNumber || doc.abstract || '';
     
      var tr = document.createElement('tr');
      tr.className = "hover:bg-blue-50 transition-colors";
     
      var htmlString =
        '<td class="p-4" data-label="STT">' + (startItem + index + 1) + '</td>' +
        '<td class="p-4 font-semibold text-blue-700" data-label="Số ký hiệu">' + (doc.docNumber || '-') + '</td>' +
        '<td class="p-4" data-label="Trích yếu"><div class="line-clamp-2" title="' + (doc.abstract || '') + '">' + trichYeu + '</div></td>' +
        '<td class="p-4 text-gray-500" data-label="Ngày ban hành">' + dateDisplay + '</td>' +
        '<td class="p-4" data-label="Trạng thái"><span class="px-2.5 py-1 rounded-full text-xs font-medium ' + statusColor + '">' + statusText + '</span></td>' +
        '<td class="p-4 text-center" data-label="Thao tác">' +
          '<div class="flex items-center justify-center gap-3">' +
            '<a href="' + (doc.driveLink || '#') + '" target="_blank" class="text-gray-400 hover:text-blue-600" title="Xem"><i class="fas fa-eye"></i></a>' +
            '<a href="' + downloadLink + '" class="text-gray-400 hover:text-green-600" title="Tải"><i class="fas fa-download"></i></a>' +
            '<button onclick="editDoc(\'' + docId + '\')" class="admin-only ' + adminClass + ' text-gray-400 hover:text-yellow-600" title="Sửa"><i class="fas fa-edit"></i></button>' +
          '</div>' +
        '</td>';
       
      tr.innerHTML = htmlString;
      tbody.appendChild(tr);
    });
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
    if (modal) modal.classList.remove('hidden');
    var titleEl = document.getElementById('title-danh-sach');
    var danhMucEl = document.getElementById('frm-danhmuc');
    var currentTitle = titleEl ? titleEl.innerText : '';
    if (danhMucEl) danhMucEl.value = currentTitle !== 'Danh sách tài liệu' ? currentTitle : '';
  }




  function closeModal() {
    var modal = document.getElementById('upload-modal');
    if (modal) modal.classList.add('hidden');
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
      reader.onload = function(e) {
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
    var doc = allDocuments.find(function(item) {
      return item.fileId === docId || item.id === docId;
    });
    if (!doc) {
      alert("Không tìm thấy thông tin tài liệu!");
      return;
    }
   
    document.getElementById('edit-doc-id').value = docId;
    document.getElementById('edit-sokyhieu').value = doc.docNumber || '';
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
    var formData = {
      docId: docId,
      soKyHieu: document.getElementById('edit-sokyhieu').value,
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
        dataToExport = currentCategoryList.length > 0 ? currentCategoryList : allDocuments.filter(function(doc) {
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




    var excelData = dataToExport.map(function(doc, index) {
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
      {wch: 5}, {wch: 20}, {wch: 50}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 50}
    ];
    worksheet['!cols'] = wscols;




    var workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  }
  // --- MODULE ĐIỀU KHIỂN SIDEBAR TRÊN MOBILE ---
  function toggleSidebar() {
    // 1. Trượt Sidebar ra/vào
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');

    // 2. Đẩy phần nội dung chính (Lệnh md:ml-64 chỉ có tác dụng trên máy tính/iPad)
    const mainContent = document.getElementById('my-content');
    if (mainContent) {
     mainContent.classList.toggle('md:ml-64');
    }

    // 3. Xử lý nút 3 gạch thông minh theo thiết bị
    const btn = document.getElementById('hamburger-btn');
    if (btn) {
      // Nếu là màn hình điện thoại (dưới 768px), cho nút tự dịch chuyển để không bị Sidebar đè
      if (window.innerWidth < 768) {
        btn.classList.toggle('translate-x-64');
      } else {
        // Nếu là màn hình lớn, dọn dẹp lệnh tự dịch chuyển để tránh lỗi "đẩy kép"
        btn.classList.remove('translate-x-64');
      }
    }
  }
  // --- HÀM MỞ TÌM KIẾM NÂNG CAO ---
  function openAdvancedFilter() {
    // 1. Chuyển hướng ngay lập tức sang trang "Tất cả tài liệu" (nơi chứa thanh bộ lọc nâng cao)
    navigateTo('danh-sach', 'Tất cả tài liệu', 'menu-all-docs');
   
    // 2. Tự động trỏ chuột (focus) vào ô Lọc Trạng thái để người dùng thao tác được ngay
    setTimeout(function() {
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
  document.addEventListener('click', function(event) {
    var dropdown = document.getElementById('notification-dropdown');
    var bellBtn = document.querySelector('button[onclick="toggleNotifications()"]');
    if (dropdown && !dropdown.classList.contains('hidden')) {
      if (!dropdown.contains(event.target) && (!bellBtn || !bellBtn.contains(event.target))) {
        dropdown.classList.add('hidden');
      }
    }
  });


 // Hàm đổ dữ liệu cảnh báo vào chuông
  function renderNotifications(docs) {
    var notifList = document.getElementById('notification-list');
    var badge = document.getElementById('notification-badge');
    var countText = document.getElementById('notification-count-text');
    if (!notifList || !badge) return;


    var alerts = [];
   
    // Lọc các tài liệu có vấn đề để đưa vào thông báo
    docs.forEach(function(doc) {
      var status = doc.status ? String(doc.status).trim().toLowerCase() : "";
      var docNumber = doc.docNumber || 'Chưa có số';
     
      if (status === "sắp hết hiệu lực") {
        alerts.push({
          title: 'Tài liệu sắp hết hạn',
          desc: 'Tài liệu số ' + docNumber + ' sắp hết hiệu lực.',
          color: 'orange',
          icon: 'fa-exclamation-triangle'
        });
      } else if (status.indexOf("hết hiệu lực") !== -1) {
        alerts.push({
          title: 'Tài liệu đã hết hạn',
          desc: 'Tài liệu số ' + docNumber + ' đã hết hiệu lực.',
          color: 'red',
          icon: 'fa-times-circle'
        });
      }
    });


    // Hiển thị số lượng lên dấu chấm đỏ
    if (alerts.length > 0) {
      badge.innerText = alerts.length > 99 ? '99+' : alerts.length;
      badge.classList.remove('hidden');
      if (countText) countText.innerText = alerts.length + ' cảnh báo';
    } else {
      badge.classList.add('hidden');
      if (countText) countText.innerText = '0 cảnh báo';
    }


    // Đổ danh sách vào menu (Hiển thị 15 cái mới nhất)
    notifList.innerHTML = '';
    if (alerts.length === 0) {
      notifList.innerHTML = '<div class="px-4 py-6 text-center text-sm text-gray-500">Tuyệt vời! Không có cảnh báo nào.</div>';
      return;
    }


    alerts.slice(0, 15).forEach(function(item) {
      var html =
        '<div class="px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 items-start">' +
          '<div class="mt-0.5 text-' + item.color + '-500 bg-' + item.color + '-100 p-2 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">' +
            '<i class="fas ' + item.icon + '"></i>' +
          '</div>' +
          '<div>' +
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
    if (typeof Chart === 'undefined') return;
   
    Chart.defaults.font.family = '"Times New Roman", Times, serif';
    Chart.defaults.font.size = 13;




    // --- BỘ TỪ ĐIỂN GOM NHÓM THÔNG MINH ---
    // (Bạn có thể tự do thêm các từ khóa nhận diện vào trong ngoặc vuông cho từng nhóm)
    var categoryMapping = {
      "TL QĐ 272/QĐ-CHK": ["272", "qđ-chk", "qđ 272", "quy định 272"],
      "TL ISO 9001:2015": ["iso", "chính sách chất lượng", "mtcl", "mục tiêu chất lượng", "sổ tay", "quy trình", "biểu mẫu", "hướng dẫn"],
      "ATVSLĐ": ["atvslđ", "an toàn", "vệ sinh lao động"],
      "PCCC-CNCH": ["pccc", "cnch", "phòng cháy", "chữa cháy", "cứu nạn"],
      "Hệ thống VBDHĐ TCT": ["vbdhđ tct", "tct", "tổng công ty"],
      "Hệ thống VBDHĐ ĐKSKL": ["vbdhđ đkskl", "đkskl", "đài kiểm soát"],
      "Năng định, Năng lực": ["năng định", "năng lực"],
      "Tổ Không lưu": ["không lưu", "bqp-ctc", "bqp ctc"], // Đã gom BQP-CTC vào tổ Không lưu
      "Tổ Kỹ thuật": ["kỹ thuật"],
      "Tổ Phục vụ bay": ["phục vụ bay", "pvb"],
      "Tổ An ninh": ["an ninh"]
    };




    var catCounts = {};
    var yearCounts = {};
    var statusCounts = {};




    // 1. XỬ LÝ VÀ GOM NHÓM DỮ LIỆU
    docs.forEach(function(doc) {
     
      // -- Phân loại vào Danh mục lớn --
      var catRaw = doc.category ? String(doc.category).trim() : "";
      var finalCat = "Khác"; // Mặc định là Khác
     
      if (catRaw !== "") {
        var lowerCatRaw = catRaw.toLowerCase();
        var matched = false;




        for (var parentMenu in categoryMapping) {
          // Trùng tên menu gốc
          if (lowerCatRaw.includes(parentMenu.toLowerCase())) {
            finalCat = parentMenu;
            matched = true;
            break;
          }
          // Trùng từ khóa trong nhóm nhỏ
          var keywords = categoryMapping[parentMenu];
          for (var i = 0; i < keywords.length; i++) {
            if (lowerCatRaw.includes(keywords[i].toLowerCase())) {
              finalCat = parentMenu;
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      }
      catCounts[finalCat] = (catCounts[finalCat] || 0) + 1;




      // -- Đếm Năm ban hành --
      if (doc.effectiveDate) {
        var d = new Date(doc.effectiveDate);
        if (!isNaN(d)) {
          var y = d.getFullYear();
          yearCounts[y] = (yearCounts[y] || 0) + 1;
        }
      }




      // -- Đếm Trạng thái --
      var stat = doc.status ? String(doc.status).trim() : "Không xác định";
      statusCounts[stat] = (statusCounts[stat] || 0) + 1;
    });




    // 2. VẼ BIỂU ĐỒ 1: THEO LOẠI (GOM NHÓM MỚI)
    var ctxCat = document.getElementById('chartCategory');
    if (ctxCat) {
      var catColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6', '#f97316', '#6b7280'];
     
      if (chartCatInstance) chartCatInstance.destroy();
      chartCatInstance = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
          labels: Object.keys(catCounts),
          datasets: [{
            data: Object.values(catCounts),
            backgroundColor: catColors.slice(0, Object.keys(catCounts).length),
            borderWidth: 2, hoverOffset: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }
          }
        }
      });
    }




    // 3. VẼ BIỂU ĐỒ 2: THEO NĂM (BAR)
    var ctxYear = document.getElementById('chartYear');
    if (ctxYear) {
      var sortedYears = Object.keys(yearCounts).sort();
      var yearData = sortedYears.map(y => yearCounts[y]);
     
      if (chartYearInstance) chartYearInstance.destroy();
      chartYearInstance = new Chart(ctxYear, {
        type: 'bar',
        data: {
          labels: sortedYears,
          datasets: [{
            label: 'Số lượng',
            data: yearData,
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            barThickness: 24
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




    // 4. VẼ BIỂU ĐỒ 3: THEO TRẠNG THÁI
    var ctxStatus = document.getElementById('chartStatus');
    if (ctxStatus) {
      var labelsStatus = Object.keys(statusCounts);
      var dataStatus = Object.values(statusCounts);
     
      var bgColors = labelsStatus.map(function(label) {
        var lbl = label.toLowerCase();
        // Đã đổi sang màu xanh lá đậm, sâu và chuyên nghiệp hơn (#059669)
        if (lbl === 'còn hiệu lực') return '#059669';
        if (lbl === 'sắp hết hiệu lực') return '#f59e0b';
        if (lbl.indexOf('hết hiệu lực') !== -1 && lbl !== 'sắp hết hiệu lực') return '#ef4444';
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
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }
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
  baseCategoryList = allDocuments.filter(function(doc) {
    var soKyHieu = doc.docNumber ? String(doc.docNumber).toLowerCase() : "";
    var trichYeu = doc.abstract ? String(doc.abstract).toLowerCase() : "";
    var loaiTL = doc.category ? String(doc.category).toLowerCase() : "";
    
    return soKyHieu.includes(keyword) || trichYeu.includes(keyword) || loaiTL.includes(keyword);
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

