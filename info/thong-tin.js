// ================================================================
//  THÔNG TIN THIỆP CƯỚI
//  Muốn tạo thiệp mới: chỉ cần sửa file này và thay ảnh trong /images
//
//  QUY TẮC KHI SỬA (quan trọng):
//   - Chỉ sửa chữ NẰM GIỮA hai dấu ngoặc kép "..."
//   - Giữ nguyên dấu ngoặc kép " " và dấu phẩy , ở cuối mỗi dòng
//   - Mục nào không dùng thì để rỗng "" → thiệp tự ẩn phần đó
//   - Dòng bắt đầu bằng // là ghi chú, thiệp không đọc dòng đó
//
//  HAI LINK CHO HAI BÊN:
//   - Chú rể gửi:  ten-thiep.vercel.app/?ben=nha-trai
//   - Cô dâu gửi:  ten-thiep.vercel.app/?ben=nha-gai
//   - Kèm tên khách: ten-thiep.vercel.app/?ben=nha-gai&to=Bác Hùng và gia đình
// ================================================================

window.THIEP = {

  // ---------------- PHẦN 1: THÔNG TIN CHUNG ----------------

  benMacDinh: "nha-trai",      // Bên được dùng khi link KHÔNG ghi ?ben=  ("nha-trai" | "nha-gai")

  chuRe: {
    hoTen: "Đỗ Nguyễn Vũ",
    tenHienThi: "Nguyễn Vũ",
    thuBac: "",                // VD: "Trưởng nam"  (để "" nếu không ghi)
  },

  coDau: {
    hoTen: "Hà Trần Thùy Trang",
    tenHienThi: "Thùy Trang",
    thuBac: "",                // VD: "Thứ nữ"
  },

  logo: "Vũ & Trang",


  // ---------------- PHẦN 2: GIA ĐÌNH HAI BÊN ----------------

  nhaTrai: {
    ong: "Đỗ Nguyễn Minh",
    ba: "Lê Thị Đạo",
    diaChi: "Số nhà 11 đường Mậu Khê, thôn Bằng Trình, xã Thiệu Quang, tỉnh Thanh Hóa",
    banDo: "",                 // Link Google Maps (Google Maps → Chia sẻ → Sao chép đường liên kết)
    dienThoai: "",
  },

  nhaGai: {
    ong: "Hà Văn Thanh",
    ba: "Trần Thị Hằng",
    diaChi: "Số nhà 05 tổ dân phố Thiệu Tân, phường Đông Tiến, tỉnh Thanh Hóa",
    banDo: "",
    dienThoai: "",
  },


  // ---------------- PHẦN 3: CÁC LỄ VÀ TIỆC ----------------
  //  Mỗi lễ là một khối { ... },  xếp theo đúng thứ tự thời gian
  //  taiNha:     tổ chức ở đâu → "nha-trai" | "nha-gai" | "khac" (khac = dùng diaDiem)
  //  hienChoBen: link nào thấy lễ này → "nha-trai" | "nha-gai" | "ca-hai"

  cacLe: [
    {
      ten: "Lễ Nạp Tài",
      gio: "08:00",
      thu: "Thứ Năm",
      ngayDuong: "12/11/2026",
      ngayAm: "04 tháng 10 năm Bính Ngọ",
      taiNha: "nha-gai",
      diaDiem: "",
      hienChoBen: "ca-hai",
    },

    // Bữa cơm: mỗi bên tổ chức ở nhà mình, cùng giờ
    {
      ten: "Bữa Cơm Thân Mật",
      gio: "17:00",
      thu: "Thứ Sáu",
      ngayDuong: "13/11/2026",
      ngayAm: "05 tháng 10 năm Bính Ngọ",
      taiNha: "nha-trai",
      diaDiem: "",
      hienChoBen: "nha-trai",
    },
    {
      ten: "Bữa Cơm Thân Mật",
      gio: "17:00",
      thu: "Thứ Sáu",
      ngayDuong: "13/11/2026",
      ngayAm: "05 tháng 10 năm Bính Ngọ",
      taiNha: "nha-gai",
      diaDiem: "",
      hienChoBen: "nha-gai",
    },

    // Lễ cưới: cùng một thời điểm, nhà trai gọi là Thành Hôn, nhà gái gọi là Vu Quy
    {
      ten: "Lễ Thành Hôn",
      gio: "10:00",
      thu: "Thứ Bảy",
      ngayDuong: "14/11/2026",
      ngayAm: "06 tháng 10 năm Bính Ngọ",
      taiNha: "nha-trai",
      diaDiem: "",
      hienChoBen: "nha-trai",
    },
    {
      ten: "Lễ Vu Quy",
      gio: "10:00",
      thu: "Thứ Bảy",
      ngayDuong: "14/11/2026",
      ngayAm: "06 tháng 10 năm Bính Ngọ",
      taiNha: "nha-gai",
      diaDiem: "",
      hienChoBen: "nha-gai",
    },
  ],

  // Đồng hồ đếm ngược. Viết đúng dạng "năm-tháng-ngày giờ:phút"
  demNguocDen: "2026-11-13 17:00",   // Bữa Cơm Thân Mật


  // ---------------- PHẦN 4: NỘI DUNG THIỆP ONLINE ----------------

  xungHo: "chúng tôi",         // "chúng tôi" (trang trọng) | "chúng mình" (bạn bè)
  loiChaoMacDinh: "Quý khách", // Hiện khi link không có tên khách
  loiMoi: "",                  // Để "" nếu muốn Claude viết giúp

  // Lời mời đứng trên tên khách, chọn theo cách gọi khách trong link (?to=...)
  // Thiệp xét 3 chữ đầu của tên khách, gặp từ thuộc nhóm nào trước thì dùng lời mời của nhóm đó.
  // VD: "Bác Hùng và gia đình" → kính mời;  "Vợ chồng anh Tuấn" → thân mời.
  // Không gặp từ nào (VD "Quý khách") → dùng kinhMoi. Muốn thêm cách gọi (cậu, mợ, dượng...) thì thêm vào danh sách.
  // xung: gia đình tự xưng với nhóm khách đó, VD "gia đình cháu", "gia đình tôi".
  //       Khách không thuộc nhóm nào (VD "Quý khách") thì dùng xungHo ở trên.
  kinhMoi: { chu: "Trân trọng kính mời", xung: "cháu", tu: ["cô", "dì", "chú", "bác", "thím", "o", "ông", "bà"] },
  thanMoi: { chu: "Trân trọng thân mời", xung: "tôi", tu: ["anh", "chị", "em", "bạn"] },

  // Chữ trang trí trên thiệp: các tiêu đề chữ viết tay và vài câu ngắn. Sửa chữ tùy ý.
  // Dấu / là xuống dòng. Mục nào để "" thì thiệp ẩn dòng chữ đó.
  chuTrenThiep: {
    bia: "Ngày chung đôi",                                        // Chữ viết tay lớn trên ảnh bìa
    haiTraiTim: "Hai trái tim / chung một nhịp",                  // Câu lớn phía trên ảnh chú rể, cô dâu
    haiTraiTimPhu: "Cùng nhau vun đắp / một tình yêu trọn đời",   // Câu nhỏ ngay dưới
    vuaCuoi: "Về chung / một nhà",                                // Chữ trên ảnh anhJustMarried: trước dấu / viết tay, sau dấu / chữ in
    demNguoc: "Ngày vui chỉ còn",                                 // Câu phía trên đồng hồ đếm ngược
    lichTrinh: "Lịch trình",
    album: "Kỷ niệm",
    xacNhan: "Xác nhận tham dự",
    loiChuc: "Lời chúc phúc",
    coNhau: "Có nhau / là có một mái nhà / một trái tim / và trọn một đời", // Câu thơ ngay trước ảnh cuối: phần đầu viết tay, các phần sau là từng dòng
    camOn: "Cảm ơn",                                              // Chữ viết tay lớn trên ảnh cuối
    mungCuoi: "Hộp mừng cưới",                                    // Tiêu đề khung mã QR mừng cưới
  },

  // Ảnh: để "" thì thiệp hiện khung giữ chỗ (hoặc ẩn phần đó)
  anhBia: "images/bia.jpg",            // Ảnh lớn mở đầu thiệp (chữ "Ngày chung đôi")
  anhChuRe: "images/don_re.jpg",       // Ảnh đơn chú rể
  anhCoDau: "images/don_dau.jpg",      // Ảnh đơn cô dâu
  anhJustMarried: "images/3.jpg",      // Ảnh nền chữ "Về chung một nhà"
  anhLichTrinh: "images/1.jpg",        // Ảnh nền phần lịch trình
  anhCamOn: "images/5.jpg",            // Ảnh cuối thiệp (chữ "Cảm ơn")
  album: [                             // Album ảnh, ảnh đầu tiên hiện giữa
    "images/6.jpg",
    "images/1.jpg",
    "images/2.jpg",
    "images/3.jpg",
    "images/4.jpg",
    "images/5.jpg",
  ],
  // Nhạc nền: tự phát khi mở thiệp và lặp lại liên tục; khách bấm nút nốt nhạc góc trái dưới để tắt / bật.
  // Máy nào chặn tự phát (iPhone, nhiều điện thoại) thì nhạc phát ngay ở lần chạm đầu tiên vào thiệp.
  // Bỏ file .mp3 vào thư mục musics/ rồi ghi đúng tên file ở đây (để "" thì thiệp không có nhạc).
  // Cũng có thể dán link trực tiếp tới một file .mp3 trên mạng (link YouTube, Zing MP3 thì không dùng được).
  nhacNen: "musics/Beautiful In White.mp3",

  // Câu chuyện tình yêu. Muốn dùng thì bỏ dấu // ở đầu dòng và điền vào
  cauChuyen: [
    // { moc: "2020", suKien: "Lần đầu gặp nhau ở ...", anh: "images/2020.jpg" },
  ],

  // Hộp mừng cưới: link nhà trai hiện QR nhà trai, link nhà gái hiện QR nhà gái
  // Bên nào để anhQR: "" thì link bên đó ẩn phần mừng cưới
  mungCuoi: {
    nhaTrai: { anhQR: "images/qr-nha-trai.png", nganHang: "Techcombank", soTaiKhoan: "19036151248018", chuTaiKhoan: "DO NGUYEN VU" },
    nhaGai:  { anhQR: "images/qr-nha-gai.png", nganHang: "", soTaiKhoan: "5513022006", chuTaiKhoan: "HA TRAN THUY TRANG" },
  },

  // Bật / tắt tính năng: true = bật, false = tắt (không có dấu ngoặc kép)
  xacNhanThamDu: true,
  hanXacNhan: "",              // VD: "08/11/2026"
  soLoiChuc: true,

  // Nơi lưu xác nhận và lời chúc (link Google Sheet, xem huong-dan/luu-loi-chuc.md)
  // Để "" thì khách vẫn gửi được nhưng chỉ hiện trên máy của khách, gia đình không nhận được
  luuTru: "https://script.google.com/macros/s/AKfycbyrVUkdBZ8L343T9HZjkWvg3WwGZk4YvgmFGKukrRek1x3ep9XfYSsz9X6lsV7ggiY_IQ/exec",

  // Địa chỉ thiệp sau khi đưa lên mạng, VD: "https://thiep-cuoi-vu-trang.vercel.app"
  // Dùng để hiện ảnh xem trước khi gửi link qua Zalo, Facebook, Messenger
  diaChiWeb: "https://thiep-cuoi-vu-trang-mauve.vercel.app",
};