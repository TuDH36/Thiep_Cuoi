# Lưu xác nhận tham dự và lời chúc vào Google Sheet

Nếu chưa cài phần này, khách vẫn bấm gửi được, nhưng lời chúc chỉ hiện trên máy của khách đó. Gia đình sẽ không nhận được gì.

Cài một lần, mất khoảng 10 phút, miễn phí. Bạn cần một tài khoản Google (Gmail).

## Các bước

1. Mở https://sheets.google.com và tạo một bảng tính trống. Đặt tên, ví dụ "Thiệp cưới Vũ Trang".
2. Trên thanh menu của bảng tính, chọn **Tiện ích mở rộng → Apps Script**. Một trang mới mở ra.
3. Xóa hết chữ có sẵn trong ô soạn thảo. Mở file `huong-dan/apps-script.gs` trong thư mục thiệp, chép toàn bộ nội dung rồi dán vào ô soạn thảo đó.
4. Đặt mật khẩu cho trang Sổ khách: tìm dòng `const MAT_KHAU = "";` ở gần đầu, gõ mật khẩu vào giữa hai dấu ngoặc kép, ví dụ `const MAT_KHAU = "trang-vu-cuoi";`.
   - Chỉ gõ mật khẩu trong trang Apps Script, không cần sửa file trên máy.
   - Đừng dùng ngày cưới hay tên hai bạn, vì khách dễ đoán.
5. Bấm biểu tượng đĩa mềm (Lưu).
6. Bấm nút xanh **Triển khai** ở góc phải trên, chọn **Tùy chọn triển khai mới**, rồi điền:
   - bánh răng cạnh "Chọn loại": chọn **Ứng dụng web**;
   - "Thực thi với tư cách": **Tôi**;
   - "Người có quyền truy cập": **Bất kỳ ai**.
7. Bấm **Triển khai**. Google sẽ hỏi cấp quyền:
   - bấm **Cấp quyền truy cập** rồi chọn tài khoản của bạn;
   - nếu hiện "Google chưa xác minh ứng dụng này", bấm **Nâng cao → Đi tới … (không an toàn)**. Ứng dụng này do chính bạn tạo nên không sao;
   - bấm **Cho phép**.
8. Chép **URL ứng dụng web**. Đó là một link dài bắt đầu bằng `https://script.google.com/macros/s/` và kết thúc bằng `/exec`.
9. Mở `info/thong-tin.js` và dán link đó vào mục `luuTru` (giữ dấu ngoặc kép):

   ```js
   luuTru: "https://script.google.com/macros/s/....../exec",
   ```

10. Chạy lại `trien-khai.bat` để cập nhật thiệp trên mạng.

## Đã cài từ trước, giờ cập nhật mã mới (để dùng trang Sổ khách)

1. Mở bảng tính, chọn **Tiện ích mở rộng → Apps Script**.
2. Xóa hết mã cũ, dán toàn bộ mã mới trong `huong-dan/apps-script.gs`.
3. Đặt mật khẩu ở dòng `const MAT_KHAU = "";` như bước 4 ở trên, rồi bấm Lưu.
4. Bấm **Triển khai → Quản lý các lần triển khai**:
   - bấm biểu tượng bút chì (Chỉnh sửa);
   - ở ô **Phiên bản**, chọn **Phiên bản mới**;
   - bấm **Triển khai**.
5. Link `/exec` giữ nguyên, không cần sửa thiệp.

Lưu ý: nếu chọn "Tùy chọn triển khai mới" thay vì sửa lần triển khai cũ, Google sẽ tạo link `/exec` khác. Khi đó phải dán link mới vào `luuTru` rồi chạy lại `trien-khai.bat`.

## Xem khách: trang Sổ khách

Mở `địa-chỉ-thiệp/quan-ly.html`, ví dụ https://thiep-cuoi-vu-trang-mauve.vercel.app/quan-ly.html, rồi nhập mật khẩu đã đặt ở trên.

- **Con số tổng:** bao nhiêu người sẽ đến, bao nhiêu khách báo bận, bao nhiêu lời chúc. Có số người theo từng lễ và theo từng bên.
- **Chọn bên:** "Nhà trai" hoặc "Nhà gái" để chỉ xem khách của link bên đó.
- **Thẻ Tham dự:** danh sách khách, tìm được theo tên hoặc số điện thoại. Bấm vào số điện thoại để gọi.
- **Thẻ Lời chúc:** bấm "Ẩn khỏi thiệp" để giấu một lời chúc khỏi thiệp, bấm "Hiện lại" để hiện lại.
- **Gửi nhiều lần:** khách gửi nhiều lần (cùng tên, cùng link) thì chỉ tính lần mới nhất.
- **Chia sẻ:** gửi link và mật khẩu cho người nhà cùng xem. Đừng gửi cho khách.
- **Đổi mật khẩu:** sửa dòng `MAT_KHAU` trong Apps Script rồi làm lại bước 4 của phần "cập nhật mã mới".

Bảng tính vẫn là nơi lưu gốc:
- xác nhận tham dự nằm ở trang **Xac nhan**, lời chúc nằm ở trang **Loi chuc**;
- có thể ẩn lời chúc bằng cách đổi ô cột **Hiện** từ `CO` thành `KHONG`.
