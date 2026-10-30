# Dự án thiệp cưới online (dùng lại được cho nhiều đám cưới)

## Quy tắc bắt buộc
- Toàn bộ nội dung thiệp (tên, ngày giờ, địa chỉ, các lễ, ảnh, nhạc, QR, lời mời) PHẢI đọc từ `info/thong-tin.js` (biến `window.THIEP`). KHÔNG ghi cứng nội dung nào vào HTML, CSS hay JS.
- Đổi thông tin trong `info/thong-tin.js` và thay ảnh trong `images/` là phải ra thiệp mới, không cần sửa file nào khác.
- Mục nào là chuỗi rỗng `""`, mảng rỗng `[]` hoặc `false` thì ẩn hẳn phần đó trên giao diện (không hiện ô trống, không hiện "undefined").
- `cacLe`, `album`, `cauChuyen` có thể dài ngắn tùy ý; giao diện phải tự co giãn theo số lượng.
- `taiNha` của mỗi lễ quyết định lấy địa chỉ và bản đồ của `nhaTrai`, `nhaGai`, hoặc dùng `diaDiem` khi là `"khac"`.
- Tên khách lấy từ tham số link `?to=` (ví dụ `?to=Bác Hùng và gia đình`); không có thì dùng `loiChaoMacDinh`.
- Lời mời trên tên khách chọn theo cách gọi khách:
  - xét 3 chữ đầu của tên khách;
  - gặp từ trong `kinhMoi.tu` (cô, dì, chú, bác, thím, o, ông, bà) thì dùng `kinhMoi.chu`;
  - gặp từ trong `thanMoi.tu` (anh, chị, em, bạn) thì dùng `thanMoi.chu`;
  - từ nào gặp trước thì dùng nhóm đó; không gặp thì dùng `kinhMoi.chu`.
- Gọi khách trong các câu của thiệp bằng tên ngắn của khách: bỏ phần sau "và", "cùng", "với", "&", dấu phẩy, ví dụ "Anh Tú và người thương" thành "anh Tú". Link không có tên thì gọi "quý vị".
- Gia đình tự xưng theo `xung` của nhóm khách: "gia đình cháu" với nhóm kính mời, "gia đình tôi" với nhóm thân mời. Khách không thuộc nhóm nào thì dùng `xungHo`.
- Bên gửi thiệp lấy từ `?ben=nha-trai` hoặc `?ben=nha-gai`; không có thì dùng `benMacDinh`.
  - Mỗi lễ chỉ hiện cho bên ghi trong `hienChoBen` (`"nha-trai"`, `"nha-gai"`, `"ca-hai"`).
  - Link nhà gái: tên cô dâu và nhà gái đứng trước, QR mặc định là của nhà gái.
- Ngày âm lịch hiển thị nguyên văn từ file, KHÔNG tự tính.
- Nhạc nền (`nhacNen`):
  - thử phát ngay khi mở thiệp, lặp lại liên tục cho tới khi khách bấm nút nốt nhạc để tắt;
  - trình duyệt chặn tự phát thì phát ở lần chạm, bấm hoặc gõ phím đầu tiên, và chỉ khi đó mới hiện nhãn "Chạm để nghe nhạc";
  - khách đã tự tắt thì không tự bật lại.
- Nếu `loiMoi` rỗng thì dùng một lời mời mặc định trang trọng, xưng hô theo `xungHo`.

## Quy tắc ảnh (khung giữ chỗ)
- Mọi chỗ có ảnh luôn vẽ trước một khung giữ chỗ hợp với thiết kế (nền nhạt và chữ lồng tên hai bạn).
- Ảnh thật tải được thì phủ lên khung. Thiếu file hoặc lỗi thì giữ nguyên khung, không hiện ảnh vỡ.
- Bỏ ảnh đúng tên vào `images/` là ảnh tự hiện, không cần sửa code.
- Các mục ảnh trong file thông tin:
  - `anhBia`, `anhChuRe`, `anhCoDau`, `anhJustMarried`, `anhLichTrinh`, `anhCamOn`;
  - `album`;
  - `mungCuoi.*.anhQR`.
- Ảnh nền nào để trống thì lấy tạm một ảnh trong `album`.
- Ảnh QR có thể là ảnh chụp cả màn hình app ngân hàng; lúc xuất bản công cụ tự cắt lấy phần thẻ có mã QR.

## Thiết kế
- Bố cục theo mẫu AT02 của meHappy mà người dùng đã chọn:
  - ảnh cưới lớn chiếm cả bề ngang;
  - chữ viết tay mảnh (Allison) cho các tiêu đề;
  - khách đều là người Việt nên thiệp không có chữ tiếng Anh: tiêu đề và câu trang trí lấy từ `chuTrenThiep` (dấu `/` là xuống dòng, `""` thì ẩn), lịch dùng "Tháng Mười Một", "T2 … CN";
  - chữ lớn trên một dòng (`data-fit`) tự thu nhỏ khi dài quá khung;
  - chữ serif cao hẹp (Noto Serif Display) cho tên;
  - tông xám trắng, điểm nhấn hồng san hô;
  - có hạt trắng rơi nhẹ.
- Điện thoại dùng cả bề ngang. Máy tính là một cột giữa rộng tối đa 960px; các chỗ cần thì chia hai cột (thẻ chú rể và cô dâu, form).

## Kỹ thuật
- HTML/CSS/JS thuần + GSAP:
  - `index.html`, `assets/thiep.css`, `assets/thiep.js`;
  - nạp `info/thong-tin.js` bằng thẻ `<script>` trước script chính.
- Không có bước build cho trang. Công cụ Node trong `cong-cu/` chỉ làm ba việc khi xuất bản:
  - nén ảnh;
  - cắt QR;
  - gắn ảnh xem trước cho link.
- Xuất bản và triển khai:
  - `trien-khai.bat` chạy `cong-cu/trien-khai.mjs`;
  - công cụ này tạo `xuat-ban/<tên-thiệp>/` rồi deploy thư mục đó lên Vercel;
  - lần đầu, công cụ ghi địa chỉ thiệp vào `diaChiWeb`.
- `xem-thu.bat` xem bản đã nén tại http://localhost:5173.
- Xác nhận tham dự và lời chúc:
  - được gửi tới Google Apps Script theo link trong `luuTru` (xem `huong-dan/luu-loi-chuc.md` và `huong-dan/apps-script.gs`);
  - gửi bằng POST thân chữ thường để không bị chặn CORS;
  - để trống thì chỉ hiện trên máy khách.
- Sổ khách `quan-ly.html` là trang riêng để cô dâu chú rể xem khách:
  - đọc `luuTru` từ `info/thong-tin.js` và gọi Apps Script bằng POST `loai: "quanly"` (lấy danh sách) và `loai: "anhien"` (ẩn hoặc hiện lời chúc);
  - mật khẩu `MAT_KHAU` chỉ nằm trong Apps Script, không bao giờ nằm trong file của trang (trang công khai, ai cũng tải được);
  - khách gửi nhiều lần (cùng tên, cùng tên trên link, cùng bên) thì chỉ tính lần mới nhất;
  - dữ liệu do khách nhập phải luôn được escape trước khi hiện ra.
- Ưu tiên hiển thị trên điện thoại; tôn trọng chế độ giảm chuyển động (prefers-reduced-motion).
- Nén và tải ảnh từ từ (lazy load) để thiệp mở nhanh. Ảnh gốc trong `images/` không bao giờ bị sửa.

## Cách làm việc với tôi
- Tôi không có kinh nghiệm lập trình: giải thích ngắn gọn, dễ hiểu, bằng tiếng Việt.
- Trước khi thay đổi lớn hoặc khi chưa chắc điều gì, trình bày kế hoạch và hỏi tôi xác nhận trước.
