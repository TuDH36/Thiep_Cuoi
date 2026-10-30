# Hướng dẫn dùng thiệp cưới online

## Thư mục có gì

| Thư mục / file | Dùng để |
| --- | --- |
| `info/thong-tin.js` | Toàn bộ chữ của thiệp: tên, ngày giờ, địa chỉ, các lễ, tài khoản mừng cưới. **Chỉ cần sửa file này.** |
| `images/` | Ảnh cưới, ảnh mã QR, nhạc nền. Ảnh gốc giữ nguyên; lúc đưa lên mạng tự nén cho nhẹ. |
| `xem-thu.bat` | Bấm đúp để xem thử thiệp trên máy mình. |
| `trien-khai.bat` | Bấm đúp để đưa thiệp lên mạng, hoặc cập nhật sau khi sửa. |
| `huong-dan/` | Hướng dẫn lưu lời chúc vào Google Sheet. |
| `xuat-ban/` | Bản đã nén, tự tạo ra lúc xem thử hoặc đưa lên mạng. Không cần đụng vào. |

## Đưa thiệp lên mạng lần đầu

1. Máy cần có Node.js. Nếu chưa có, tải bản **LTS** tại https://nodejs.org, cài như phần mềm bình thường.
2. Tạo tài khoản Vercel miễn phí tại https://vercel.com/signup. Đây là nơi đặt thiệp.
   - Chọn **Hobby**.
   - Đăng ký bằng email hoặc GitHub.
3. Tạo mã đăng nhập (token):
   - Mở https://vercel.com/account/settings/tokens.
   - Ở mục **Create Token**, điền tên bất kỳ (ví dụ `thiep`).
   - **Scope** chọn tài khoản của bạn, **Expiration** chọn **No Expiration**, rồi bấm **Create**.
   - Bấm **Copy** để chép mã.
4. Bấm đúp `trien-khai.bat`. Khi cửa sổ đen hỏi, bấm chuột phải hoặc Ctrl+V để dán mã, rồi bấm Enter. Mã được lưu trong file `.vercel-token`, các lần sau không hỏi lại. Đừng gửi file này cho ai.
5. Đợi khoảng một phút. Cuối cùng cửa sổ in ra link thiệp, ví dụ `https://thiep-cuoi-vu-trang.vercel.app`.

## Gửi link cho khách

- Chú rể gửi: `link-thiep/?ben=nha-trai`
- Cô dâu gửi: `link-thiep/?ben=nha-gai`
- Có tên khách: `link-thiep/?ben=nha-trai&to=Bác Hùng và gia đình`
- Nhiều khách một lúc: mở `link-thiep/tao-link.html`, dán danh sách tên (mỗi dòng một tên), bấm **Tạo link**, rồi chép từng link.

Link nhà trai hiện các lễ của nhà trai, tên chú rể đứng trước, mã QR chú rể. Link nhà gái hiện các lễ của nhà gái, tên cô dâu đứng trước, mã QR cô dâu.

## Xem ai đi, ai không đi, đọc lời chúc

Mở `link-thiep/quan-ly.html` (trang Sổ khách) và nhập mật khẩu. Chỉ gửi link này cho người nhà, không gửi khách. Cách đặt mật khẩu và cách dùng: xem `huong-dan/luu-loi-chuc.md`.

## Sửa thiệp sau khi đã đưa lên

Sửa `info/thong-tin.js` hoặc thay ảnh trong `images/` (giữ đúng tên file), rồi bấm đúp `trien-khai.bat`. Link cũ giữ nguyên, khách mở lại là thấy bản mới.

Khi sửa `thong-tin.js`, chỉ sửa chữ nằm giữa hai dấu ngoặc kép `"..."`. Giữ nguyên dấu ngoặc kép và dấu phẩy cuối dòng. Nếu lỡ sai, cửa sổ sẽ báo lỗi ở dòng nào.

## Ảnh

| Mục trong `thong-tin.js` | Ảnh hiện ở đâu |
| --- | --- |
| `anhBia` | Ảnh lớn mở đầu, chữ "Ngày chung đôi" |
| `anhChuRe`, `anhCoDau` | Hai thẻ ảnh đơn chú rể, cô dâu |
| `anhJustMarried` | Ảnh chữ "Về chung một nhà" |
| `anhLichTrinh` | Ảnh nền phần lịch trình |
| `anhCamOn` | Ảnh cuối, chữ "Cảm ơn" |
| `album` | Ba ảnh xoay vòng và trình chiếu "Kỷ niệm" |
| `mungCuoi ... anhQR` | Ảnh chụp màn hình mã QR ngân hàng (tự cắt lấy phần mã) |

Ảnh nào chưa có file thì thiệp hiện khung giữ chỗ. Bỏ ảnh đúng tên vào `images/` là ảnh tự hiện.

## Chữ trang trí

Các tiêu đề chữ viết tay ("Ngày chung đôi", "Lịch trình", "Kỷ niệm", "Cảm ơn"…) và vài câu ngắn nằm ở mục `chuTrenThiep` trong `thong-tin.js`. Sửa chữ tùy ý:

- dấu `/` là xuống dòng;
- để `""` thì ẩn dòng chữ đó;
- câu dài quá khung thì thiệp tự thu nhỏ chữ cho vừa.
